const express = require('express');
const { pool } = require('../config/db');
const { verifyToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all payments
router.get('/', verifyToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const status = req.query.status || '';

        let query = `
            SELECT p.*, 
                   g.first_name, g.last_name,
                   r.reservation_number,
                   u.name as received_by_name
            FROM payments p
            LEFT JOIN guests g ON p.guest_id = g.id
            LEFT JOIN reservations r ON p.reservation_id = r.id
            LEFT JOIN users u ON p.received_by = u.id
            WHERE 1=1
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM payments WHERE 1=1';
        const params = [];

        if (status) {
            query += ' AND p.status = ?';
            countQuery += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [payments] = await pool.execute(query, params);
        const [countResult] = await pool.execute(countQuery, params.slice(0, params.length - 2));

        res.json({
            success: true,
            data: payments,
            pagination: {
                page,
                limit,
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payments'
        });
    }
});

// Get payments by reservation
router.get('/reservation/:reservationId', verifyToken, async (req, res) => {
    try {
        const [payments] = await pool.execute(
            `SELECT p.*, u.name as received_by_name
             FROM payments p
             LEFT JOIN users u ON p.received_by = u.id
             WHERE p.reservation_id = ?
             ORDER BY p.created_at DESC`,
            [req.params.reservationId]
        );

        res.json({
            success: true,
            data: payments
        });
    } catch (error) {
        console.error('Error fetching reservation payments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reservation payments'
        });
    }
});

// Create payment
router.post('/', verifyToken, authorize('admin', 'manager', 'receptionist', 'accountant'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            reservation_id,
            guest_id,
            amount,
            currency,
            payment_method,
            reference_number,
            status,
            notes
        } = req.body;

        // Validate required fields
        if (!reservation_id || !guest_id || !amount || !payment_method) {
            return res.status(400).json({
                success: false,
                message: 'Reservation ID, Guest ID, Amount, and Payment Method are required'
            });
        }

        // Get reservation details
        const [reservation] = await connection.execute(
            'SELECT total_amount, deposit_paid, balance, payment_status FROM reservations WHERE id = ?',
            [reservation_id]
        );

        if (reservation.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        const currentBalance = reservation[0].balance;
        const newDepositPaid = reservation[0].deposit_paid + amount;
        const newBalance = currentBalance - amount;
        let newPaymentStatus = 'partial';

        if (newBalance <= 0) {
            newPaymentStatus = 'paid';
        } else if (newDepositPaid > 0) {
            newPaymentStatus = 'partial';
        } else {
            newPaymentStatus = 'pending';
        }

        // Insert payment
        const [result] = await connection.execute(
            `INSERT INTO payments (
                reservation_id, guest_id, amount, currency, payment_method,
                reference_number, status, received_by, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                reservation_id, guest_id, amount, currency || 'USD',
                payment_method, reference_number || null,
                status || 'completed', req.user.id, notes || null
            ]
        );

        // Update reservation payment status
        await connection.execute(
            `UPDATE reservations SET
                deposit_paid = ?,
                balance = ?,
                payment_status = ?
            WHERE id = ?`,
            [newDepositPaid, newBalance, newPaymentStatus, reservation_id]
        );

        await connection.commit();

        const [newPayment] = await connection.execute(`
            SELECT p.*, u.name as received_by_name
            FROM payments p
            LEFT JOIN users u ON p.received_by = u.id
            WHERE p.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Payment recorded successfully',
            data: newPayment[0]
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error recording payment'
        });
    } finally {
        connection.release();
    }
});

// Get single payment
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [payments] = await pool.execute(`
            SELECT p.*, 
                   g.first_name, g.last_name,
                   r.reservation_number,
                   u.name as received_by_name
            FROM payments p
            LEFT JOIN guests g ON p.guest_id = g.id
            LEFT JOIN reservations r ON p.reservation_id = r.id
            LEFT JOIN users u ON p.received_by = u.id
            WHERE p.id = ?
        `, [req.params.id]);

        if (payments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        res.json({
            success: true,
            data: payments[0]
        });
    } catch (error) {
        console.error('Error fetching payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment'
        });
    }
});

// Refund payment
router.post('/:id/refund', verifyToken, authorize('admin', 'manager', 'accountant'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { reason } = req.body;

        const [payment] = await connection.execute(
            'SELECT reservation_id, guest_id, amount, status FROM payments WHERE id = ?',
            [req.params.id]
        );

        if (payment.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        if (payment[0].status === 'refunded') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Payment already refunded'
            });
        }

        // Update payment status
        await connection.execute(
            'UPDATE payments SET status = ?, notes = CONCAT(notes, ?) WHERE id = ?',
            ['refunded', ` Refunded: ${reason || 'No reason provided'}`, req.params.id]
        );

        // Update reservation balance
        const [reservation] = await connection.execute(
            'SELECT deposit_paid, balance, total_amount FROM reservations WHERE id = ?',
            [payment[0].reservation_id]
        );

        const newDepositPaid = reservation[0].deposit_paid - payment[0].amount;
        const newBalance = reservation[0].balance + payment[0].amount;
        let newPaymentStatus = 'pending';

        if (newDepositPaid >= reservation[0].total_amount) {
            newPaymentStatus = 'paid';
        } else if (newDepositPaid > 0) {
            newPaymentStatus = 'partial';
        }

        await connection.execute(
            `UPDATE reservations SET
                deposit_paid = ?,
                balance = ?,
                payment_status = ?
            WHERE id = ?`,
            [newDepositPaid, newBalance, newPaymentStatus, payment[0].reservation_id]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Payment refunded successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error refunding payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error refunding payment'
        });
    } finally {
        connection.release();
    }
});

module.exports = router;