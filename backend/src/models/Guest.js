const { pool } = require('../config/db'); // ✅ Fixed: changed from '../config/database' to '../config/db'

class Guest {
    // ============================================
    // GET ALL GUESTS (with pagination & search)
    // ============================================
    static async findAll(page = 1, limit = 20, search = '') {
        const offset = (page - 1) * limit;
        let query = 'SELECT * FROM guests';
        let countQuery = 'SELECT COUNT(*) as total FROM guests';
        const params = [];

        if (search) {
            const searchTerm = `%${search}%`;
            query += ' WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?';
            countQuery += ' WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?';
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [rows] = await pool.execute(query, params);
        const [count] = await pool.execute(countQuery, params.slice(0, params.length - 2));
        
        return {
            data: rows,
            total: count[0].total
        };
    }

    // ============================================
    // FIND GUEST BY ID
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
    // ============================================
    static async create(data) {
        const {
            first_name, last_name, email, phone, address, city, country,
            id_type, id_number, date_of_birth, gender, nationality,
            emergency_contact_name, emergency_contact_phone, notes,
            password // ✅ Added for guest login
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
    // ============================================
    static async update(id, data) {
        console.log('=========================================');
        console.log(`📝 Guest.update() called for ID: ${id}`);
        console.log('📝 Update data:', JSON.stringify(data, null, 2));

        const existing = await this.findById(id);
        if (!existing) {
            throw new Error(`Guest with ID ${id} not found`);
        }
        console.log('📊 Existing guest:', JSON.stringify(existing, null, 2));

        const firstName = data.first_name !== undefined ? data.first_name : existing.first_name;
        const lastName = data.last_name !== undefined ? data.last_name : existing.last_name;
        const email = data.email !== undefined ? data.email : existing.email;
        const phone = data.phone !== undefined ? data.phone : existing.phone;
        const address = data.address !== undefined ? data.address : existing.address;
        const city = data.city !== undefined ? data.city : existing.city;
        const country = data.country !== undefined ? data.country : existing.country;
        const idType = data.id_type !== undefined ? data.id_type : existing.id_type;
        const idNumber = data.id_number !== undefined ? data.id_number : existing.id_number;
        const dob = data.date_of_birth !== undefined ? data.date_of_birth : existing.date_of_birth;
        const gender = data.gender !== undefined ? data.gender : existing.gender;
        const nationality = data.nationality !== undefined ? data.nationality : existing.nationality;
        const emergencyName = data.emergency_contact_name !== undefined ? data.emergency_contact_name : existing.emergency_contact_name;
        const emergencyPhone = data.emergency_contact_phone !== undefined ? data.emergency_contact_phone : existing.emergency_contact_phone;
        const notes = data.notes !== undefined ? data.notes : existing.notes;
        const password = data.password !== undefined ? data.password : existing.password;

        console.log('📊 Final update values:', {
            firstName, lastName, email, phone, address, city, country,
            idType, idNumber, dob, gender, nationality, emergencyName, emergencyPhone, notes, password
        });

        try {
            const query = `
                UPDATE guests SET
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
                    password = ?,
                    updated_at = NOW()
                WHERE id = ?
            `;

            const params = [
                firstName,
                lastName,
                email || null,
                phone,
                address || null,
                city || null,
                country || null,
                idType || 'passport',
                idNumber || null,
                dob || null,
                gender || 'other',
                nationality || null,
                emergencyName || null,
                emergencyPhone || null,
                notes || null,
                password || null,
                id
            ];

            console.log('📝 SQL Query:', query);
            console.log('📊 SQL Params:', params);

            await pool.execute(query, params);
            console.log('✅ Database update successful');
            
            return this.findById(id);
        } catch (error) {
            console.error('❌ Database error in update:');
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error code:', error.code);
            console.error('Error sqlMessage:', error.sqlMessage);
            console.error('=========================================');
            throw error;
        }
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