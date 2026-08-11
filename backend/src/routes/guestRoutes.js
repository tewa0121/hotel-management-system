const express = require('express');
const { pool } = require('../config/db');
const { verifyToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all guests (with pagination)
router.get('/', verifyToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        let query = 'SELECT * FROM guests';
        let countQuery = 'SELECT COUNT(*) as total FROM guests';
        const params = [];

        if (search) {
            query += ' WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?';
            countQuery += ' WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [guests] = await pool.execute(query, params);
        const [countResult] = await pool.execute(countQuery, params.slice(0, params.length - 2));

        res.json({
            success: true,
            data: guests,
            pagination: {
                page,
                limit,
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching guests:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching guests'
        });
    }
});

// Get single guest
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [guests] = await pool.execute(
            'SELECT * FROM guests WHERE id = ?',
            [req.params.id]
        );

        if (guests.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Guest not found'
            });
        }

        res.json({
            success: true,
            data: guests[0]
        });
    } catch (error) {
        console.error('Error fetching guest:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching guest'
        });
    }
});

// Create guest
router.post('/', verifyToken, async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            phone,
            address,
            city,
            country,
            id_type,
            id_number,
            date_of_birth,
            gender,
            nationality,
            emergency_contact_name,
            emergency_contact_phone,
            notes
        } = req.body;

        // Validate required fields
        if (!first_name || !last_name || !phone) {
            return res.status(400).json({
                success: false,
                message: 'First name, last name, and phone are required'
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO guests (
                first_name, last_name, email, phone, address, city, country,
                id_type, id_number, date_of_birth, gender, nationality,
                emergency_contact_name, emergency_contact_phone, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                first_name, last_name, email || null, phone, address || null,
                city || null, country || null, id_type || 'passport',
                id_number || null, date_of_birth || null, gender || 'other',
                nationality || null, emergency_contact_name || null,
                emergency_contact_phone || null, notes || null
            ]
        );

        const [newGuest] = await pool.execute(
            'SELECT * FROM guests WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Guest created successfully',
            data: newGuest[0]
        });
    } catch (error) {
        console.error('Error creating guest:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error creating guest'
        });
    }
});

// Update guest
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            phone,
            address,
            city,
            country,
            id_type,
            id_number,
            date_of_birth,
            gender,
            nationality,
            emergency_contact_name,
            emergency_contact_phone,
            notes
        } = req.body;

        const [result] = await pool.execute(
            `UPDATE guests SET
                first_name = ?,
                last_name = ?,
                email = ?,
                phone = ?,
                address = ?,
                city = ?,
                country = ?,
                id_type = ?,
                id_number = ?,
                date_of_birth = ?,
                gender = ?,
                nationality = ?,
                emergency_contact_name = ?,
                emergency_contact_phone = ?,
                notes = ?
            WHERE id = ?`,
            [
                first_name, last_name, email, phone, address,
                city, country, id_type, id_number, date_of_birth,
                gender, nationality, emergency_contact_name,
                emergency_contact_phone, notes, req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Guest not found'
            });
        }

        const [updatedGuest] = await pool.execute(
            'SELECT * FROM guests WHERE id = ?',
            [req.params.id]
        );

        res.json({
            success: true,
            message: 'Guest updated successfully',
            data: updatedGuest[0]
        });
    } catch (error) {
        console.error('Error updating guest:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error updating guest'
        });
    }
});

// Delete guest
router.delete('/:id', verifyToken, authorize('admin', 'manager'), async (req, res) => {
    try {
        const [result] = await pool.execute(
            'DELETE FROM guests WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Guest not found'
            });
        }

        res.json({
            success: true,
            message: 'Guest deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting guest:', error);
        if (error.code === 'ER_ROW_IS_REFERENCED') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete guest with existing reservations'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error deleting guest'
        });
    }
});

module.exports = router;