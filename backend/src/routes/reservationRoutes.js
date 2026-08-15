const express = require('express');
const { pool } = require('../config/database');
const { verifyToken, authorize } = require('../middleware/auth');
const Reservation = require('../models/Reservation');
const Room = require('../models/Room');
const Guest = require('../models/Guest');
const { createNotification } = require('./notificationRoutes'); // ✅ Add this

const router = express.Router();

// ============================================
// GET all reservations
// ============================================
router.get('/', verifyToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status || '';
        const date = req.query.date || '';

        const result = await Reservation.findAll(page, limit, status, date);

        res.json({
            success: true,
            data: result.data,
            pagination: {
                page,
                limit,
                total: result.total,
                totalPages: Math.ceil(result.total / limit)
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

// ============================================
// GET reservations by guest ID (for Food Module)
// ============================================
router.get('/guest/:guestId', verifyToken, async (req, res) => {
    try {
        const [reservations] = await pool.execute(
            `SELECT r.*, 
                    rm.room_number, 
                    rm.status as room_status,
                    rt.name as room_type_name
             FROM reservations r
             LEFT JOIN rooms rm ON r.room_id = rm.id
             LEFT JOIN room_types rt ON rm.room_type_id = rt.id
             WHERE r.guest_id = ?
             ORDER BY r.check_in_date DESC`,
            [req.params.guestId]
        );

        res.json({
            success: true,
            data: reservations
        });
    } catch (error) {
        console.error('Error fetching guest reservations:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching guest reservations'
        });
    }
});

// ============================================
// POST check available rooms
// ============================================
router.post('/available-rooms', verifyToken, async (req, res) => {
    try {
        const { check_in_date, check_out_date, room_type_id, guests } = req.body;

        if (!check_in_date || !check_out_date) {
            return res.status(400).json({
                success: false,
                message: 'Check-in and check-out dates are required'
            });
        }

        const rooms = await Room.getAvailableRooms(
            check_in_date,
            check_out_date,
            room_type_id,
            guests
        );

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

// ============================================
// POST create reservation
// ============================================
router.post('/', verifyToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            guest_id, room_id, check_in_date, check_out_date,
            adults, children, rate, discount, tax, total_amount,
            deposit_paid, source, special_requests, notes
        } = req.body;

        if (!guest_id || !room_id || !check_in_date || !check_out_date) {
            return res.status(400).json({
                success: false,
                message: 'Guest ID, Room ID, Check-in, and Check-out dates are required'
            });
        }

        const availableRooms = await Room.getAvailableRooms(check_in_date, check_out_date);
        const roomAvailable = availableRooms.find(r => r.id === parseInt(room_id));

        if (!roomAvailable) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Room is not available for selected dates'
            });
        }

        const reservation_number = await Reservation.generateReservationNumber();
        const balance = (total_amount || 0) - (deposit_paid || 0);
        const payment_status = deposit_paid > 0 ? (deposit_paid >= total_amount ? 'paid' : 'partial') : 'pending';
        const reservation_status = deposit_paid > 0 ? 'confirmed' : 'pending';

        const reservationData = {
            reservation_number,
            guest_id,
            room_id,
            check_in_date,
            check_out_date,
            adults: adults || 1,
            children: children || 0,
            rate: rate || 0,
            discount: discount || 0,
            tax: tax || 0,
            total_amount: total_amount || 0,
            deposit_paid: deposit_paid || 0,
            balance,
            payment_status,
            source: source || 'direct',
            special_requests: special_requests || null,
            notes: notes || null,
            reservation_status
        };

        const reservation = await Reservation.create(reservationData);

        await connection.execute(
            'UPDATE rooms SET status = ? WHERE id = ?',
            ['reserved', room_id]
        );

        await connection.execute(
            'UPDATE guests SET total_stays = total_stays + 1 WHERE id = ?',
            [guest_id]
        );

        await connection.commit();

        // ✅ Create notification for new reservation
        await createNotification(
            req.user.id,
            `New reservation #${reservation.reservation_number} created for guest ${reservation.first_name || 'Guest'}`,
            'reservation',
            `/reservations/${reservation.id}`
        );

        res.status(201).json({
            success: true,
            message: 'Reservation created successfully',
            data: reservation
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

// ============================================
// GET single reservation
// ============================================
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }
        res.json({
            success: true,
            data: reservation
        });
    } catch (error) {
        console.error('Error fetching reservation:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reservation'
        });
    }
});

