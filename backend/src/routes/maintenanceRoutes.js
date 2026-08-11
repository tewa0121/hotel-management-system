const express = require('express');
const { pool } = require('../config/db');
const { verifyToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all maintenance requests
router.get('/', verifyToken, async (req, res) => {
    try {
        const status = req.query.status || '';
        const priority = req.query.priority || '';

        let query = `
            SELECT m.*,
                   r.room_number, r.building, r.floor,
                   u.name as assigned_to_name,
                   creator.name as created_by_name
            FROM maintenance m
            LEFT JOIN rooms r ON m.room_id = r.id
            LEFT JOIN users u ON m.assigned_to = u.id
            LEFT JOIN users creator ON m.created_by = creator.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ' AND m.status = ?';
            params.push(status);
        }

        if (priority) {
            query += ' AND m.priority = ?';
            params.push(priority);
        }

        query += ' ORDER BY m.priority DESC, m.created_at DESC';

        const [requests] = await pool.execute(query, params);

        res.json({
            success: true,
            data: requests
        });
    } catch (error) {
        console.error('Error fetching maintenance requests:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching maintenance requests'
        });
    }
});

// Get maintenance dashboard
router.get('/dashboard', verifyToken, async (req, res) => {
    try {
        // Get request counts by status
        const [statusCounts] = await pool.execute(`
            SELECT status, COUNT(*) as count
            FROM maintenance
            GROUP BY status
        `);

        // Get open requests with room info
        const [openRequests] = await pool.execute(`
            SELECT m.*, r.room_number, r.building, r.floor
            FROM maintenance m
            LEFT JOIN rooms r ON m.room_id = r.id
            WHERE m.status IN ('open', 'assigned', 'in_progress')
            ORDER BY m.priority DESC, m.created_at ASC
            LIMIT 20
        `);

        // Get rooms under maintenance
        const [roomsUnderMaintenance] = await pool.execute(`
            SELECT r.*, rt.name as room_type_name
            FROM rooms r
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
            WHERE r.status = 'maintenance'
            ORDER BY r.room_number
        `);

        res.json({
            success: true,
            data: {
                summary: statusCounts,
                openRequests,
                roomsUnderMaintenance
            }
        });
    } catch (error) {
        console.error('Error fetching maintenance dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching maintenance dashboard'
        });
    }
});

// Create maintenance request
router.post('/', verifyToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            room_id,
            category,
            description,
            priority,
            assigned_to,
            notes
        } = req.body;

        if (!room_id || !category || !description) {
            return res.status(400).json({
                success: false,
                message: 'Room ID, Category, and Description are required'
            });
        }

        const [result] = await connection.execute(
            `INSERT INTO maintenance (
                room_id, category, description, priority,
                assigned_to, notes, created_by, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                room_id, category, description,
                priority || 'medium', assigned_to || null,
                notes || null, req.user.id, 'open'
            ]
        );

        // Update room status to maintenance if priority is high or critical
        if (priority === 'high' || priority === 'critical') {
            await connection.execute(
                'UPDATE rooms SET status = ? WHERE id = ?',
                ['maintenance', room_id]
            );
        }

        await connection.commit();

        const [newRequest] = await connection.execute(`
            SELECT m.*, r.room_number, u.name as assigned_to_name
            FROM maintenance m
            LEFT JOIN rooms r ON m.room_id = r.id
            LEFT JOIN users u ON m.assigned_to = u.id
            WHERE m.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Maintenance request created successfully',
            data: newRequest[0]
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating maintenance request:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating maintenance request'
        });
    } finally {
        connection.release();
    }
});

// Update maintenance request
router.put('/:id', verifyToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            category,
            description,
            priority,
            assigned_to,
            status,
            start_date,
            completion_date,
            cost,
            notes
        } = req.body;

        const [result] = await connection.execute(
            `UPDATE maintenance SET
                category = ?,
                description = ?,
                priority = ?,
                assigned_to = ?,
                status = ?,
                start_date = ?,
                completion_date = ?,
                cost = ?,
                notes = ?
            WHERE id = ?`,
            [
                category, description, priority,
                assigned_to, status, start_date || null,
                completion_date || null, cost || null,
                notes, req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        // Get room_id for this maintenance
        const [request] = await connection.execute(
            'SELECT room_id FROM maintenance WHERE id = ?',
            [req.params.id]
        );

        // Update room status based on maintenance status
        if (request.length > 0) {
            if (status === 'completed' || status === 'cancelled') {
                // Check if room has other open maintenance requests
                const [otherRequests] = await connection.execute(
                    'SELECT COUNT(*) as count FROM maintenance WHERE room_id = ? AND status IN ("open", "assigned", "in_progress") AND id != ?',
                    [request[0].room_id, req.params.id]
                );

                if (otherRequests[0].count === 0) {
                    await connection.execute(
                        'UPDATE rooms SET status = ? WHERE id = ?',
                        ['available', request[0].room_id]
                    );
                }
            } else if (status === 'assigned' || status === 'in_progress') {
                await connection.execute(
                    'UPDATE rooms SET status = ? WHERE id = ?',
                    ['maintenance', request[0].room_id]
                );
            }
        }

        await connection.commit();

        const [updatedRequest] = await connection.execute(`
            SELECT m.*, r.room_number, u.name as assigned_to_name
            FROM maintenance m
            LEFT JOIN rooms r ON m.room_id = r.id
            LEFT JOIN users u ON m.assigned_to = u.id
            WHERE m.id = ?
        `, [req.params.id]);

        res.json({
            success: true,
            message: 'Request updated successfully',
            data: updatedRequest[0]
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating maintenance request:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating maintenance request'
        });
    } finally {
        connection.release();
    }
});

// Delete maintenance request
router.delete('/:id', verifyToken, authorize('admin', 'manager'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Get room_id before deleting
        const [request] = await connection.execute(
            'SELECT room_id FROM maintenance WHERE id = ?',
            [req.params.id]
        );

        const [result] = await connection.execute(
            'DELETE FROM maintenance WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        // Check if room has other maintenance requests
        if (request.length > 0) {
            const [otherRequests] = await connection.execute(
                'SELECT COUNT(*) as count FROM maintenance WHERE room_id = ? AND status IN ("open", "assigned", "in_progress")',
                [request[0].room_id]
            );

            if (otherRequests[0].count === 0) {
                await connection.execute(
                    'UPDATE rooms SET status = ? WHERE id = ?',
                    ['available', request[0].room_id]
                );
            }
        }

        await connection.commit();

        res.json({
            success: true,
            message: 'Request deleted successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting maintenance request:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting maintenance request'
        });
    } finally {
        connection.release();
    }
});

module.exports = router;