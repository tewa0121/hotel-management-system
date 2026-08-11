const express = require('express');
const { pool } = require('../config/db');
const { verifyToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all rooms with room type info
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rooms] = await pool.execute(`
            SELECT r.*, rt.name as room_type_name, rt.base_price, rt.max_occupancy, rt.bed_type
            FROM rooms r
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
            WHERE r.is_active = TRUE
            ORDER BY r.room_number
        `);

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
});

// Get room status board
router.get('/status-board', verifyToken, async (req, res) => {
    try {
        const [rooms] = await pool.execute(`
            SELECT 
                r.*,
                rt.name as room_type_name,
                rt.base_price,
                rt.max_occupancy,
                rt.bed_type,
                (
                    SELECT COUNT(*) 
                    FROM reservations res 
                    WHERE res.room_id = r.id 
                    AND res.reservation_status IN ('confirmed', 'checked_in')
                    AND res.check_out_date >= CURDATE()
                ) as current_reservations
            FROM rooms r
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
            WHERE r.is_active = TRUE
            ORDER BY r.floor, r.room_number
        `);

        // Group by status for dashboard
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
});

// Get single room
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [rooms] = await pool.execute(`
            SELECT r.*, rt.name as room_type_name, rt.base_price, rt.max_occupancy, rt.bed_type
            FROM rooms r
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
            WHERE r.id = ?
        `, [req.params.id]);

        if (rooms.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        res.json({
            success: true,
            data: rooms[0]
        });
    } catch (error) {
        console.error('Error fetching room:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching room'
        });
    }
});

// Create room
router.post('/', verifyToken, authorize('admin', 'manager'), async (req, res) => {
    try {
        const {
            room_number,
            room_type_id,
            floor,
            building,
            status,
            housekeeping_status,
            price_override,
            amenities,
            notes
        } = req.body;

        if (!room_number || !room_type_id) {
            return res.status(400).json({
                success: false,
                message: 'Room number and room type are required'
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO rooms (
                room_number, room_type_id, floor, building, status,
                housekeeping_status, price_override, amenities, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                room_number, room_type_id, floor || 1,
                building || 'Main', status || 'available',
                housekeeping_status || 'clean', price_override || null,
                amenities || null, notes || null
            ]
        );

        const [newRoom] = await pool.execute(`
            SELECT r.*, rt.name as room_type_name
            FROM rooms r
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
            WHERE r.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Room created successfully',
            data: newRoom[0]
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
});

// Update room
router.put('/:id', verifyToken, authorize('admin', 'manager'), async (req, res) => {
    try {
        const {
            room_number,
            room_type_id,
            floor,
            building,
            status,
            housekeeping_status,
            price_override,
            amenities,
            notes,
            is_active
        } = req.body;

        const [result] = await pool.execute(
            `UPDATE rooms SET
                room_number = ?,
                room_type_id = ?,
                floor = ?,
                building = ?,
                status = ?,
                housekeeping_status = ?,
                price_override = ?,
                amenities = ?,
                notes = ?,
                is_active = ?
            WHERE id = ?`,
            [
                room_number, room_type_id, floor, building,
                status, housekeeping_status, price_override,
                amenities, notes, is_active !== undefined ? is_active : true,
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const [updatedRoom] = await pool.execute(`
            SELECT r.*, rt.name as room_type_name
            FROM rooms r
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
            WHERE r.id = ?
        `, [req.params.id]);

        res.json({
            success: true,
            message: 'Room updated successfully',
            data: updatedRoom[0]
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
});

// Delete room
router.delete('/:id', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const [result] = await pool.execute(
            'DELETE FROM rooms WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        res.json({
            success: true,
            message: 'Room deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting room:', error);
        if (error.code === 'ER_ROW_IS_REFERENCED') {
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
});

// Room Types
router.get('/types/all', verifyToken, async (req, res) => {
    try {
        const [types] = await pool.execute(
            'SELECT * FROM room_types WHERE is_active = TRUE ORDER BY name'
        );
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
});

module.exports = router;