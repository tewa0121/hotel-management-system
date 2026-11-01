const { pool } = require('../config/db');
const { BLOCKING_STATUSES, computeFinancials } = require('../utils/reservationRules');

const MAX_PAGE_SIZE = 100;

// Dates are returned as plain 'YYYY-MM-DD' text (not JavaScript Date objects), so the
// browser's date inputs, the list and the emails all show the right day.
const COLUMNS = `
    r.id, r.reservation_number, r.guest_id, r.room_id,
    DATE_FORMAT(r.check_in_date, '%Y-%m-%d') AS check_in_date,
    DATE_FORMAT(r.check_out_date, '%Y-%m-%d') AS check_out_date,
    r.adults, r.children, r.total_rooms, r.rate, r.discount, r.tax, r.total_amount,
    r.deposit_paid, r.balance, r.payment_status, r.reservation_status, r.source,
    r.special_requests, r.notes, r.checked_in_at, r.checked_out_at,
    r.created_at, r.updated_at
`;

const WITH_DETAILS = `
    SELECT ${COLUMNS},
           g.first_name, g.last_name, g.email, g.phone,
           rm.room_number, rm.status as room_status,
           rt.name as room_type_name
    FROM reservations r
    LEFT JOIN guests g ON r.guest_id = g.id
    LEFT JOIN rooms rm ON r.room_id = rm.id
    LEFT JOIN room_types rt ON rm.room_type_id = rt.id
`;

const BLOCKING_LIST = BLOCKING_STATUSES.map(s => `'${s}'`).join(', ');

// Turn anything into a whole number between min and max (used for page / limit)
const toInt = (value, fallback, min, max) => {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) return fallback;
    return Math.min(Math.max(n, min), max);
};

// Methods with a last argument `db` can run inside a transaction:
// pass the transaction's connection instead of the shared pool.
class Reservation {
    // Get all reservations with pagination
    static async findAll(page = 1, limit = 20, status = '', date = '') {
        const safeLimit = toInt(limit, 20, 1, MAX_PAGE_SIZE);
        const safePage = toInt(page, 1, 1, 1000000);
        const offset = (safePage - 1) * safeLimit;

        let query = `${WITH_DETAILS} WHERE 1=1`;
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

        // page/limit are already clean integers, so they are safe to place in the SQL text
        query += ` ORDER BY r.created_at DESC, r.id DESC LIMIT ${safeLimit} OFFSET ${offset}`;

        const [rows] = await pool.execute(query, params);
        const [count] = await pool.execute(countQuery, params);

        return {
            data: rows,
            total: count[0].total,
            page: safePage,
            limit: safeLimit
        };
    }

    // Get single reservation by ID (with guest and room details)
    static async findById(id, db = pool) {
        const [rows] = await db.execute(`${WITH_DETAILS} WHERE r.id = ?`, [id]);
        return rows[0];
    }

    // ============================================
    // LOCK + READ one reservation (use inside a transaction only).
    // The row stays locked until the transaction ends, so nobody can cancel,
    // check in or edit the same reservation at the same time.
    // ============================================
    static async findForUpdate(id, db) {
        const [rows] = await db.execute(
            `SELECT ${COLUMNS} FROM reservations r WHERE r.id = ? FOR UPDATE`,
            [id]
        );
        return rows[0];
    }

    // Find by reservation number
    static async findByReservationNumber(number, db = pool) {
        const [rows] = await db.execute(
            'SELECT * FROM reservations WHERE reservation_number = ?',
            [number]
        );
        return rows[0];
    }

    // All reservations of one guest, with room details
    static async findByGuest(guestId) {
        const [rows] = await pool.execute(
            `SELECT ${COLUMNS},
                    rm.room_number,
                    rm.status as room_status,
                    rt.name as room_type_name
             FROM reservations r
             LEFT JOIN rooms rm ON r.room_id = rm.id
             LEFT JOIN room_types rt ON rm.room_type_id = rt.id
             WHERE r.guest_id = ?
             ORDER BY r.check_in_date DESC`,
            [guestId]
        );
        return rows;
    }