// ============================================
// PUT update reservation
// ============================================
router.put('/:id', verifyToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [existing] = await connection.execute(
            'SELECT * FROM reservations WHERE id = ?',
            [req.params.id]
        );

        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        const reservation = existing[0];

        const {
            guest_id, room_id, check_in_date, check_out_date,
            adults, children, rate, discount, tax, total_amount,
            deposit_paid, source, special_requests, notes,
            reservation_status
        } = req.body;

        const finalGuestId = guest_id || reservation.guest_id;
        const finalRoomId = room_id || reservation.room_id;
        const finalCheckIn = check_in_date || reservation.check_in_date;
        const finalCheckOut = check_out_date || reservation.check_out_date;
        const finalAdults = adults || reservation.adults;
        const finalChildren = children || reservation.children;
        const finalRate = rate || reservation.rate;
        const finalDiscount = discount || reservation.discount;
        const finalTax = tax || reservation.tax;
        const finalTotal = total_amount || reservation.total_amount;
        const finalDeposit = deposit_paid || reservation.deposit_paid;
        const finalSource = source || reservation.source;
        const finalSpecialRequests = special_requests || reservation.special_requests;
        const finalNotes = notes || reservation.notes;
        const finalStatus = reservation_status || reservation.reservation_status;

        const balance = finalTotal - finalDeposit;
        const paymentStatus = finalDeposit >= finalTotal ? 'paid' : 
                             (finalDeposit > 0 ? 'partial' : 'pending');

        await connection.execute(
            `UPDATE reservations SET
                guest_id = ?,
                room_id = ?,
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
                payment_status = ?,
                source = ?,
                special_requests = ?,
                notes = ?,
                reservation_status = ?,
                updated_at = NOW()
            WHERE id = ?`,
            [
                finalGuestId, finalRoomId, finalCheckIn, finalCheckOut,
                finalAdults, finalChildren, finalRate, finalDiscount || 0,
                finalTax || 0, finalTotal, finalDeposit || 0, balance,
                paymentStatus, finalSource, finalSpecialRequests || null,
                finalNotes || null, finalStatus, req.params.id
            ]
        );

        if (room_id && room_id !== reservation.room_id) {
            await connection.execute(
                'UPDATE rooms SET status = ? WHERE id = ?',
                ['available', reservation.room_id]
            );
            await connection.execute(
                'UPDATE rooms SET status = ? WHERE id = ?',
                ['reserved', room_id]
            );
        }

        await connection.commit();

        const [updated] = await connection.execute(`
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

        // ✅ Create notification for updated reservation
        await createNotification(
            req.user.id,
            `Reservation #${reservation.reservation_number} updated`,
            'reservation',
            `/reservations/${req.params.id}`
        );

        res.json({
            success: true,
            message: 'Reservation updated successfully',
            data: updated[0]
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

// ============================================
// POST cancel reservation
// ============================================
router.post('/:id/cancel', verifyToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        if (reservation.reservation_status === 'checked_in') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel a checked-in reservation'
            });
        }

        await Reservation.cancel(req.params.id);

        await connection.execute(
            'UPDATE rooms SET status = ? WHERE id = ?',
            ['available', reservation.room_id]
        );

        await connection.commit();

        // ✅ Create notification for cancelled reservation
        await createNotification(
            req.user.id,
            `Reservation #${reservation.reservation_number} cancelled`,
            'reservation',
            `/reservations`
        );

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

// ============================================
// POST check-in
// ============================================
router.post('/:id/check-in', verifyToken, authorize('admin', 'manager', 'receptionist'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        console.log(`📤 CHECK-IN request for reservation ${req.params.id}`);

        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        if (reservation.reservation_status === 'checked_in') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Guest is already checked in'
            });
        }

        if (reservation.reservation_status === 'cancelled') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Cannot check in a cancelled reservation'
            });
        }

        if (reservation.reservation_status !== 'confirmed' && reservation.reservation_status !== 'pending') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Reservation must be confirmed or pending to check in'
            });
        }

        await Reservation.checkIn(req.params.id);

        await connection.execute(
            'UPDATE rooms SET status = ? WHERE id = ?',
            ['occupied', reservation.room_id]
        );

        await connection.commit();

        // ✅ Create notification for check-in
        await createNotification(
            req.user.id,
            `Guest ${reservation.first_name || 'Guest'} checked in to room ${reservation.room_number}`,
            'reservation',
            `/reservations/${req.params.id}`
        );

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

// ============================================
// POST check-out
// ============================================
router.post('/:id/check-out', verifyToken, authorize('admin', 'manager', 'receptionist'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        console.log(`📤 CHECK-OUT request for reservation ${req.params.id}`);

        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        if (reservation.reservation_status !== 'checked_in') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Guest is not checked in'
            });
        }

        await Reservation.checkOut(req.params.id);

        await connection.execute(
            'UPDATE rooms SET status = ?, housekeeping_status = ? WHERE id = ?',
            ['dirty', 'dirty', reservation.room_id]
        );

        await connection.execute(
            `INSERT INTO housekeeping (room_id, status, priority, created_by)
             VALUES (?, ?, ?, ?)`,
            [reservation.room_id, 'pending', 'normal', req.user.id]
        );

        await connection.commit();

        // ✅ Create notification for check-out
        await createNotification(
            req.user.id,
            `Guest ${reservation.first_name || 'Guest'} checked out from room ${reservation.room_number}`,
            'reservation',
            `/reservations/${req.params.id}`
        );

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