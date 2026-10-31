const { pool } = require('../config/db');

const MAX_PAGE_SIZE = 100;

// Every column EXCEPT `password` – safe to send to the browser
const PUBLIC_COLUMNS = `
    id, first_name, last_name, email, phone, address, city, country,
    id_type, id_number, date_of_birth, gender, nationality,
    emergency_contact_name, emergency_contact_phone, notes,
    total_stays, total_spent, is_guest, created_at, updated_at
`;

// Plain columns that update() is allowed to change (the password is handled separately)
const UPDATABLE_FIELDS = [
    'first_name', 'last_name', 'email', 'phone', 'address', 'city', 'country',
    'id_type', 'id_number', 'date_of_birth', 'gender', 'nationality',
    'emergency_contact_name', 'emergency_contact_phone', 'notes'
];

// Turn anything into a whole number between min and max (used for page / limit)
const toInt = (value, fallback, min, max) => {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) return fallback;
    return Math.min(Math.max(n, min), max);
};

class Guest {
    static UPDATABLE_FIELDS = UPDATABLE_FIELDS;

    // ============================================
    // REMOVE THE PASSWORD HASH FROM A GUEST ROW
    // ============================================
    static sanitize(guest) {
        if (!guest) return guest;
        const { password, ...rest } = guest;
        return rest;
    }

    // ============================================
    // GET ALL GUESTS (with pagination & search)
    // The password hash is never selected here.
    // ============================================
    static async findAll(page = 1, limit = 20, search = '') {
        const safeLimit = toInt(limit, 20, 1, MAX_PAGE_SIZE);
        const safePage = toInt(page, 1, 1, 1000000);
        const offset = (safePage - 1) * safeLimit;
        const term = String(search || '').trim();

        let where = '';
        let params = [];

        if (term) {
            where = ` WHERE first_name LIKE ?
                OR last_name LIKE ?
                OR CONCAT(first_name, ' ', last_name) LIKE ?
                OR email LIKE ?
                OR phone LIKE ?`;
            params = Array(5).fill(`%${term}%`);
        }

        // page/limit are already clean integers, so they are safe to place in the SQL text.
        // (Binding LIMIT with "?" breaks on newer MySQL versions.)
        const [rows] = await pool.execute(
            `SELECT ${PUBLIC_COLUMNS} FROM guests${where} ORDER BY created_at DESC, id DESC LIMIT ${safeLimit} OFFSET ${offset}`,
            params
        );
        const [count] = await pool.execute(
            `SELECT COUNT(*) as total FROM guests${where}`,
            params
        );

        return {
            data: rows,
            total: count[0].total,
            page: safePage,
            limit: safeLimit
        };
    }

    // ============================================
    // FIND GUEST BY ID  (internal use: includes the password hash,
    // call Guest.sanitize() before sending it to a client)
    // ============================================
    static async findById(id) {
        const [rows] = await pool.execute('SELECT * FROM guests WHERE id = ?', [id]);
        return rows[0];
    }

    // ============================================
    // FIND GUEST BY EMAIL
    // ============================================
    static async findByEmail(email) {
        if (!email) return null;
        const [rows] = await pool.execute('SELECT * FROM guests WHERE email = ?', [email]);
        return rows[0];
    }

    // ============================================
    // FIND GUEST BY EMAIL WITH PASSWORD (for auth)
    // ============================================
    static async findByEmailWithPassword(email) {
        if (!email) return null;
        const [rows] = await pool.execute('SELECT * FROM guests WHERE email = ?', [email]);
        return rows[0];
    }

    // ============================================
    // FIND GUEST BY PHONE
    // ============================================
    static async findByPhone(phone) {
        if (!phone) return null;
        const [rows] = await pool.execute('SELECT * FROM guests WHERE phone = ?', [phone]);
        return rows[0];
    }

