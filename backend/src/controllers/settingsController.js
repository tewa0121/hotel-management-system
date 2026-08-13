const { pool } = require('../config/database');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { logActivity } = require('../middleware/auth'); // ✅ ADD THIS

// ============================================
// Get settings - ✅ ADDED LOG
// ============================================
const getSettings = async (req, res) => {
    try {
        const [settings] = await pool.execute(
            'SELECT * FROM settings WHERE id = 1'
        );

        if (settings.length === 0) {
            await pool.execute(`
                INSERT INTO settings (id) VALUES (1) ON DUPLICATE KEY UPDATE id=1
            `);
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
        console.error('Error fetching settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching settings'
        });
    }
};

// ============================================
// Update settings - ✅ ADDED LOG
// ============================================
const updateSettings = async (req, res) => {
    try {
        const {
            hotel_name, hotel_address, hotel_phone, hotel_email,
            hotel_logo, currency, timezone, check_in_time, check_out_time,
            tax_rate, service_charge, default_currency
        } = req.body;

        // Get old settings for audit log
        const [oldSettings] = await pool.execute(
            'SELECT * FROM settings WHERE id = 1'
        );

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
            hotel_name, hotel_address, hotel_phone, hotel_email,
            hotel_logo || null, currency, timezone, check_in_time,
            check_out_time, tax_rate, service_charge, default_currency
        ]);

        const [updated] = await pool.execute(
            'SELECT * FROM settings WHERE id = 1'
        );

        // ✅ ADD AUDIT LOG
        await logActivity(
            req.user.id,
            'UPDATE',
            'settings',
            1,
            oldSettings[0],
            updated[0],
            req.ip
        );

        console.log('✅ Settings update logged to audit');

        res.json({
            success: true,
            message: 'Settings updated successfully',
            data: updated[0]
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating settings'
        });
    }
};

// ============================================
// Get users
// ============================================
const getUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users'
        });
    }
};

// ============================================
// Create user - ✅ ADDED LOG
// ============================================
const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const existing = await User.findByEmail(email);
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword, role });

        // ✅ ADD AUDIT LOG
        await logActivity(
            req.user.id,
            'CREATE',
            'user',
            user.id,
            null,
            user,
            req.ip
        );

        console.log('✅ User creation logged to audit');

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: user
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating user'
        });
    }
};

// ============================================
// Update user - ✅ ADDED LOG
// ============================================
const updateUser = async (req, res) => {
    try {
        const { name, email, role, is_active, password } = req.body;
        const userId = req.params.id;

        if (userId == req.user.id && is_active === false) {
            return res.status(400).json({
                success: false,
                message: 'You cannot deactivate your own account'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        const updated = await User.update(userId, {
            name,
            email,
            role,
            is_active,
            password: hashedPassword
        });

        // ✅ ADD AUDIT LOG
        await logActivity(
            req.user.id,
            'UPDATE',
            'user',
            updated.id,
            user,
            updated,
            req.ip
        );

        console.log('✅ User update logged to audit');

        res.json({
            success: true,
            message: 'User updated successfully',
            data: updated
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user'
        });
    }
};

// ============================================
// Delete user - ✅ ADDED LOG
// ============================================
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        if (userId == req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await User.delete(userId);

        // ✅ ADD AUDIT LOG
        await logActivity(
            req.user.id,
            'DELETE',
            'user',
            userId,
            user,
            null,
            req.ip
        );

        console.log('✅ User deletion logged to audit');

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user'
        });
    }
};

// ============================================
// Get audit logs
// ============================================
const getAuditLogs = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;

        const [logs] = await pool.execute(`
            SELECT al.*, u.name as user_name
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT ?
        `, [limit]);

        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching audit logs'
        });
    }
};

module.exports = {
    getSettings,
    updateSettings,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    getAuditLogs
};