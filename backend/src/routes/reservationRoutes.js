const express = require('express');
const { pool } = require('../config/db');
const { verifyToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Generate reservation number
const generateReservationNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `RES-${year}${month}${day}-${random}`;
};

// Get all reservations
router.get('/', verifyToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const status = req.query.status || '';
        const date = req.query.date || '';

        let query = `
            SELECT r.*, 
                   g.first_name, g.last_name, g.email, g.phone,
                   rm.room_number, rm.status as room_status,
                   rt.name as room_type_name
            FROM reservations r
            LEFT JOIN guests g ON r.guest_id = g.id
            LEFT JOIN rooms rm ON r.room_id = rm.id
            LEFT JOIN room_types rt ON rm.room_type_id = rt.id
            WHERE 1=1
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM reservations WHERE 1=1';
        const params = [];

        if (status) {
            query += ' AND r.reservation_status = ?';
            countQuery += ' AND reservation_status = ?';
            params.push(status);
        }

        if (date) {
            query += ' AND (r.check_in_date = ? OR r.check_out_date = ?)';
            countQuery += ' AND (check_in_date = ? OR check_out_date = ?)';
            params.push(date, date);
        }

        query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [reservations] = await pool.execute(query, params);
        const [countResult] = await pool.execute(countQuery, params.slice(0, params.length - 2));

        res.json({
            success: true,
            data: reservations,
            pagination: {
                page,
                limit,
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching reservations:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reservations'
        });
    }
});

// Get available rooms for a date range
router.post('/available-rooms', verifyToken, async (req, res) => {
    try {
        const { check_in_date, check_out_date, room_type_id, guests } = req.body;

        if (!check_in_date || !check_out_date) {
            return res.status(400).json({
                success: false,
                message: 'Check-in and check-out dates are required'
            });
        }

        let query = `
            SELECT r.*, rt.name as room_type_name, rt.base_price, rt.max_occupancy
            FROM rooms r
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
            WHERE r.is_active = TRUE
            AND r.status NOT IN ('maintenance', 'out_of_service')
            AND r.id NOT IN (
                SELECT room_id FROM reservations 
                WHERE reservation_status IN ('confirmed', 'checked_in')
                AND (
                    (check_in_date <= ? AND check_out_date > ?) OR
                    (check_in_date < ? AND check_out_date >= ?) OR
                    (check_in_date >= ? AND check_out_date <= ?)
                )
            )
        `;

        const params = [
            check_out_date, check_in_date,
            check_out_date, check_in_date,
            check_in_date, check_out_date
        ];

        if (room_type_id) {
            query += ' AND r.room_type_id = ?';
            params.push(room_type_id);
        }

        if (guests) {
            query += ' AND rt.max_occupancy >= ?';
            params.push(guests);
        }

        query += ' ORDER BY r.room_number';

        const [rooms] = await pool.execute(query, params);

        res.json({
            success: true,
            data: rooms
        });
    } catch (error) {
        console.error('Error fetching available rooms:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching available rooms'
        });
    }
});

// Create reservation
router.post('/', verifyToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            guest_id,
            room_id,
            check_in_date,
            check_out_date,
            adults,
            children,
            rate,
            discount,
            tax,
            total_amount,
            deposit_paid,
            source,
            special_requests,
            notes
        } = req.body;

        // Validate required fields
        if (!guest_id || !room_id || !check_in_date || !check_out_date || !rate) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Check if room is available
        const [roomCheck] = await connection.execute(
            `SELECT id, status FROM rooms WHERE id = ? AND is_active = TRUE`,
            [room_id]
        );

        if (roomCheck.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Room not found or inactive'
            });
        }

        if (roomCheck[0].status === 'maintenance' || roomCheck[0].status === 'out_of_service') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Room is not available'
            });
        }

        // Check for overlapping reservations
        const [overlap] = await connection.execute(
            `SELECT COUNT(*) as count FROM reservations 
             WHERE room_id = ? 
             AND reservation_status IN ('confirmed', 'checked_in')
             AND (
                 (check_in_date <= ? AND check_out_date > ?) OR
                 (check_in_date < ? AND check_out_date >= ?) OR
                 (check_in_date >= ? AND check_out_date <= ?)
             )`,
            [room_id, check_out_date, check_in_date, check_out_date, check_in_date, check_in_date, check_out_date]
        );

        if (overlap[0].count > 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Room is already booked for these dates'
            });
        }

        // Generate reservation number
        const reservation_number = generateReservationNumber();
        const balance = total_amount - (deposit_paid || 0);

        // Create reservation
        const [result] = await connection.execute(
            `INSERT INTO reservations (
                reservation_number, guest_id, room_id, check_in_date, check_out_date,
                adults, children, rate, discount, tax, total_amount,
                deposit_paid, balance, payment_status, source,
                special_requests, notes, reservation_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                reservation_number, guest_id, room_id, check_in_date, check_out_date,
                adults || 1, children || 0, rate, discount || 0, tax || 0, total_amount,
                deposit_paid || 0, balance,
                deposit_paid > 0 ? (deposit_paid >= total_amount ? 'paid' : 'partial') : 'pending',
                source || 'direct', special_requests || null, notes || null,
                deposit_paid > 0 ? 'confirmed' : 'pending'
            ]
        );

        // Update room status
        await connection.execute(
            'UPDATE rooms SET status = ? WHERE id = ?',
            ['reserved', room_id]
        );

        // Update guest total stays
        await connection.execute(
            'UPDATE guests SET total_stays = total_stays + 1 WHERE id = ?',
            [guest_id]
        );

        await connection.commit();

        const [newReservation] = await connection.execute(`
            SELECT r.*, g.first_name, g.last_name, rm.room_number
            FROM reservations r
            LEFT JOIN guests g ON r.guest_id = g.id
            LEFT JOIN rooms rm ON r.room_id = rm.id
            WHERE r.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Reservation created successfully',
            data: newReservation[0]
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating reservation:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating reservation'
        });
    } finally {
        connection.release();
    }
});

// Get single reservation
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [reservations] = await pool.execute(`
            SELECT r.*, 
                   g.first_name, g.last_name, g.email, g.phone,
                   rm.room_number, rm.status as room_status,
                   rt.name as room_type_name
            FROM reservations r
            LEFT JOIN guests g ON r.guest_id = g.id
            LEFT JOIN rooms rm ON r.room_id = rm.id
            LEFT JOIN room_types rt ON rm.room_type_id = rt.id
            WHERE r.id = ?
        `, [req.params.id]);

        if (reservations.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        res.json({
            success: true,
            data: reservations[0]
        });
    } catch (error) {
        console.error('Error fetching reservation:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reservation'
        });
    }
});

// Update reservation
router.put('/:id', verifyToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            check_in_date,
            check_out_date,
            adults,
            children,
            rate,
            discount,
            tax,
            total_amount,
            deposit_paid,
            source,
            special_requests,
            notes,
            reservation_status
        } = req.body;

        const [result] = await connection.execute(
            `UPDATE reservations SET
                check_in_date = ?,
                check_out_date = ?,
                adults = ?,
                children = ?,
                rate = ?,
                discount = ?,
                tax = ?,
                total_amount = ?,
                deposit_paid = ?,
                balance = ?,
                source = ?,
                special_requests = ?,
                notes = ?,
                reservation_status = ?
            WHERE id = ?`,
            [
                check_in_date, check_out_date, adults || 1, children || 0,
                rate, discount || 0, tax || 0, total_amount,
                deposit_paid || 0, total_amount - (deposit_paid || 0),
                source || 'direct', special_requests || null,
                notes || null, reservation_status, req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        await connection.commit();

        const [updatedReservation] = await connection.execute(`
            SELECT r.*, g.first_name, g.last_name, rm.room_number
            FROM reservations r
            LEFT JOIN guests g ON r.guest_id = g.id
            LEFT JOIN rooms rm ON r.room_id = rm.id
            WHERE r.id = ?
        `, [req.params.id]);

        res.json({
            success: true,
            message: 'Reservation updated successfully',
            data: updatedReservation[0]
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating reservation:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating reservation'
        });
    } finally {
        connection.release();
    }
});

// Cancel reservation
router.post('/:id/cancel', verifyToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [reservation] = await connection.execute(
            'SELECT room_id, reservation_status FROM reservations WHERE id = ?',
            [req.params.id]
        );

        if (reservation.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        if (reservation[0].reservation_status === 'checked_in') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel a checked-in reservation'
            });
        }

        await connection.execute(
            'UPDATE reservations SET reservation_status = ? WHERE id = ?',
            ['cancelled', req.params.id]
        );

        // Update room status back to available
        await connection.execute(
            'UPDATE rooms SET status = ? WHERE id = ?',
            ['available', reservation[0].room_id]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Reservation cancelled successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error cancelling reservation:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling reservation'
        });
    } finally {
        connection.release();
    }
});

// Check-in
router.post('/:id/check-in', verifyToken, authorize('admin', 'manager', 'receptionist'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [reservation] = await connection.execute(
            'SELECT room_id, reservation_status FROM reservations WHERE id = ?',
            [req.params.id]
        );

        if (reservation.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        if (reservation[0].reservation_status === 'checked_in') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Guest is already checked in'
            });
        }

        if (reservation[0].reservation_status === 'cancelled') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Cannot check in a cancelled reservation'
            });
        }

        await connection.execute(
            `UPDATE reservations SET 
                reservation_status = ?,
                checked_in_at = NOW()
            WHERE id = ?`,
            ['checked_in', req.params.id]
        );

        await connection.execute(
            'UPDATE rooms SET status = ? WHERE id = ?',
            ['occupied', reservation[0].room_id]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Guest checked in successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error checking in:', error);
        res.status(500).json({
            success: false,
            message: 'Error during check-in'
        });
    } finally {
        connection.release();
    }
});

// Check-out
router.post('/:id/check-out', verifyToken, authorize('admin', 'manager', 'receptionist'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [reservation] = await connection.execute(
            'SELECT room_id, reservation_status FROM reservations WHERE id = ?',
            [req.params.id]
        );

        if (reservation.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        if (reservation[0].reservation_status !== 'checked_in') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Guest is not checked in'
            });
        }

        await connection.execute(
            `UPDATE reservations SET 
                reservation_status = ?,
                checked_out_at = NOW()
            WHERE id = ?`,
            ['checked_out', req.params.id]
        );

        // Update room to dirty for housekeeping
        await connection.execute(
            'UPDATE rooms SET status = ?, housekeeping_status = ? WHERE id = ?',
            ['dirty', 'dirty', reservation[0].room_id]
        );

        // Create housekeeping task automatically
        await connection.execute(
            `INSERT INTO housekeeping (room_id, status, priority, created_by)
             VALUES (?, ?, ?, ?)`,
            [reservation[0].room_id, 'pending', 'normal', req.user.id]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Guest checked out successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error checking out:', error);
        res.status(500).json({
            success: false,
            message: 'Error during check-out'
        });
    } finally {
        connection.release();
    }
});

module.exports = router;