    // ============================================
    // Is another reservation already holding this room during these dates?
    // Stays are [check-in, check-out): leaving on the 5th does not conflict with
    // arriving on the 5th. Only pending / confirmed / checked-in reservations count.
    // Returns the first conflicting reservation, or undefined when the room is free.
    // ============================================
    static async findConflict(roomId, checkIn, checkOut, excludeId = null, db = pool) {
        let query = `
            SELECT id, reservation_number, reservation_status,
                   DATE_FORMAT(check_in_date, '%Y-%m-%d') AS check_in_date,
                   DATE_FORMAT(check_out_date, '%Y-%m-%d') AS check_out_date
            FROM reservations
            WHERE room_id = ?
            AND reservation_status IN (${BLOCKING_LIST})
            AND check_in_date < ?
            AND check_out_date > ?
        `;
        const params = [roomId, checkOut, checkIn];

        if (excludeId) {
            query += ' AND id <> ?';
            params.push(excludeId);
        }

        query += ' ORDER BY check_in_date LIMIT 1';

        const [rows] = await db.execute(query, params);
        return rows[0];
    }

    // Is a different guest already checked in to this room?
    static async findOtherCheckedIn(roomId, excludeId, db = pool) {
        const [rows] = await db.execute(
            `SELECT id, reservation_number
             FROM reservations
             WHERE room_id = ? AND reservation_status = 'checked_in' AND id <> ?
             LIMIT 1`,
            [roomId, excludeId]
        );
        return rows[0];
    }

    // How many pending/confirmed reservations are still ahead for a room
    static async countUpcoming(roomId, db = pool) {
        const [rows] = await db.execute(
            `SELECT COUNT(*) as count
             FROM reservations
             WHERE room_id = ?
             AND reservation_status IN ('pending', 'confirmed')
             AND check_out_date >= CURDATE()`,
            [roomId]
        );
        return rows[0].count;
    }

    // Generate a unique reservation number like RES-261031-0042
    static async generateReservationNumber(db = pool) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        for (let attempt = 0; attempt < 10; attempt++) {
            const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
            const number = `RES-${year}${month}${day}-${random}`;

            const [rows] = await db.execute(
                'SELECT id FROM reservations WHERE reservation_number = ?',
                [number]
            );
            if (rows.length === 0) return number;
        }

