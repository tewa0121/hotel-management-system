const express = require('express');
const { pool } = require('../config/database');
const { verifyToken, authorize } = require('../middleware/auth');
const { createNotification } = require('./notificationRoutes'); // ✅ Add this

const router = express.Router();

// ============================================
// GET all payments
// ============================================
router.get('/', verifyToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
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
        params.push(limit, (page - 1) * limit);

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

// ============================================
// GET payments by reservation
// ============================================
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

// ============================================
// POST create payment
// ============================================
router.post('/', verifyToken, authorize('admin', 'manager', 'receptionist', 'accountant'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        console.log('📤 Payment request:', req.body);

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

        if (!reservation_id) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Reservation ID is required'
            });
        }

        if (!guest_id) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Guest ID is required'
            });
        }

        if (!amount || parseFloat(amount) <= 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required'
            });
        }

        if (!payment_method) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Payment method is required'
            });
        }

        const [reservation] = await connection.execute(
            'SELECT total_amount, deposit_paid, balance, payment_status, guest_id FROM reservations WHERE id = ?',
            [reservation_id]
        );

        if (reservation.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        if (reservation[0].guest_id !== parseInt(guest_id)) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Guest does not match this reservation'
            });
        }

        const currentBalance = parseFloat(reservation[0].balance) || 0;
        const depositPaid = parseFloat(reservation[0].deposit_paid) || 0;
        const totalAmount = parseFloat(reservation[0].total_amount) || 0;
        const paymentAmount = parseFloat(amount);

        const newDepositPaid = depositPaid + paymentAmount;
        const newBalance = currentBalance - paymentAmount;
        let paymentStatus = 'pending';
        
        if (newBalance <= 0) {
            paymentStatus = 'paid';
        } else if (newDepositPaid > 0) {
            paymentStatus = 'partial';
        }

        console.log('📊 Payment calculation:', {
            currentBalance,
            depositPaid,
            totalAmount,
            paymentAmount,
            newDepositPaid,
            newBalance,
            paymentStatus
        });

        const [result] = await connection.execute(
            `INSERT INTO payments (
                reservation_id, guest_id, amount, currency, payment_method,
                reference_number, status, received_by, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                reservation_id,
                guest_id,
                paymentAmount,
                currency || 'USD',
                payment_method,
                reference_number || null,
                status || 'completed',
                req.user.id,
                notes || null
            ]
        );

        await connection.execute(
            `UPDATE reservations SET
                deposit_paid = ?,
                balance = ?,
                payment_status = ?
            WHERE id = ?`,
            [newDepositPaid, newBalance, paymentStatus, reservation_id]
        );

        await connection.execute(
            'UPDATE guests SET total_spent = total_spent + ? WHERE id = ?',
            [paymentAmount, guest_id]
        );

        await connection.commit();

        const [newPayment] = await connection.execute(`
            SELECT p.*, u.name as received_by_name
            FROM payments p
            LEFT JOIN users u ON p.received_by = u.id
            WHERE p.id = ?
        `, [result.insertId]);

        console.log('✅ Payment created:', newPayment[0]);

        // ✅ Create notification for payment
        await createNotification(
            req.user.id,
            `Payment of $${paymentAmount.toFixed(2)} received from guest for reservation #${reservation[0].reservation_number || reservation_id}`,
            'payment',
            `/payments/${result.insertId}`
        );

        res.status(201).json({
            success: true,
            message: 'Payment recorded successfully',
            data: newPayment[0]
        });
    } catch (error) {
        await connection.rollback();
        console.error('❌ Payment error:', error);
        console.error('❌ Error details:', error.message);
        
        res.status(500).json({
            success: false,
            message: 'Error recording payment',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        connection.release();
    }
});

// ============================================
// GET single payment
// ============================================
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

// ============================================
// POST refund payment
// ============================================
router.post('/:id/refund', verifyToken, authorize('admin', 'manager', 'accountant'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const paymentId = req.params.id;
        const { reason } = req.body;

        console.log('=========================================');
        console.log(`📤 REFUNDING PAYMENT ${paymentId}`);
        console.log('📤 Reason:', reason || 'No reason provided');

        const [payment] = await connection.execute(
            'SELECT * FROM payments WHERE id = ?',
            [paymentId]
        );

        if (payment.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: `Payment with ID ${paymentId} not found`
            });
        }

        const paymentData = payment[0];
        console.log('📊 Payment:', paymentData);

        if (paymentData.status === 'refunded') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Payment already refunded'
            });
        }

        if (paymentData.status !== 'completed') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Only completed payments can be refunded'
            });
        }

        const [reservation] = await connection.execute(
            'SELECT * FROM reservations WHERE id = ?',
            [paymentData.reservation_id]
        );

        if (reservation.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        const reservationData = reservation[0];
        console.log('📊 Reservation:', reservationData);

        const paymentAmount = parseFloat(paymentData.amount) || 0;
        const currentDepositPaid = parseFloat(reservationData.deposit_paid) || 0;
        const currentBalance = parseFloat(reservationData.balance) || 0;
        const totalAmount = parseFloat(reservationData.total_amount) || 0;

        console.log('📊 Values:', { 
            paymentAmount, 
            currentDepositPaid, 
            currentBalance, 
            totalAmount 
        });

        let newDepositPaid = currentDepositPaid - paymentAmount;
        let newBalance = currentBalance + paymentAmount;
        
        if (newDepositPaid < 0) {
            console.log('⚠️ newDepositPaid was negative, setting to 0');
            newDepositPaid = 0;
        }
        if (newBalance < 0) {
            console.log('⚠️ newBalance was negative, setting to 0');
            newBalance = 0;
        }
        
        let paymentStatus = 'pending';
        if (newDepositPaid >= totalAmount) {
            paymentStatus = 'paid';
        } else if (newDepositPaid > 0) {
            paymentStatus = 'partial';
        }

        console.log('📊 New values:', { 
            newDepositPaid, 
            newBalance, 
            paymentStatus 
        });

        const refundNote = ` Refunded: ${reason || 'No reason provided'}`;
        await connection.execute(
            `UPDATE payments SET 
                status = 'refunded',
                notes = CONCAT(IFNULL(notes, ''), ?)
            WHERE id = ?`,
            [refundNote, paymentId]
        );

        await connection.execute(
            `UPDATE reservations SET 
                deposit_paid = ?,
                balance = ?,
                payment_status = ?
            WHERE id = ?`,
            [newDepositPaid, newBalance, paymentStatus, paymentData.reservation_id]
        );

        await connection.commit();

        // ✅ Create notification for refund
        await createNotification(
            req.user.id,
            `Payment #${paymentId} refunded - ${reason || 'No reason provided'}`,
            'payment',
            `/payments/${paymentId}`
        );

        console.log('✅✅✅ REFUND SUCCESSFUL');
        console.log('=========================================');

        res.json({
            success: true,
            message: 'Payment refunded successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error refunding payment:', error);
        console.error('❌ Error details:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error refunding payment',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

module.exports = router;