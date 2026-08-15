const express = require('express');
const { pool } = require('../config/database');
const { verifyToken, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { logActivity } = require('../middleware/auth');

const router = express.Router();

// ============================================
// GET all settings
// ============================================
router.get('/', verifyToken, authorize('admin', 'manager'), async (req, res) => {
    try {
        const [settings] = await pool.execute(
            'SELECT * FROM settings WHERE id = 1'
        );

        if (settings.length === 0) {
            // Insert default settings
            await pool.execute(`
                INSERT INTO settings (
                    hotel_name, hotel_address, hotel_phone, hotel_email, 
                    hotel_logo, currency, timezone, check_in_time, check_out_time,
                    tax_rate, service_charge, default_currency
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                'Hotel Management System',
                '123 Main Street, City',
                '+1234567890',
                'info@hotel.com',
                null,
                'USD',
                'UTC',
                '14:00',
                '11:00',
                12.00,
                5.00,
                'USD'
            ]);
            
            const [newSettings] = await pool.execute(
                'SELECT * FROM settings WHERE id = 1'
            );
            return res.json({
                success: true,
                data: newSettings[0]
            });
        }

        res.json({
            success: true,
            data: settings[0]
        });
    } catch (error) {
        console.error('❌ Error fetching settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching settings',
            error: error.message
        });
    }
});

// ============================================
// PUT update settings (with audit log)
// ============================================
router.put('/', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const {
            hotel_name,
            hotel_address,
            hotel_phone,
            hotel_email,
            hotel_logo,
            currency,
            timezone,
            check_in_time,
            check_out_time,
            tax_rate,
            service_charge,
            default_currency
        } = req.body;

        console.log('📤 Updating settings:', req.body);

        // Get old settings for audit log
        const [oldSettings] = await pool.execute(
            'SELECT * FROM settings WHERE id = 1'
        );

        if (oldSettings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Settings not found'
            });
        }

        await pool.execute(`
            UPDATE settings SET
                hotel_name = ?,
                hotel_address = ?,
                hotel_phone = ?,
                hotel_email = ?,
                hotel_logo = ?,
                currency = ?,
                timezone = ?,
                check_in_time = ?,
                check_out_time = ?,
                tax_rate = ?,
                service_charge = ?,
                default_currency = ?,
                updated_at = NOW()
            WHERE id = 1
        `, [
            hotel_name || oldSettings[0].hotel_name,
            hotel_address || oldSettings[0].hotel_address,
            hotel_phone || oldSettings[0].hotel_phone,
            hotel_email || oldSettings[0].hotel_email,
            hotel_logo || oldSettings[0].hotel_logo,
            currency || oldSettings[0].currency,
            timezone || oldSettings[0].timezone,
            check_in_time || oldSettings[0].check_in_time,
            check_out_time || oldSettings[0].check_out_time,
            tax_rate || oldSettings[0].tax_rate,
            service_charge || oldSettings[0].service_charge,
            default_currency || oldSettings[0].default_currency
        ]);

        const [updated] = await pool.execute(
            'SELECT * FROM settings WHERE id = 1'
        );

        // Audit log
        await logActivity(
            req.user.id,
            'UPDATE',
            'settings',
            1,
            oldSettings[0],
            updated[0],
            req.ip
        );

        console.log('✅ Settings updated and logged to audit');

        res.json({
            success: true,
            message: 'Settings updated successfully',
            data: updated[0]
        });
    } catch (error) {
        console.error('❌ Error updating settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating settings',
            error: error.message
        });
    }
});

// ============================================
// GET all users
// ============================================
router.get('/users', verifyToken, authorize('admin', 'manager'), async (req, res) => {
    try {
        const [users] = await pool.execute(`
            SELECT id, name, email, role, is_active, created_at, updated_at
            FROM users
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users'
        });
    }
});

// ============================================
// POST create user (with audit log)
// ============================================
router.post('/users', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        console.log('📤 Creating user:', { name, email, role });

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'All fields (name, email, password, role) are required'
            });
        }

        // Check if email already exists
        const [existing] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.execute(
            `INSERT INTO users (name, email, password, role, is_active)
             VALUES (?, ?, ?, ?, ?)`,
            [name, email, hashedPassword, role, true]
        );

        const [newUser] = await pool.execute(
            'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?',
            [result.insertId]
        );

        // Audit log
        await logActivity(
            req.user.id,
            'CREATE',
            'user',
            newUser[0].id,
            null,
            newUser[0],
            req.ip
        );

        console.log('✅ User created and logged to audit');

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: newUser[0]
        });
    } catch (error) {
        console.error('❌ Error creating user:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
});

// ============================================
// PUT update user (with audit log)
// ============================================
router.put('/users/:id', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, email, role, is_active, password } = req.body;

        console.log(`📤 Updating user ${userId}`);
        console.log('📤 Request body:', req.body);

        // Check if user exists
        const [existingUser] = await pool.execute(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );

        if (existingUser.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent admin from deactivating themselves
        if (userId == req.user.id && is_active === false) {
            return res.status(400).json({
                success: false,
                message: 'You cannot deactivate your own account'
            });
        }

        // Build update query
        let query = 'UPDATE users SET name = ?, email = ?, role = ?, is_active = ?';
        const params = [
            name || existingUser[0].name,
            email || existingUser[0].email,
            role || existingUser[0].role,
            is_active !== undefined ? is_active : existingUser[0].is_active
        ];

        // Handle password update
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += ', password = ?';
            params.push(hashedPassword);
        }

        query += ', updated_at = NOW() WHERE id = ?';
        params.push(userId);

        console.log('📝 Query:', query);
        console.log('📊 Params:', params);

        await pool.execute(query, params);

        // Get updated user
        const [updated] = await pool.execute(
            'SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE id = ?',
            [userId]
        );

        // Audit log
        await logActivity(
            req.user.id,
            'UPDATE',
            'user',
            updated[0].id,
            existingUser[0],
            updated[0],
            req.ip
        );

        console.log('✅ User updated and logged to audit');

        res.json({
            success: true,
            message: 'User updated successfully',
            data: updated[0]
        });
    } catch (error) {
        console.error('❌ Error updating user:', error);
        console.error('❌ Error details:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
});

// ============================================
// DELETE user (with audit log)
// ============================================
router.delete('/users/:id', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const userId = req.params.id;

        console.log(`📤 Deleting user ${userId}`);

        if (userId == req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        // Get user before deleting for audit log
        const [user] = await pool.execute(
            'SELECT id, name, email, role FROM users WHERE id = ?',
            [userId]
        );

        if (user.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await pool.execute('DELETE FROM users WHERE id = ?', [userId]);

        // Audit log
        await logActivity(
            req.user.id,
            'DELETE',
            'user',
            userId,
            user[0],
            null,
            req.ip
        );

        console.log('✅ User deleted and logged to audit');

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
});

// ============================================
// GET audit logs
// ============================================
router.get('/audit-logs', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const [logs] = await pool.execute(`
            SELECT al.*, u.name as user_name
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        const [count] = await pool.execute(
            'SELECT COUNT(*) as total FROM audit_logs'
        );

        res.json({
            success: true,
            data: logs,
            pagination: {
                page,
                limit,
                total: count[0].total,
                totalPages: Math.ceil(count[0].total / limit)
            }
        });
    } catch (error) {
        console.error('❌ Error fetching audit logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching audit logs',
            error: error.message
        });
    }
});

module.exports = router;