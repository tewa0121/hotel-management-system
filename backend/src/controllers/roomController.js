// const Room = require('../models/Room');
// const RoomType = require('../models/RoomType');
// const { validateRoom } = require('../utils/validators');
// const { logActivity } = require('../middleware/auth');

// // Get all rooms
// const getRooms = async (req, res) => {
//     try {
//         const rooms = await Room.findAll();
//         res.json({
//             success: true,
//             data: rooms
//         });
//     } catch (error) {
//         console.error('Error fetching rooms:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching rooms'
//         });
//     }
// };

// // Get room status board
// const getStatusBoard = async (req, res) => {
//     try {
//         const rooms = await Room.findAll();
//         const statusCounts = {
//             available: 0,
//             reserved: 0,
//             occupied: 0,
//             dirty: 0,
//             cleaning: 0,
//             maintenance: 0,
//             out_of_service: 0
//         };

//         rooms.forEach(room => {
//             if (statusCounts[room.status] !== undefined) {
//                 statusCounts[room.status]++;
//             }
//         });

//         res.json({
//             success: true,
//             data: rooms,
//             summary: statusCounts
//         });
//     } catch (error) {
//         console.error('Error fetching room status:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching room status'
//         });
//     }
// };

// // Get single room
// const getRoom = async (req, res) => {
//     try {
//         const room = await Room.findById(req.params.id);
//         if (!room) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Room not found'
//             });
//         }
//         res.json({
//             success: true,
//             data: room
//         });
//     } catch (error) {
//         console.error('Error fetching room:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching room'
//         });
//     }
// };

// // Create room - ✅ HAS logActivity
// const createRoom = async (req, res) => {
//     try {
//         const validation = validateRoom(req.body);
//         if (!validation.isValid) {
//             return res.status(400).json({
//                 success: false,
//                 errors: validation.errors
//             });
//         }

//         const existing = await Room.findByRoomNumber(req.body.room_number);
//         if (existing) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Room number already exists'
//             });
//         }

//         const room = await Room.create(req.body);

//         await logActivity(
//             req.user.id,
//             'CREATE',
//             'room',
//             room.id,
//             null,
//             room,
//             req.ip
//         );

//         res.status(201).json({
//             success: true,
//             message: 'Room created successfully',
//             data: room
//         });
//     } catch (error) {
//         console.error('Error creating room:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error creating room'
//         });
//     }
// };

// // Update room - ✅ HAS logActivity
// const updateRoom = async (req, res) => {
//     try {
//         const room = await Room.findById(req.params.id);
//         if (!room) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Room not found'
//             });
//         }

//         const updated = await Room.update(req.params.id, req.body);

//         await logActivity(
//             req.user.id,
//             'UPDATE',
//             'room',
//             updated.id,
//             room,
//             updated,
//             req.ip
//         );

//         res.json({
//             success: true,
//             message: 'Room updated successfully',
//             data: updated
//         });
//     } catch (error) {
//         console.error('Error updating room:', error);
//         if (error.code === 'ER_DUP_ENTRY') {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Room number already exists'
//             });
//         }
//         res.status(500).json({
//             success: false,
//             message: 'Error updating room'
//         });
//     }
// };

// // Delete room - ✅ HAS logActivity
// const deleteRoom = async (req, res) => {
//     try {
//         const room = await Room.findById(req.params.id);
//         if (!room) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Room not found'
//             });
//         }

//         await Room.delete(req.params.id);

//         await logActivity(
//             req.user.id,
//             'DELETE',
//             'room',
//             req.params.id,
//             room,
//             null,
//             req.ip
//         );

//         res.json({
//             success: true,
//             message: 'Room deleted successfully'
//         });
//     } catch (error) {
//         console.error('Error deleting room:', error);
//         if (error.code === 'ER_ROW_IS_REFERENCED') {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Cannot delete room with existing reservations'
//             });
//         }
//         res.status(500).json({
//             success: false,
//             message: 'Error deleting room'
//         });
//     }
// };

// // Get room types
// const getRoomTypes = async (req, res) => {
//     try {
//         const types = await RoomType.findAll(true);
//         res.json({
//             success: true,
//             data: types
//         });
//     } catch (error) {
//         console.error('Error fetching room types:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching room types'
//         });
//     }
// };

// module.exports = {
//     getRooms,
//     getStatusBoard,
//     getRoom,
//     createRoom,
//     updateRoom,
//     deleteRoom,
//     getRoomTypes
// };