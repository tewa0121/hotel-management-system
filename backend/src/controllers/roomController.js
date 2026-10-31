const Room = require('../models/Room');
const RoomType = require('../models/RoomType');
const { validateRoom } = require('../utils/validators');
const { logActivity } = require('../middleware/auth');

const VALID_HOUSEKEEPING_STATUSES = ['clean', 'dirty', 'cleaning', 'inspected'];

// Returns a list of error messages (an empty list means the data is valid)
const getRoomErrors = (data) => {
    const { errors } = validateRoom(data);
    if (data.housekeeping_status && !VALID_HOUSEKEEPING_STATUSES.includes(data.housekeeping_status)) {
        errors.push('Invalid housekeeping status');
    }
    return errors;
};

const validationFailed = (res, errors) => res.status(400).json({
    success: false,
    message: errors.join(', '),
    errors
});

// ============================================
// GET /api/rooms
// ============================================
const getRooms = async (req, res) => {
    try {
        const rooms = await Room.findAll();
        res.json({
            success: true,
            data: rooms
        });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching rooms'
        });
    }
};

// ============================================
// GET /api/rooms/status-board
// ============================================
const getStatusBoard = async (req, res) => {
    try {
        const rooms = await Room.findStatusBoard();

        const statusCounts = {
            available: 0,
            reserved: 0,
            occupied: 0,
            dirty: 0,
            cleaning: 0,
            maintenance: 0,
            out_of_service: 0
        };

        rooms.forEach(room => {
            if (statusCounts[room.status] !== undefined) {
                statusCounts[room.status]++;
            }
        });

        res.json({
            success: true,
            data: rooms,
            summary: statusCounts
        });
    } catch (error) {
        console.error('Error fetching room status:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching room status'
        });
    }
};

// ============================================
// GET /api/rooms/types/all
// ============================================
const getRoomTypes = async (req, res) => {
    try {
        const types = await RoomType.findAll(true);
        res.json({
            success: true,
            data: types
        });
    } catch (error) {
        console.error('Error fetching room types:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching room types'
        });
    }
};

// ============================================
// GET /api/rooms/:id
// ============================================
const getRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }
        res.json({
            success: true,
            data: room
        });
    } catch (error) {
        console.error('Error fetching room:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching room'
        });
    }
};

// ============================================
// POST /api/rooms
// ============================================
const createRoom = async (req, res) => {
    try {
        const errors = getRoomErrors(req.body);
        if (errors.length > 0) {
            return validationFailed(res, errors);
        }

        const existing = await Room.findByRoomNumber(req.body.room_number);
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Room number already exists'
            });
        }

        const room = await Room.create(req.body);

        await logActivity(req.user.id, 'CREATE', 'room', room.id, null, room, req.ip);

        res.status(201).json({
            success: true,
            message: 'Room created successfully',
            data: room
        });
    } catch (error) {
        console.error('Error creating room:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Room number already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error creating room'
        });
    }
};

// ============================================
// PUT /api/rooms/:id  (partial updates allowed)
// ============================================
const updateRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Validate the room as it WILL look after the update
        const errors = getRoomErrors({ ...room, ...req.body });
        if (errors.length > 0) {
            return validationFailed(res, errors);
        }

        if (req.body.room_number && req.body.room_number !== room.room_number) {
            const duplicate = await Room.findByRoomNumber(req.body.room_number);
            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    message: 'Room number already exists'
                });
            }
        }

        const updated = await Room.update(req.params.id, req.body);

        await logActivity(req.user.id, 'UPDATE', 'room', updated.id, room, updated, req.ip);

        res.json({
            success: true,
            message: 'Room updated successfully',
            data: updated
        });
    } catch (error) {
        console.error('Error updating room:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Room number already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error updating room'
        });
    }
};

// ============================================
// DELETE /api/rooms/:id
// ============================================
const deleteRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        await Room.delete(req.params.id);

        await logActivity(req.user.id, 'DELETE', 'room', room.id, room, null, req.ip);

        res.json({
            success: true,
            message: 'Room deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting room:', error);
        // MySQL reports a blocked delete (reservations point at this room) as ER_ROW_IS_REFERENCED_2
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete room with existing reservations'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error deleting room'
        });
    }
};

module.exports = {
    getRooms,
    getStatusBoard,
    getRoomTypes,
    getRoom,
    createRoom,
    updateRoom,
    deleteRoom
};