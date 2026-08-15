const { pool } = require('../config/db');

class FoodCategory {
    static async findAll() {
        const [rows] = await pool.execute('SELECT * FROM food_categories ORDER BY name');
        return rows;
    }

    static async findById(id) {
        const [rows] = await pool.execute('SELECT * FROM food_categories WHERE id = ?', [id]);
        return rows[0];
    }

    static async create(name, description) {
        const [result] = await pool.execute(
            'INSERT INTO food_categories (name, description) VALUES (?, ?)',
            [name, description || null]
        );
        return this.findById(result.insertId);
    }

    static async update(id, name, description) {
        await pool.execute(
            'UPDATE food_categories SET name = ?, description = ? WHERE id = ?',
            [name, description || null, id]
        );
        return this.findById(id);
    }

    static async delete(id) {
        const [result] = await pool.execute('DELETE FROM food_categories WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = FoodCategory;