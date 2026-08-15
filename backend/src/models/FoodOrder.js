const { pool } = require('../config/db');

class FoodOrder {
    static async findAll(filters = {}) {
        let query = `
            SELECT fo.*, 
                   CONCAT(g.first_name, ' ', g.last_name) as guest_name,
                   rm.room_number,
                   u.name as created_by_name
            FROM food_orders fo
            LEFT JOIN guests g ON fo.guest_id = g.id
            LEFT JOIN rooms rm ON fo.room_id = rm.id
            LEFT JOIN users u ON fo.created_by = u.id
            WHERE 1=1
        `;
        const params = [];
        if (filters.status) {
            query += ' AND fo.status = ?';
            params.push(filters.status);
        }
        if (filters.guestId) {
            query += ' AND fo.guest_id = ?';
            params.push(filters.guestId);
        }
        if (filters.startDate && filters.endDate) {
            query += ' AND DATE(fo.order_date) BETWEEN ? AND ?';
            params.push(filters.startDate, filters.endDate);
        }
        query += ' ORDER BY fo.created_at DESC';
        const [rows] = await pool.execute(query, params);
        return rows;
    }

    static async findById(id) {
        const [rows] = await pool.execute(`
            SELECT fo.*, 
                   CONCAT(g.first_name, ' ', g.last_name) as guest_name,
                   rm.room_number,
                   u.name as created_by_name
            FROM food_orders fo
            LEFT JOIN guests g ON fo.guest_id = g.id
            LEFT JOIN rooms rm ON fo.room_id = rm.id
            LEFT JOIN users u ON fo.created_by = u.id
            WHERE fo.id = ?
        `, [id]);
        return rows[0];
    }

    static async findItems(orderId) {
        const [rows] = await pool.execute(`
            SELECT foi.*, fi.name as item_name, fi.image_url
            FROM food_order_items foi
            JOIN food_items fi ON foi.food_item_id = fi.id
            WHERE foi.order_id = ?
        `, [orderId]);
        return rows;
    }

    static async create(data) {
        const { reservation_id, guest_id, room_id, notes, created_by, items } = data;
        
        // Calculate total from items
        let total = 0;
        if (items && items.length) {
            for (const item of items) {
                total += item.unit_price * item.quantity;
            }
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [result] = await connection.execute(
                `INSERT INTO food_orders 
                (reservation_id, guest_id, room_id, total_amount, notes, created_by, status)
                VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
                [reservation_id || null, guest_id, room_id || null, total, notes || null, created_by || null]
            );
            const orderId = result.insertId;

            // Insert items
            if (items && items.length) {
                for (const item of items) {
                    await connection.execute(
                        `INSERT INTO food_order_items 
                        (order_id, food_item_id, quantity, unit_price, subtotal)
                        VALUES (?, ?, ?, ?, ?)`,
                        [orderId, item.food_item_id, item.quantity, item.unit_price, item.unit_price * item.quantity]
                    );
                }
            }

            await connection.commit();
            return this.findById(orderId);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async update(id, data) {
        const { status, notes } = data;
        await pool.execute(
            'UPDATE food_orders SET status = ?, notes = ? WHERE id = ?',
            [status || 'pending', notes || null, id]
        );
        return this.findById(id);
    }

    static async delete(id) {
        const [result] = await pool.execute('DELETE FROM food_orders WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = FoodOrder;