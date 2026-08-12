// const { pool } = require('../config/database'); // ← ADD THIS IMPORT
// const Maintenance = require('../models/Maintenance');
// const Room = require('../models/Room');
// const { validateMaintenance } = require('../utils/validators');
// const { logActivity } = require('../middleware/auth');

// // ============================================
// // Get all requests
// // ============================================
// const getRequests = async (req, res) => {
//     try {
//         const status = req.query.status || '';
//         const priority = req.query.priority || '';

//         const requests = await Maintenance.findAll(status, priority);

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
// };

// // ============================================
// // Get dashboard
// // ============================================
// const getDashboard = async (req, res) => {
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
// };

// // ============================================
// // Create request
// // ============================================
// const createRequest = async (req, res) => {
//     const connection = await pool.getConnection();
//     try {
//         await connection.beginTransaction();

//         const validation = validateMaintenance(req.body);
//         if (!validation.isValid) {
//             return res.status(400).json({
//                 success: false,
//                 errors: validation.errors
//             });
//         }

//         const { room_id, category, description, priority, assigned_to, notes } = req.body;

//         const requestData = {
//             room_id,
//             category,
//             description,
//             priority: priority || 'medium',
//             assigned_to: assigned_to || null,
//             notes: notes || null,
//             created_by: req.user.id
//         };

//         const request = await Maintenance.create(requestData);

//         // Update room status if priority is high or critical
//         if (priority === 'high' || priority === 'critical') {
//             await Room.updateStatus(room_id, 'maintenance');
//         }

//         await connection.commit();

//         await logActivity(
//             req.user.id,
//             'CREATE',
//             'maintenance',
//             request.id,
//             null,
//             request,
//             req.ip
//         );

//         res.status(201).json({
//             success: true,
//             message: 'Maintenance request created successfully',
//             data: request
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
// };

// // ============================================
// // Update request - FIXED
// // ============================================
// const updateRequest = async (req, res) => {
//     const connection = await pool.getConnection();
//     try {
//         await connection.beginTransaction();

//         const request = await Maintenance.findById(req.params.id);
//         if (!request) {
//             await connection.rollback();
//             return res.status(404).json({
//                 success: false,
//                 message: 'Request not found'
//             });
//         }

//         console.log(`📥 Updating maintenance ${req.params.id}`);
//         console.log('📤 Request body:', req.body);

//         const {
//             category, description, priority, assigned_to,
//             status, start_date, completion_date, cost, notes
//         } = req.body;

//         // ✅ Use the updated model method
//         const updated = await Maintenance.update(req.params.id, {
//             category,
//             description,
//             priority,
//             assigned_to,
//             status,
//             start_date,
//             completion_date,
//             cost,
//             notes
//         });

//         console.log(`📊 Status changed from ${request.status} to ${status}`);

//         // Update room status based on maintenance status
//         if (status !== undefined && status !== request.status) {
//             if (status === 'completed' || status === 'cancelled') {
//                 // Check if room has other open maintenance requests
//                 const allRequests = await Maintenance.findAll();
//                 const hasOpen = allRequests.some(r => 
//                     r.room_id === request.room_id && 
//                     r.id !== parseInt(req.params.id) &&
//                     ['open', 'assigned', 'in_progress'].includes(r.status)
//                 );

//                 if (!hasOpen) {
//                     await Room.updateStatus(request.room_id, 'available');
//                 }
//             } else if (status === 'assigned' || status === 'in_progress') {
//                 await Room.updateStatus(request.room_id, 'maintenance');
//             }
//         }

//         await connection.commit();

//         await logActivity(
//             req.user.id,
//             'UPDATE',
//             'maintenance',
//             updated.id,
//             request,
//             updated,
//             req.ip
//         );

//         res.json({
//             success: true,
//             message: 'Request updated successfully',
//             data: updated
//         });
//     } catch (error) {
//         await connection.rollback();
//         console.error('Error updating maintenance request:', error);
//         console.error('Error details:', error.message);
//         res.status(500).json({
//             success: false,
//             message: 'Error updating maintenance request',
//             error: error.message
//         });
//     } finally {
//         connection.release();
//     }
// };

// // ============================================
// // Delete request
// // ============================================
// const deleteRequest = async (req, res) => {
//     const connection = await pool.getConnection();
//     try {
//         await connection.beginTransaction();

//         const request = await Maintenance.findById(req.params.id);
//         if (!request) {
//             await connection.rollback();
//             return res.status(404).json({
//                 success: false,
//                 message: 'Request not found'
//             });
//         }

//         await Maintenance.delete(req.params.id);

//         // Check if room has other maintenance requests
//         const allRequests = await Maintenance.findAll();
//         const hasOpen = allRequests.some(r => 
//             r.room_id === request.room_id && 
//             ['open', 'assigned', 'in_progress'].includes(r.status)
//         );

//         if (!hasOpen) {
//             await Room.updateStatus(request.room_id, 'available');
//         }

//         await connection.commit();

//         await logActivity(
//             req.user.id,
//             'DELETE',
//             'maintenance',
//             req.params.id,
//             request,
//             null,
//             req.ip
//         );

//         res.json({
//             success: true,
//             message: 'Request deleted successfully'
//         });
//     } catch (error) {
//         await connection.rollback();
//         console.error('Error deleting maintenance request:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error deleting maintenance request'
//         });
//     } finally {
//         connection.release();
//     }
// };

// // ============================================
// // ✅ NEW - Direct status update
// // ============================================
// const updateStatus = async (req, res) => {
//     const connection = await pool.getConnection();
//     try {
//         await connection.beginTransaction();

//         const { status } = req.body;
//         const requestId = req.params.id;

//         console.log(`📥 Updating status for maintenance ${requestId} to: ${status}`);

//         if (!status) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Status is required'
//             });
//         }

//         const request = await Maintenance.findById(requestId);
//         if (!request) {
//             await connection.rollback();
//             return res.status(404).json({
//                 success: false,
//                 message: 'Request not found'
//             });
//         }

//         // ✅ Update only the status
//         await Maintenance.updateStatus(requestId, status);

//         // Update room status based on maintenance status
//         if (status === 'completed' || status === 'cancelled') {
//             const allRequests = await Maintenance.findAll();
//             const hasOpen = allRequests.some(r => 
//                 r.room_id === request.room_id && 
//                 r.id !== parseInt(requestId) &&
//                 ['open', 'assigned', 'in_progress'].includes(r.status)
//             );

//             if (!hasOpen) {
//                 await Room.updateStatus(request.room_id, 'available');
//             }
//         } else if (status === 'assigned' || status === 'in_progress') {
//             await Room.updateStatus(request.room_id, 'maintenance');
//         }

//         await connection.commit();

//         const updated = await Maintenance.findById(requestId);

//         await logActivity(
//             req.user.id,
//             'UPDATE_STATUS',
//             'maintenance',
//             requestId,
//             { status: request.status },
//             { status: status },
//             req.ip
//         );

//         res.json({
//             success: true,
//             message: 'Status updated successfully',
//             data: updated
//         });
//     } catch (error) {
//         await connection.rollback();
//         console.error('Error updating status:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error updating status',
//             error: error.message
//         });
//     } finally {
//         connection.release();
//     }
// };

// module.exports = {
//     getRequests,
//     getDashboard,
//     createRequest,
//     updateRequest,
//     deleteRequest,
//     updateStatus // ✅ Export the new function
// };