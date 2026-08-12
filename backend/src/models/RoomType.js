// const { pool } = require('../config/database');

// class RoomType {
//     static async findAll(activeOnly = true) {
//         let query = 'SELECT * FROM room_types';
//         const params = [];

//         if (activeOnly) {
//             query += ' WHERE is_active = TRUE';
//         }

//         query += ' ORDER BY name';

//         const [rows] = await pool.execute(query, params);
//         return rows;
//     }

//     static async findById(id) {
//         const [rows] = await pool.execute(
//             'SELECT * FROM room_types WHERE id = ?',
//             [id]
//         );
//         return rows[0];
//     }

//     static async findByName(name) {
//         const [rows] = await pool.execute(
//             'SELECT * FROM room_types WHERE name = ?',
//             [name]
//         );
//         return rows[0];
//     }

//     static async findByCode(code) {
//         const [rows] = await pool.execute(
//             'SELECT * FROM room_types WHERE code = ?',
//             [code]
//         );
//         return rows[0];
//     }

//     static async create(data) {
//         const {
//             name, code, description, max_occupancy,
//             base_price, weekend_price, extra_guest_price,
//             bed_type, is_active
//         } = data;

//         const [result] = await pool.execute(
//             `INSERT INTO room_types (
//                 name, code, description, max_occupancy,
//                 base_price, weekend_price, extra_guest_price,
//                 bed_type, is_active
//             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//             [
//                 name, code, description || null,
//                 max_occupancy || 2, base_price,
//                 weekend_price || null, extra_guest_price || 0,
//                 bed_type || 'double', is_active !== undefined ? is_active : true
//             ]
//         );
//         return this.findById(result.insertId);
//     }

//     static async update(id, data) {
//         const {
//             name, code, description, max_occupancy,
//             base_price, weekend_price, extra_guest_price,
//             bed_type, is_active
//         } = data;

//         await pool.execute(
//             `UPDATE room_types SET
//                 name = ?,
//                 code = ?,
//                 description = ?,
//                 max_occupancy = ?,
//                 base_price = ?,
//                 weekend_price = ?,
//                 extra_guest_price = ?,
//                 bed_type = ?,
//                 is_active = ?
//             WHERE id = ?`,
//             [
//                 name, code, description,
//                 max_occupancy, base_price,
//                 weekend_price, extra_guest_price || 0,
//                 bed_type, is_active !== undefined ? is_active : true, id
//             ]
//         );
//         return this.findById(id);
//     }

//     static async delete(id) {
//         // Check if room type has rooms
//         const [rooms] = await pool.execute(
//             'SELECT COUNT(*) as count FROM rooms WHERE room_type_id = ?',
//             [id]
//         );

//         if (rooms[0].count > 0) {
//             throw new Error('Cannot delete room type with existing rooms');
//         }

//         const [result] = await pool.execute(
//             'DELETE FROM room_types WHERE id = ?',
//             [id]
//         );
//         return result.affectedRows > 0;
//     }

//     static async getRoomCount(id) {
//         const [rows] = await pool.execute(
//             'SELECT COUNT(*) as count FROM rooms WHERE room_type_id = ?',
//             [id]
//         );
//         return rows[0].count;
//     }

//     static async getOccupancyStats(id) {
//         const [rows] = await pool.execute(`
//             SELECT 
//                 COUNT(*) as total_rooms,
//                 SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied,
//                 SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
//                 SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved,
//                 SUM(CASE WHEN status IN ('maintenance', 'out_of_service') THEN 1 ELSE 0 END) as maintenance
//             FROM rooms
//             WHERE room_type_id = ? AND is_active = TRUE
//         `, [id]);
//         return rows[0];
//     }

//     static async getRevenueStats(id, startDate = null, endDate = null) {
//         let dateFilter = '';
//         const params = [id];

//         if (startDate && endDate) {
//             dateFilter = ' AND r.check_in_date BETWEEN ? AND ?';
//             params.push(startDate, endDate);
//         }

//         const [rows] = await pool.execute(`
//             SELECT 
//                 SUM(r.total_amount) as total_revenue,
//                 COUNT(r.id) as total_reservations,
//                 AVG(r.total_amount) as average_booking
//             FROM reservations r
//             LEFT JOIN rooms rm ON r.room_id = rm.id
//             WHERE rm.room_type_id = ?
//             AND r.reservation_status IN ('checked_in', 'checked_out')
//             ${dateFilter}
//         `, params);
//         return rows[0];
//     }

//     static async getAvailableTypes() {
//         const [rows] = await pool.execute(`
//             SELECT rt.*, COUNT(r.id) as room_count
//             FROM room_types rt
//             LEFT JOIN rooms r ON r.room_type_id = rt.id AND r.is_active = TRUE
//             WHERE rt.is_active = TRUE
//             GROUP BY rt.id
//             ORDER BY rt.name
//         `);
//         return rows;
//     }
// }

// module.exports = RoomType;