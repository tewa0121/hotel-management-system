// const { pool } = require('../config/database');

// class Payment {
//     static async findAll(page = 1, limit = 20, status = '') {
//         const offset = (page - 1) * limit;
//         let query = `
//             SELECT p.*, 
//                    g.first_name, g.last_name,
//                    r.reservation_number,
//                    u.name as received_by_name
//             FROM payments p
//             LEFT JOIN guests g ON p.guest_id = g.id
//             LEFT JOIN reservations r ON p.reservation_id = r.id
//             LEFT JOIN users u ON p.received_by = u.id
//             WHERE 1=1
//         `;
//         let countQuery = 'SELECT COUNT(*) as total FROM payments WHERE 1=1';
//         const params = [];

//         if (status) {
//             query += ' AND p.status = ?';
//             countQuery += ' AND status = ?';
//             params.push(status);
//         }

//         query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
//         params.push(limit, offset);

//         const [rows] = await pool.execute(query, params);
//         const [count] = await pool.execute(countQuery, params.slice(0, params.length - 2));

//         return {
//             data: rows,
//             total: count[0].total
//         };
//     }

//     static async findById(id) {
//         const [rows] = await pool.execute(`
//             SELECT p.*, 
//                    g.first_name, g.last_name,
//                    r.reservation_number,
//                    u.name as received_by_name
//             FROM payments p
//             LEFT JOIN guests g ON p.guest_id = g.id
//             LEFT JOIN reservations r ON p.reservation_id = r.id
//             LEFT JOIN users u ON p.received_by = u.id
//             WHERE p.id = ?
//         `, [id]);
//         return rows[0];
//     }

//     static async findByReservation(reservationId) {
//         const [rows] = await pool.execute(`
//             SELECT p.*, u.name as received_by_name
//             FROM payments p
//             LEFT JOIN users u ON p.received_by = u.id
//             WHERE p.reservation_id = ?
//             ORDER BY p.created_at DESC
//         `, [reservationId]);
//         return rows;
//     }

//     static async create(data) {
//         const {
//             reservation_id, guest_id, amount, currency,
//             payment_method, reference_number, status, received_by, notes
//         } = data;

//         const [result] = await pool.execute(
//             `INSERT INTO payments (
//                 reservation_id, guest_id, amount, currency,
//                 payment_method, reference_number, status, received_by, notes
//             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//             [
//                 reservation_id, guest_id, amount, currency || 'USD',
//                 payment_method, reference_number, status || 'completed',
//                 received_by, notes
//             ]
//         );
//         return this.findById(result.insertId);
//     }

//     static async updateStatus(id, status) {
//         await pool.execute(
//             'UPDATE payments SET status = ? WHERE id = ?',
//             [status, id]
//         );
//     }

//     // ✅ REFUND METHOD
//     static async refund(id) {
//         await pool.execute(
//             'UPDATE payments SET status = ? WHERE id = ?',
//             ['refunded', id]
//         );
//     }

//     static async getTotalByReservation(reservationId) {
//         const [rows] = await pool.execute(
//             'SELECT SUM(amount) as total FROM payments WHERE reservation_id = ? AND status = "completed"',
//             [reservationId]
//         );
//         return rows[0].total || 0;
//     }

//     static async getSummaryByMethod() {
//         const [rows] = await pool.execute(`
//             SELECT payment_method, COUNT(*) as count, SUM(amount) as total
//             FROM payments
//             WHERE status = 'completed'
//             GROUP BY payment_method
//         `);
//         return rows;
//     }

//     static async getDailySummary(date = null) {
//         const dateFilter = date || 'CURDATE()';
//         const [rows] = await pool.execute(`
//             SELECT 
//                 COUNT(*) as count,
//                 SUM(amount) as total,
//                 payment_method
//             FROM payments
//             WHERE status = 'completed'
//             AND DATE(created_at) = ${dateFilter}
//             GROUP BY payment_method
//         `);
//         return rows;
//     }
// }

// module.exports = Payment;