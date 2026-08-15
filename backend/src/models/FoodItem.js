const { pool } = require('../config/db');

class FoodItem {
    static async findAll(categoryId = null) {
        let query = `
            SELECT fi.*, fc.name as category_name 
            FROM food_items fi
            LEFT JOIN food_categories fc ON fi.category_id = fc.id
        `;
        const params = [];
        if (categoryId) {
            query += ' WHERE fi.category_id = ?';
            params.push(categoryId);
        }
        query += ' ORDER BY fi.name';
        const [rows] = await pool.execute(query, params);
        return rows;
    }

    static async findById(id) {
        const [rows] = await pool.execute(`
            SELECT fi.*, fc.name as category_name 
            FROM food_items fi
            LEFT JOIN food_categories fc ON fi.category_id = fc.id
            WHERE fi.id = ?
        `, [id]);
        return rows[0];
    }

    static async create(data) {
        const { category_id, name, description, price, is_available, image_url } = data;
        const [result] = await pool.execute(
            `INSERT INTO food_items 
            (category_id, name, description, price, is_available, image_url) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [category_id || null, name, description || null, price, is_available ?? 1, image_url || null]
        );
        return this.findById(result.insertId);
    }

    static async update(id, data) {
        const { category_id, name, description, price, is_available, image_url } = data;
        await pool.execute(
            `UPDATE food_items SET 
                category_id = ?,
                name = ?,
                description = ?,
                price = ?,
                is_available = ?,
                image_url = ?
            WHERE id = ?`,
            [category_id || null, name, description || null, price, is_available ?? 1, image_url || null, id]
        );
        return this.findById(id);
    }

    static async delete(id) {
        const [result] = await pool.execute('DELETE FROM food_items WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = FoodItem;