    // ============================================
    // CREATE GUEST
    // `password` must already be hashed by the caller.
    // ============================================
    static async create(data) {
        const {
            first_name, last_name, email, phone, address, city, country,
            id_type, id_number, date_of_birth, gender, nationality,
            emergency_contact_name, emergency_contact_phone, notes,
            password
        } = data;

        const [result] = await pool.execute(
            `INSERT INTO guests (
                first_name, last_name, email, phone, address, city, country,
                id_type, id_number, date_of_birth, gender, nationality,
                emergency_contact_name, emergency_contact_phone, notes, password
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                first_name, last_name, email || null, phone, address || null, city || null, country || null,
                id_type || 'passport', id_number || null, date_of_birth || null, gender || 'other',
                nationality || null, emergency_contact_name || null, emergency_contact_phone || null, notes || null,
                password || null
            ]
        );
        return this.findById(result.insertId);
    }

    // ============================================
    // UPDATE GUEST
    // - fields that are undefined keep their current value
    // - the password only changes when `data.password` is provided
    //   (and it must already be hashed by the caller)
    // ============================================
    static async update(id, data) {
        const existing = await this.findById(id);
        if (!existing) {
            throw new Error(`Guest with ID ${id} not found`);
        }

        const pick = (field) => (data[field] !== undefined ? data[field] : existing[field]);

        const params = [
            pick('first_name'),
            pick('last_name'),
            pick('email') || null,
            pick('phone'),
            pick('address') || null,
            pick('city') || null,
            pick('country') || null,
            pick('id_type') || 'passport',
            pick('id_number') || null,
            pick('date_of_birth') || null,
            pick('gender') || 'other',
            pick('nationality') || null,
            pick('emergency_contact_name') || null,
            pick('emergency_contact_phone') || null,
            pick('notes') || null
        ];

        let passwordSql = '';
        if (data.password !== undefined) {
            passwordSql = 'password = ?,';
            params.push(data.password || null);
        }

        params.push(id);

        await pool.execute(
            `UPDATE guests SET
                first_name = ?,
                last_name = ?,
                email = ?,
                phone = ?,
                address = ?,
                city = ?,
                country = ?,
                id_type = ?,
                id_number = ?,
                date_of_birth = ?,
                gender = ?,
                nationality = ?,
                emergency_contact_name = ?,
                emergency_contact_phone = ?,
                notes = ?,
                ${passwordSql}
                updated_at = NOW()
            WHERE id = ?`,
            params
        );

        return this.findById(id);
    }

    // ============================================
    // DELETE GUEST
    // ============================================
    static async delete(id) {
        const [result] = await pool.execute('DELETE FROM guests WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    // ============================================
    // INCREMENT GUEST STAYS
    // ============================================
    static async incrementStays(id) {
        await pool.execute(
            'UPDATE guests SET total_stays = total_stays + 1 WHERE id = ?',
            [id]
        );
    }

    // ============================================
    // UPDATE GUEST SPENDING
    // ============================================
    static async updateSpent(id, amount) {
        await pool.execute(
            'UPDATE guests SET total_spent = total_spent + ? WHERE id = ?',
            [amount, id]
        );
    }

    // ============================================
    // UPDATE GUEST PASSWORD (For Guest Login)
    // ============================================
    static async updatePassword(id, hashedPassword) {
        await pool.execute(
            'UPDATE guests SET password = ? WHERE id = ?',
            [hashedPassword, id]
        );
        return this.findById(id);
    }

    // ============================================
    // GET GUEST RESERVATIONS (For Guest Dashboard)
    // ============================================
    static async getReservations(guestId) {
        const [rows] = await pool.execute(`
            SELECT 
                r.*, 
                rm.room_number, 
                rm.room_type_id, 
                rt.name as room_type_name
            FROM reservations r
            LEFT JOIN rooms rm ON r.room_id = rm.id
            LEFT JOIN room_types rt ON rm.room_type_id = rt.id
            WHERE r.guest_id = ?
            ORDER BY r.check_in_date DESC
        `, [guestId]);
        return rows;
    }

    // ============================================
    // GET GUEST INVOICES (For Guest Dashboard)
    // ============================================
    static async getInvoices(guestId) {
        const [rows] = await pool.execute(`
            SELECT 
                i.*,
                r.reservation_number,
                rm.room_number
            FROM invoices i
            LEFT JOIN reservations r ON i.reservation_id = r.id
            LEFT JOIN rooms rm ON r.room_id = rm.id
            WHERE i.guest_id = ?
            ORDER BY i.created_at DESC
        `, [guestId]);
        return rows;
    }

    // ============================================
    // CHECK IF GUEST HAS PASSWORD (For Guest Login)
    // ============================================
    static async hasPassword(id) {
        const [rows] = await pool.execute(
            'SELECT password FROM guests WHERE id = ?',
            [id]
        );
        return rows[0]?.password !== null && rows[0]?.password !== undefined;
    }
}

module.exports = Guest;