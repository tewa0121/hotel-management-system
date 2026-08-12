// const { pool } = require('../config/database');

// class Maintenance {
//     static async findAll(status = '', priority = '') {
//         let query = `
//             SELECT m.*,
//                    r.room_number, r.building, r.floor,
//                    u.name as assigned_to_name,
//                    creator.name as created_by_name
//             FROM maintenance m
//             LEFT JOIN rooms r ON m.room_id = r.id
//             LEFT JOIN users u ON m.assigned_to = u.id
//             LEFT JOIN users creator ON m.created_by = creator.id
//             WHERE 1=1
//         `;
//         const params = [];

//         if (status) {
//             query += ' AND m.status = ?';
//             params.push(status);
//         }

//         if (priority) {
//             query += ' AND m.priority = ?';
//             params.push(priority);
//         }

//         query += ' ORDER BY m.priority DESC, m.created_at DESC';

//         const [rows] = await pool.execute(query, params);
//         return rows;
//     }

//     static async findById(id) {
//         const [rows] = await pool.execute(`
//             SELECT m.*, r.room_number, u.name as assigned_to_name
//             FROM maintenance m
//             LEFT JOIN rooms r ON m.room_id = r.id
//             LEFT JOIN users u ON m.assigned_to = u.id
//             WHERE m.id = ?
//         `, [id]);
//         return rows[0];
//     }

//     static async create(data) {
//         const {
//             room_id, category, description, priority,
//             assigned_to, notes, created_by
//         } = data;

//         const [result] = await pool.execute(
//             `INSERT INTO maintenance (
//                 room_id, category, description, priority,
//                 assigned_to, notes, created_by, status
//             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//             [
//                 room_id, category, description,
//                 priority || 'medium', assigned_to || null,
//                 notes || null, created_by, 'open'
//             ]
//         );
//         return this.findById(result.insertId);
//     }

//     // ✅ UPDATED - Simple and direct update
//     static async update(id, data) {
//         const {
//             category, description, priority, assigned_to,
//             status, start_date, completion_date, cost, notes
//         } = data;

//         // Build update query
//         const updates = [];
//         const params = [];

//         if (category !== undefined) {
//             updates.push('category = ?');
//             params.push(category);
//         }
//         if (description !== undefined) {
//             updates.push('description = ?');
//             params.push(description);
//         }
//         if (priority !== undefined) {
//             updates.push('priority = ?');
//             params.push(priority);
//         }
//         if (assigned_to !== undefined) {
//             updates.push('assigned_to = ?');
//             params.push(assigned_to);
//         }
//         // ✅ Ensure status is updated
//         if (status !== undefined) {
//             updates.push('status = ?');
//             params.push(status);
//         }
//         if (start_date !== undefined) {
//             updates.push('start_date = ?');
//             params.push(start_date);
//         }
//         if (completion_date !== undefined) {
//             updates.push('completion_date = ?');
//             params.push(completion_date);
//         }
//         if (cost !== undefined) {
//             updates.push('cost = ?');
//             params.push(cost);
//         }
//         if (notes !== undefined) {
//             updates.push('notes = ?');
//             params.push(notes);
//         }

//         updates.push('updated_at = NOW()');
        
//         let query = 'UPDATE maintenance SET ' + updates.join(', ') + ' WHERE id = ?';
//         params.push(id);

//         console.log('📝 UPDATE SQL:', query);
//         console.log('📊 UPDATE Params:', params);

//         await pool.execute(query, params);
//         return this.findById(id);
//     }

//     static async delete(id) {
//         const [result] = await pool.execute('DELETE FROM maintenance WHERE id = ?', [id]);
//         return result.affectedRows > 0;
//     }

//     static async getDashboard() {
//         const [statusCounts] = await pool.execute(`
//             SELECT status, COUNT(*) as count
//             FROM maintenance
//             GROUP BY status
//         `);

//         const [openRequests] = await pool.execute(`
//             SELECT m.*, r.room_number, r.building, r.floor
//             FROM maintenance m
//             LEFT JOIN rooms r ON m.room_id = r.id
//             WHERE m.status IN ('open', 'assigned', 'in_progress')
//             ORDER BY m.priority DESC, m.created_at ASC
//             LIMIT 20
//         `);

//         const [roomsUnderMaintenance] = await pool.execute(`
//             SELECT r.*, rt.name as room_type_name
//             FROM rooms r
//             LEFT JOIN room_types rt ON r.room_type_id = rt.id
//             WHERE r.status = 'maintenance'
//             ORDER BY r.room_number
//         `);

//         return {
//             statusCounts,
//             openRequests,
//             roomsUnderMaintenance
//         };
//     }

//     // ✅ NEW - Direct status update
//     static async updateStatus(id, newStatus) {
//         console.log(`🔄 Updating maintenance ${id} status to: ${newStatus}`);
//         await pool.execute(
//             'UPDATE maintenance SET status = ?, updated_at = NOW() WHERE id = ?',
//             [newStatus, id]
//         );
//         return this.findById(id);
//     }
// }

// module.exports = Maintenance;