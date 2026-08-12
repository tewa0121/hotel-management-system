// const Housekeeping = require('../models/Housekeeping');
// const Room = require('../models/Room');
// const { logActivity } = require('../middleware/auth');

// // Get all tasks
// const getTasks = async (req, res) => {
//     try {
//         const status = req.query.status || '';
//         const assignedTo = req.query.assigned_to || '';

//         const tasks = await Housekeeping.findAll(status, assignedTo);

//         res.json({
//             success: true,
//             data: tasks
//         });
//     } catch (error) {
//         console.error('Error fetching housekeeping tasks:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching housekeeping tasks'
//         });
//     }
// };

// // Get dashboard
// const getDashboard = async (req, res) => {
//     try {
//         const dashboard = await Housekeeping.getDashboard();
//         res.json({
//             success: true,
//             data: dashboard
//         });
//     } catch (error) {
//         console.error('Error fetching housekeeping dashboard:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching housekeeping dashboard'
//         });
//     }
// };

// // Create task
// const createTask = async (req, res) => {
//     try {
//         const { room_id, assigned_to, priority, status, notes } = req.body;

//         if (!room_id) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Room ID is required'
//             });
//         }

//         const taskData = {
//             room_id,
//             assigned_to: assigned_to || null,
//             priority: priority || 'normal',
//             status: status || 'pending',
//             notes: notes || null,
//             created_by: req.user.id
//         };

//         const task = await Housekeeping.create(taskData);

//         // Update room housekeeping status
//         await Room.updateHousekeepingStatus(room_id, 'dirty');

//         await logActivity(
//             req.user.id,
//             'CREATE',
//             'housekeeping',
//             task.id,
//             null,
//             task,
//             req.ip
//         );

//         res.status(201).json({
//             success: true,
//             message: 'Housekeeping task created successfully',
//             data: task
//         });
//     } catch (error) {
//         console.error('Error creating housekeeping task:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error creating housekeeping task'
//         });
//     }
// };

// // Update task
// const updateTask = async (req, res) => {
//     try {
//         const { assigned_to, priority, status, start_time, completion_time, notes } = req.body;

//         const task = await Housekeeping.findById(req.params.id);
//         if (!task) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Task not found'
//             });
//         }

//         const updated = await Housekeeping.update(req.params.id, {
//             assigned_to,
//             priority,
//             status,
//             start_time,
//             completion_time,
//             notes
//         });

//         // Update room status if task completed
//         if (status === 'completed' || status === 'inspected') {
//             await Room.updateHousekeepingStatus(task.room_id, status === 'inspected' ? 'inspected' : 'clean');
//         }

//         await logActivity(
//             req.user.id,
//             'UPDATE',
//             'housekeeping',
//             updated.id,
//             task,
//             updated,
//             req.ip
//         );

//         res.json({
//             success: true,
//             message: 'Task updated successfully',
//             data: updated
//         });
//     } catch (error) {
//         console.error('Error updating housekeeping task:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error updating housekeeping task'
//         });
//     }
// };

// // Assign task
// const assignTask = async (req, res) => {
//     try {
//         const { assigned_to } = req.body;

//         if (!assigned_to) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Staff ID is required'
//             });
//         }

//         const task = await Housekeeping.findById(req.params.id);
//         if (!task) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Task not found'
//             });
//         }

//         const updated = await Housekeeping.assign(req.params.id, assigned_to);

//         await logActivity(
//             req.user.id,
//             'ASSIGN',
//             'housekeeping',
//             updated.id,
//             { assigned_to: task.assigned_to },
//             { assigned_to },
//             req.ip
//         );

//         res.json({
//             success: true,
//             message: 'Task assigned successfully',
//             data: updated
//         });
//     } catch (error) {
//         console.error('Error assigning task:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error assigning task'
//         });
//     }
// };

// // Delete task
// const deleteTask = async (req, res) => {
//     try {
//         const task = await Housekeeping.findById(req.params.id);
//         if (!task) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Task not found'
//             });
//         }

//         await Housekeeping.delete(req.params.id);

//         await logActivity(
//             req.user.id,
//             'DELETE',
//             'housekeeping',
//             req.params.id,
//             task,
//             null,
//             req.ip
//         );

//         res.json({
//             success: true,
//             message: 'Task deleted successfully'
//         });
//     } catch (error) {
//         console.error('Error deleting task:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error deleting task'
//         });
//     }
// };

// module.exports = {
//     getTasks,
//     getDashboard,
//     createTask,
//     updateTask,
//     assignTask,
//     deleteTask
// };