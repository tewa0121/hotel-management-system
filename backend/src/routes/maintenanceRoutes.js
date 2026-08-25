// const express = require('express');
// const { pool } = require('../config/database');
// const { verifyToken, authorize } = require('../middleware/auth');
// const Maintenance = require('../models/Maintenance');

// const router = express.Router();

// // ============================================
// // GET all maintenance requests
// // ============================================
// router.get('/', verifyToken, async (req, res) => {
//     try {
//         const status = req.query.status || '';
//         const priority = req.query.priority || '';

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

//         const [requests] = await pool.execute(query, params);

//         res.json({
//             success: true,
//             data: requests
//         });
//     } catch (error) {
//         console.error('Error fetching maintenance requests:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching maintenance requests'
//         });
//     }
// });

// // ============================================
// // GET maintenance dashboard
// // ============================================
// router.get('/dashboard', verifyToken, async (req, res) => {
//     try {
//         const dashboard = await Maintenance.getDashboard();
//         res.json({
//             success: true,
//             data: dashboard
//         });
//     } catch (error) {
//         console.error('Error fetching maintenance dashboard:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching maintenance dashboard'
//         });
//     }
// });

// // ============================================
// // POST create maintenance request
// // ============================================
// router.post('/', verifyToken, async (req, res) => {
//     const connection = await pool.getConnection();
//     try {
//         await connection.beginTransaction();

//         const {
//             room_id,
//             category,
//             description,
//             priority,
//             assigned_to,
//             notes
//         } = req.body;

//         if (!room_id || !category || !description) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Room ID, Category, and Description are required'
//             });
//         }

//         const [result] = await connection.execute(
//             `INSERT INTO maintenance (
//                 room_id, category, description, priority,
//                 assigned_to, notes, created_by, status
//             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//             [
//                 room_id, category, description,
//                 priority || 'medium', assigned_to || null,
//                 notes || null, req.user.id, 'open'
//             ]
//         );

//         if (priority === 'high' || priority === 'critical') {
//             await connection.execute(
//                 'UPDATE rooms SET status = ? WHERE id = ?',
//                 ['maintenance', room_id]
//             );
//         }

//         await connection.commit();

//         const [newRequest] = await connection.execute(`
//             SELECT m.*, r.room_number, u.name as assigned_to_name
//             FROM maintenance m
//             LEFT JOIN rooms r ON m.room_id = r.id
//             LEFT JOIN users u ON m.assigned_to = u.id
//             WHERE m.id = ?
//         `, [result.insertId]);

//         res.status(201).json({
//             success: true,
//             message: 'Maintenance request created successfully',
//             data: newRequest[0]
//         });
//     } catch (error) {
//         await connection.rollback();
//         console.error('Error creating maintenance request:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error creating maintenance request'
//         });
//     } finally {
//         connection.release();
//     }
// });

// // ============================================
// // PUT update maintenance request - FIXED
// // ============================================
// router.put('/:id', verifyToken, async (req, res) => {
//     try {
//         console.log(`📥 PUT /maintenance/${req.params.id}`);
//         console.log('📤 Request body:', req.body);

//         const {
//             category,
//             description,
//             priority,
//             assigned_to,
//             status,
//             start_date,
//             completion_date,
//             cost,
//             notes
//         } = req.body;

//         // Check if request exists
//         const existing = await Maintenance.findById(req.params.id);
//         if (!existing) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Request not found'
//             });
//         }

//         // ✅ Use the model's update method
//         const updated = await Maintenance.update(req.params.id, req.body);

//         // Update room status if needed
//         if (status !== undefined && status !== existing.status) {
//             if (status === 'completed' || status === 'cancelled') {
//                 // Check if room has other open maintenance requests
//                 const allRequests = await Maintenance.findAll();
//                 const hasOpen = allRequests.some(r => 
//                     r.room_id === existing.room_id && 
//                     r.id !== parseInt(req.params.id) &&
//                     ['open', 'assigned', 'in_progress'].includes(r.status)
//                 );

//                 if (!hasOpen) {
//                     await pool.execute(
//                         'UPDATE rooms SET status = ? WHERE id = ?',
//                         ['available', existing.room_id]
//                     );
//                 }
//             } else if (status === 'assigned' || status === 'in_progress') {
//                 await pool.execute(
//                     'UPDATE rooms SET status = ? WHERE id = ?',
//                     ['maintenance', existing.room_id]
//                 );
//             }
//         }

//         console.log('✅ Update successful:', updated);

//         res.json({
//             success: true,
//             message: 'Request updated successfully',
//             data: updated
//         });
//     } catch (error) {
//         console.error('❌ Error updating maintenance request:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error updating maintenance request',
//             error: error.message
//         });
//     }
// });

// // ============================================
// // DELETE maintenance request
// // ============================================
// router.delete('/:id', verifyToken, authorize('admin', 'manager'), async (req, res) => {
//     try {
//         const existing = await Maintenance.findById(req.params.id);
//         if (!existing) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Request not found'
//             });
//         }

//         await Maintenance.delete(req.params.id);

//         // Check if room has other maintenance requests
//         const allRequests = await Maintenance.findAll();
//         const hasOpen = allRequests.some(r => 
//             r.room_id === existing.room_id && 
//             ['open', 'assigned', 'in_progress'].includes(r.status)
//         );

//         if (!hasOpen) {
//             await pool.execute(
//                 'UPDATE rooms SET status = ? WHERE id = ?',
//                 ['available', existing.room_id]
//             );
//         }

//         res.json({
//             success: true,
//             message: 'Request deleted successfully'
//         });
//     } catch (error) {
//         console.error('Error deleting maintenance request:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error deleting maintenance request'
//         });
//     }
// });

// // ============================================
// // ✅ NEW - Direct status update endpoint
// // ============================================
// router.patch('/:id/status', verifyToken, async (req, res) => {
//     try {
//         const { status } = req.body;
//         console.log(`📥 PATCH /maintenance/${req.params.id}/status to: ${status}`);

//         if (!status) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Status is required'
//             });
//         }

//         const existing = await Maintenance.findById(req.params.id);
//         if (!existing) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Request not found'
//             });
//         }

//         // Update status
//         await Maintenance.updateStatus(req.params.id, status);

//         // Update room status if needed
//         if (status === 'completed' || status === 'cancelled') {
//             const allRequests = await Maintenance.findAll();
//             const hasOpen = allRequests.some(r => 
//                 r.room_id === existing.room_id && 
//                 r.id !== parseInt(req.params.id) &&
//                 ['open', 'assigned', 'in_progress'].includes(r.status)
//             );

//             if (!hasOpen) {
//                 await pool.execute(
//                     'UPDATE rooms SET status = ? WHERE id = ?',
//                     ['available', existing.room_id]
//                 );
//             }
//         } else if (status === 'assigned' || status === 'in_progress') {
//             await pool.execute(
//                 'UPDATE rooms SET status = ? WHERE id = ?',
//                 ['maintenance', existing.room_id]
//             );
//         }

//         const updated = await Maintenance.findById(req.params.id);

//         res.json({
//             success: true,
//             message: 'Status updated successfully',
//             data: updated
//         });
//     } catch (error) {
//         console.error('❌ Error updating status:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error updating status',
//             error: error.message
//         });
//     }
// });

// module.exports = router;