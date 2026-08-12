// const { pool } = require('../config/database');

// class Housekeeping {
//     static async findAll(status = '', assignedTo = '') {
//         let query = `
//             SELECT h.*,
//                    r.room_number, r.building, r.floor,
//                    u.name as assigned_to_name,
//                    creator.name as created_by_name
//             FROM housekeeping h
//             LEFT JOIN rooms r ON h.room_id = r.id
//             LEFT JOIN users u ON h.assigned_to = u.id
//             LEFT JOIN users creator ON h.created_by = creator.id
//             WHERE 1=1
//         `;
//         const params = [];

//         if (status) {
//             query += ' AND h.status = ?';
//             params.push(status);
//         }

//         if (assignedTo) {
//             query += ' AND h.assigned_to = ?';
//             params.push(assignedTo);
//         }

//         query += ' ORDER BY h.priority DESC, h.created_at DESC';

//         const [rows] = await pool.execute(query, params);
//         return rows;
//     }

//     static async findById(id) {
//         const [rows] = await pool.execute(`
//             SELECT h.*, r.room_number, u.name as assigned_to_name
//             FROM housekeeping h
//             LEFT JOIN rooms r ON h.room_id = r.id
//             LEFT JOIN users u ON h.assigned_to = u.id
//             WHERE h.id = ?
//         `, [id]);
//         return rows[0];
//     }

//     static async create(data) {
//         const { room_id, assigned_to, priority, status, notes, created_by } = data;

//         const [result] = await pool.execute(
//             `INSERT INTO housekeeping (
//                 room_id, assigned_to, priority, status, notes, created_by
//             ) VALUES (?, ?, ?, ?, ?, ?)`,
//             [
//                 room_id, assigned_to || null,
//                 priority || 'normal', status || 'pending',
//                 notes || null, created_by
//             ]
//         );
//         return this.findById(result.insertId);
//     }

//     static async update(id, data) {
//         const { assigned_to, priority, status, start_time, completion_time, notes } = data;

//         await pool.execute(
//             `UPDATE housekeeping SET
//                 assigned_to = ?,
//                 priority = ?,
//                 status = ?,
//                 start_time = ?,
//                 completion_time = ?,
//                 notes = ?
//             WHERE id = ?`,
//             [
//                 assigned_to, priority, status,
//                 start_time || null, completion_time || null,
//                 notes, id
//             ]
//         );
//         return this.findById(id);
//     }

//     static async assign(id, assignedTo) {
//         await pool.execute(
//             'UPDATE housekeeping SET assigned_to = ?, status = ? WHERE id = ?',
//             [assignedTo, 'assigned', id]
//         );
//         return this.findById(id);
//     }

//     static async delete(id) {
//         const [result] = await pool.execute('DELETE FROM housekeeping WHERE id = ?', [id]);
//         return result.affectedRows > 0;
//     }

//     static async getDashboard() {
//         // Get task counts by status
//         const [statusCounts] = await pool.execute(`
//             SELECT status, COUNT(*) as count
//             FROM housekeeping
//             GROUP BY status
//         `);

//         // Get pending tasks
//         const [pendingTasks] = await pool.execute(`
//             SELECT h.*, r.room_number, r.building, r.floor
//             FROM housekeeping h
//             LEFT JOIN rooms r ON h.room_id = r.id
//             WHERE h.status IN ('pending', 'assigned')
//             ORDER BY h.priority DESC, h.created_at ASC
//             LIMIT 20
//         `);

//         // Get dirty rooms
//         const [dirtyRooms] = await pool.execute(`
//             SELECT r.*, rt.name as room_type_name
//             FROM rooms r
//             LEFT JOIN room_types rt ON r.room_type_id = rt.id
//             WHERE r.housekeeping_status = 'dirty'
//             ORDER BY r.room_number
//         `);

//         return {
//             statusCounts,
//             pendingTasks,
//             dirtyRooms
//         };
//     }

//     static async createFromCheckout(roomId, createdBy) {
//         const [result] = await pool.execute(
//             `INSERT INTO housekeeping (room_id, status, priority, created_by)
//              VALUES (?, ?, ?, ?)`,
//             [roomId, 'pending', 'normal', createdBy]
//         );
//         return this.findById(result.insertId);
//     }
// }

// module.exports = Housekeeping;