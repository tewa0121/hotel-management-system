const { pool } = require('../config/database');

class User {
    static async findAll() {
        const [rows] = await pool.execute(
            'SELECT id, name, email, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC'
        );
        return rows;
    }

    static async findById(id) {
        const [rows] = await pool.execute(
            'SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async findByEmail(email) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0];
    }

    static async create(data) {
        const { name, email, password, role } = data;
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, password, role]
        );
        return this.findById(result.insertId);
    }

    static async update(id, data) {
        const { name, email, role, is_active, password } = data;
        let query = 'UPDATE users SET name = ?, email = ?, role = ?, is_active = ?';
        const params = [name, email, role, is_active];

        if (password) {
            query += ', password = ?';
            params.push(password);
        }

        query += ' WHERE id = ?';
        params.push(id);

        await pool.execute(query, params);
        return this.findById(id);
    }

    static async delete(id) {
        const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async updateStatus(id, isActive) {
        await pool.execute(
            'UPDATE users SET is_active = ? WHERE id = ?',
            [isActive, id]
        );
    }
}

module.exports = User;