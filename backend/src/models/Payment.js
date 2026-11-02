const { pool } = require('../config/db');

const MAX_PAGE_SIZE = 100;

const WITH_DETAILS = `
    SELECT p.*,
           g.first_name, g.last_name,
           r.reservation_number,
           u.name as received_by_name
    FROM payments p
    LEFT JOIN guests g ON p.guest_id = g.id
    LEFT JOIN reservations r ON p.reservation_id = r.id
    LEFT JOIN users u ON p.received_by = u.id
`;

// Turn anything into a whole number between min and max (used for page / limit)
const toInt = (value, fallback, min, max) => {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) return fallback;
    return Math.min(Math.max(n, min), max);
};

const toNull = (value) => (value === undefined || value === '' ? null : value);

// Methods with a last argument `db` can run inside a transaction:
// pass the transaction's connection instead of the shared pool.
class Payment {
    // ============================================
    // All payments, newest first, with paging and an optional status filter
    // ============================================
    static async findAll(page = 1, limit = 20, status = '') {
        const safeLimit = toInt(limit, 20, 1, MAX_PAGE_SIZE);
        const safePage = toInt(page, 1, 1, 1000000);
        const offset = (safePage - 1) * safeLimit;

        let query = `${WITH_DETAILS} WHERE 1=1`;
        let countQuery = 'SELECT COUNT(*) as total FROM payments WHERE 1=1';
        const params = [];

        if (status) {
            query += ' AND p.status = ?';
            countQuery += ' AND status = ?';
            params.push(status);
        }

        // page/limit are already clean integers, so they are safe to place in the SQL text
        query += ` ORDER BY p.created_at DESC, p.id DESC LIMIT ${safeLimit} OFFSET ${offset}`;

        const [rows] = await pool.execute(query, params);
        const [count] = await pool.execute(countQuery, params);

        return {
            data: rows,
            total: count[0].total,
            page: safePage,
            limit: safeLimit
        };
    }

    static async findById(id, db = pool) {
        const [rows] = await db.execute(`${WITH_DETAILS} WHERE p.id = ?`, [id]);
        return rows[0];
    }

    // LOCK + READ one payment (use inside a transaction only): nobody else can
    // refund the same payment until this transaction ends.
    static async findForUpdate(id, db) {
        const [rows] = await db.execute('SELECT * FROM payments WHERE id = ? FOR UPDATE', [id]);
        return rows[0];
    }

    static async findByReservation(reservationId) {
        const [rows] = await pool.execute(`
            SELECT p.*, u.name as received_by_name
            FROM payments p
            LEFT JOIN users u ON p.received_by = u.id
            WHERE p.reservation_id = ?
            ORDER BY p.created_at DESC, p.id DESC
        `, [reservationId]);
        return rows;
    }

    static async create(data, db = pool) {
        const {
            reservation_id, guest_id, amount, currency,
            payment_method, reference_number, status, received_by, notes
        } = data;

        const [result] = await db.execute(
            `INSERT INTO payments (
                reservation_id, guest_id, amount, currency,
                payment_method, reference_number, status, received_by, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                reservation_id, guest_id, amount, currency || 'USD',
                payment_method, toNull(reference_number), status || 'completed',
                toNull(received_by), toNull(notes)
            ]
        );
        return this.findById(result.insertId, db);
    }

    static async updateStatus(id, status, db = pool) {
        await db.execute(
            'UPDATE payments SET status = ? WHERE id = ?',
            [status, id]
        );
    }

    // Mark a payment as refunded and add the reason to its notes
    static async markRefunded(id, reason, db = pool) {
        await db.execute(
            `UPDATE payments SET
                status = 'refunded',
                notes = CONCAT(IFNULL(notes, ''), ?)
            WHERE id = ?`,
            [` Refunded: ${reason}`, id]
        );
    }

    // Keep the guest's lifetime spending in step with their payments.
    // `amount` is positive for a payment and negative for a refund; it never goes below 0.
    static async adjustGuestTotalSpent(guestId, amount, db = pool) {
        await db.execute(
            'UPDATE guests SET total_spent = GREATEST(total_spent + ?, 0) WHERE id = ?',
            [amount, guestId]
        );
    }

    // The hotel's currency from Settings (falls back to USD when Settings is not set up yet)
    static async getBaseCurrency(db = pool) {
        try {
            const [rows] = await db.execute('SELECT currency, default_currency FROM settings WHERE id = 1');
            const settings = rows[0];
            return String((settings && (settings.default_currency || settings.currency)) || 'USD').toUpperCase();
        } catch (error) {
            return 'USD';
        }
    }

    static async getTotalByReservation(reservationId) {
        const [rows] = await pool.execute(
            "SELECT SUM(amount) as total FROM payments WHERE reservation_id = ? AND status = 'completed'",
            [reservationId]
        );
        return rows[0].total || 0;
    }

    static async getSummaryByMethod() {
        const [rows] = await pool.execute(`
            SELECT payment_method, COUNT(*) as count, SUM(amount) as total
            FROM payments
            WHERE status = 'completed'
            GROUP BY payment_method
        `);
        return rows;
    }

    // `date` is 'YYYY-MM-DD' (today when omitted). It is passed as a parameter, never put in the SQL.
    static async getDailySummary(date = null) {
        const [rows] = await pool.execute(`
            SELECT
                COUNT(*) as count,
                SUM(amount) as total,
                payment_method
            FROM payments
            WHERE status = 'completed'
            AND DATE(created_at) = COALESCE(?, CURDATE())
            GROUP BY payment_method
        `, [date || null]);
        return rows;
    }
}

module.exports = Payment;