        throw new Error('Could not generate a unique reservation number');
    }

    // Create new reservation
    static async create(data, db = pool) {
        const {
            reservation_number, guest_id, room_id, check_in_date, check_out_date,
            adults, children, rate, discount, tax, total_amount,
            deposit_paid, balance, payment_status, source,
            special_requests, notes, reservation_status
        } = data;

        const [result] = await db.execute(
            `INSERT INTO reservations (
                reservation_number, guest_id, room_id, check_in_date, check_out_date,
                adults, children, rate, discount, tax, total_amount,
                deposit_paid, balance, payment_status, source,
                special_requests, notes, reservation_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                reservation_number, guest_id, room_id, check_in_date, check_out_date,
                adults || 1, children || 0, rate || 0, discount || 0, tax || 0, total_amount || 0,
                deposit_paid || 0, balance, payment_status,
                source || 'direct', special_requests || null, notes || null,
                reservation_status
            ]
        );
        return this.findById(result.insertId, db);
    }

    // ============================================
    // Update a reservation. Fields that are not sent keep their current value
    // (so 0 is a real value: a discount can be set back to 0).
    // Balance and payment status are recalculated from total and deposit.
    // Returns null when the reservation does not exist.
    // ============================================
    static async update(id, data, db = pool) {
        const existing = await this.findForUpdate(id, db);
        if (!existing) return null;

        const pick = (field) => (data[field] !== undefined && data[field] !== null ? data[field] : existing[field]);

        const total_amount = Number(pick('total_amount')) || 0;
        const deposit_paid = Number(pick('deposit_paid')) || 0;
        const financials = computeFinancials({ total_amount, deposit_paid });

        // A refunded reservation keeps its "refunded" payment status
        const payment_status = existing.payment_status === 'refunded' ? 'refunded' : financials.payment_status;

        // Optional text fields can be cleared by sending an empty value
        const text = (field) => {
            const value = data[field] !== undefined ? data[field] : existing[field];
            return value || null;
        };

        await db.execute(
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
                pick('guest_id'),
                pick('room_id'),
                pick('check_in_date'),
                pick('check_out_date'),
                Number(pick('adults')) || 1,
                Number(pick('children')) || 0,
                Number(pick('rate')) || 0,
                Number(pick('discount')) || 0,
                Number(pick('tax')) || 0,
                total_amount,
                deposit_paid,
                financials.balance,
                payment_status,
                pick('source') || 'direct',
                text('special_requests'),
                text('notes'),
                pick('reservation_status'),
                id
            ]
        );
        return this.findById(id, db);
    }

    // Update reservation status
    static async updateStatus(id, status, db = pool) {
        await db.execute(
            'UPDATE reservations SET reservation_status = ? WHERE id = ?',
            [status, id]
        );
    }

    // Update payment status
    static async updatePaymentStatus(id, status, db = pool) {
        await db.execute(
            'UPDATE reservations SET payment_status = ? WHERE id = ?',
            [status, id]
        );
    }

    // Check in guest
    static async checkIn(id, db = pool) {
        await db.execute(
            `UPDATE reservations SET
                reservation_status = 'checked_in',
                checked_in_at = NOW()
            WHERE id = ?`,
            [id]
        );
    }

    // Check out guest
    static async checkOut(id, db = pool) {
        await db.execute(
            `UPDATE reservations SET
                reservation_status = 'checked_out',
                checked_out_at = NOW()
            WHERE id = ?`,
            [id]
        );
    }

    // Cancel reservation
    static async cancel(id, db = pool) {
        await db.execute(
            'UPDATE reservations SET reservation_status = ? WHERE id = ?',
            ['cancelled', id]
        );
    }

    // Get reservations by guest
    static async getReservationsByGuest(guestId) {
        const [rows] = await pool.execute(`
            SELECT r.*, rm.room_number
            FROM reservations r
            LEFT JOIN rooms rm ON r.room_id = rm.id
            WHERE r.guest_id = ?
            ORDER BY r.created_at DESC
        `, [guestId]);
        return rows;
    }

    // Get active reservations
    static async getActiveReservations() {
        const [rows] = await pool.execute(`
            SELECT r.*, g.first_name, g.last_name, rm.room_number
            FROM reservations r
            LEFT JOIN guests g ON r.guest_id = g.id
            LEFT JOIN rooms rm ON r.room_id = rm.id
            WHERE r.reservation_status IN ('confirmed', 'checked_in')
            AND r.check_out_date >= CURDATE()
            ORDER BY r.check_in_date ASC
        `);
        return rows;
    }

    // Get today's arrivals
    static async getCheckInsToday() {
        const [rows] = await pool.execute(`
            SELECT r.*, g.first_name, g.last_name, rm.room_number
            FROM reservations r
            LEFT JOIN guests g ON r.guest_id = g.id
            LEFT JOIN rooms rm ON r.room_id = rm.id
            WHERE r.check_in_date = CURDATE()
            AND r.reservation_status IN ('confirmed', 'pending')
            ORDER BY r.created_at ASC
        `);
        return rows;
    }

    // Get today's departures
    static async getCheckOutsToday() {
        const [rows] = await pool.execute(`
            SELECT r.*, g.first_name, g.last_name, rm.room_number
            FROM reservations r
            LEFT JOIN guests g ON r.guest_id = g.id
            LEFT JOIN rooms rm ON r.room_id = rm.id
            WHERE r.check_out_date = CURDATE()
            AND r.reservation_status = 'checked_in'
            ORDER BY r.created_at ASC
        `);
        return rows;
    }
}

module.exports = Reservation;