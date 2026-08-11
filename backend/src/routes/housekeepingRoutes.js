const express = require('express');
const { pool } = require('../config/db');
const { verifyToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all housekeeping tasks
router.get('/', verifyToken, async (req, res) => {
    try {
        const status = req.query.status || '';
        const assigned_to = req.query.assigned_to || '';

        let query = `
            SELECT h.*,
                   r.room_number, r.building, r.floor,
                   u.name as assigned_to_name,
                   creator.name as created_by_name
            FROM housekeeping h
            LEFT JOIN rooms r ON h.room_id = r.id
            LEFT JOIN users u ON h.assigned_to = u.id
            LEFT JOIN users creator ON h.created_by = creator.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ' AND h.status = ?';
            params.push(status);
        }

        if (assigned_to) {
            query += ' AND h.assigned_to = ?';
            params.push(assigned_to);
        }

        query += ' ORDER BY h.priority DESC, h.created_at DESC';

        const [tasks] = await pool.execute(query, params);

        res.json({
            success: true,
            data: tasks
        });
    } catch (error) {
        console.error('Error fetching housekeeping tasks:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching housekeeping tasks'
        });
    }
});

// Get housekeeping dashboard
router.get('/dashboard', verifyToken, async (req, res) => {
    try {
        // Get task counts by status
        const [statusCounts] = await pool.execute(`
            SELECT status, COUNT(*) as count
            FROM housekeeping
            GROUP BY status
        `);

        // Get pending tasks with room info
        const [pendingTasks] = await pool.execute(`
            SELECT h.*, r.room_number, r.building, r.floor
            FROM housekeeping h
            LEFT JOIN rooms r ON h.room_id = r.id
            WHERE h.status IN ('pending', 'assigned')
            ORDER BY h.priority DESC, h.created_at ASC
            LIMIT 20
        `);

        // Get dirty rooms
        const [dirtyRooms] = await pool.execute(`
            SELECT r.*, rt.name as room_type_name
            FROM rooms r
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
            WHERE r.housekeeping_status = 'dirty'
            ORDER BY r.room_number
        `);

        // Get tasks assigned to current user if housekeeping role
        let myTasks = [];
        if (req.user.role === 'housekeeping') {
            [myTasks] = await pool.execute(`
                SELECT h.*, r.room_number, r.building, r.floor
                FROM housekeeping h
                LEFT JOIN rooms r ON h.room_id = r.id
                WHERE h.assigned_to = ? AND h.status IN ('assigned', 'cleaning')
                ORDER BY h.priority DESC
            `, [req.user.id]);
        }

        res.json({
            success: true,
            data: {
                summary: statusCounts,
                pendingTasks,
                dirtyRooms,
                myTasks
            }
        });
    } catch (error) {
        console.error('Error fetching housekeeping dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching housekeeping dashboard'
        });
    }
});

// Create housekeeping task
router.post('/', verifyToken, authorize('admin', 'manager', 'receptionist'), async (req, res) => {
    try {
        const {
            room_id,
            assigned_to,
            priority,
            status,
            notes
        } = req.body;

        if (!room_id) {
            return res.status(400).json({
                success: false,
                message: 'Room ID is required'
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO housekeeping (
                room_id, assigned_to, priority, status, notes, created_by
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
                room_id, assigned_to || null,
                priority || 'normal', status || 'pending',
                notes || null, req.user.id
            ]
        );

        // Update room housekeeping status
        await pool.execute(
            'UPDATE rooms SET housekeeping_status = ? WHERE id = ?',
            ['dirty', room_id]
        );

        const [newTask] = await pool.execute(`
            SELECT h.*, r.room_number, u.name as assigned_to_name
            FROM housekeeping h
            LEFT JOIN rooms r ON h.room_id = r.id
            LEFT JOIN users u ON h.assigned_to = u.id
            WHERE h.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Housekeeping task created successfully',
            data: newTask[0]
        });
    } catch (error) {
        console.error('Error creating housekeeping task:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating housekeeping task'
        });
    }
});

// Update housekeeping task
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const {
            assigned_to,
            priority,
            status,
            start_time,
            completion_time,
            notes
        } = req.body;

        const [result] = await pool.execute(
            `UPDATE housekeeping SET
                assigned_to = ?,
                priority = ?,
                status = ?,
                start_time = ?,
                completion_time = ?,
                notes = ?
            WHERE id = ?`,
            [
                assigned_to, priority, status,
                start_time || null, completion_time || null,
                notes, req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Update room status if task completed
        if (status === 'completed' || status === 'inspected') {
            const [task] = await pool.execute(
                'SELECT room_id FROM housekeeping WHERE id = ?',
                [req.params.id]
            );
            if (task.length > 0) {
                await pool.execute(
                    'UPDATE rooms SET housekeeping_status = ? WHERE id = ?',
                    [status === 'inspected' ? 'inspected' : 'clean', task[0].room_id]
                );
            }
        }

        const [updatedTask] = await pool.execute(`
            SELECT h.*, r.room_number, u.name as assigned_to_name
            FROM housekeeping h
            LEFT JOIN rooms r ON h.room_id = r.id
            LEFT JOIN users u ON h.assigned_to = u.id
            WHERE h.id = ?
        `, [req.params.id]);

        res.json({
            success: true,
            message: 'Task updated successfully',
            data: updatedTask[0]
        });
    } catch (error) {
        console.error('Error updating housekeeping task:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating housekeeping task'
        });
    }
});

// Assign task to staff
router.post('/:id/assign', verifyToken, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { assigned_to } = req.body;

        if (!assigned_to) {
            return res.status(400).json({
                success: false,
                message: 'Staff ID is required'
            });
        }

        const [result] = await pool.execute(
            'UPDATE housekeeping SET assigned_to = ?, status = ? WHERE id = ?',
            [assigned_to, 'assigned', req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        res.json({
            success: true,
            message: 'Task assigned successfully'
        });
    } catch (error) {
        console.error('Error assigning task:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning task'
        });
    }
});

// Delete housekeeping task
router.delete('/:id', verifyToken, authorize('admin', 'manager'), async (req, res) => {
    try {
        const [result] = await pool.execute(
            'DELETE FROM housekeeping WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        res.json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting task'
        });
    }
});

module.exports = router;