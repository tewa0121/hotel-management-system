const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { verifyToken, authorize } = require('../middleware/auth');
const Guest = require('../models/Guest');

const router = express.Router();

// ============================================
// GUEST LOGIN – WITH DEBUG LOGS
// ============================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔍 =========================================');
        console.log('🔍 GUEST LOGIN ATTEMPT');
        console.log('🔍 Email:', email);
        console.log('🔍 Password provided:', password ? '****' : 'missing');

        if (!email || !password) {
            console.log('❌ Email or password missing');
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        console.log('🔍 Looking up guest in database...');
        const guest = await Guest.findByEmailWithPassword(email);

        if (!guest) {
            console.log('❌ Guest NOT found with email:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        console.log('✅ Guest found:');
        console.log('   ID:', guest.id);
        console.log('   Name:', guest.first_name, guest.last_name);
        console.log('   Email:', guest.email);
        console.log('   Password in DB:', guest.password ? 'hashed (exists)' : 'NULL (missing)');

        if (!guest.password) {
            console.log('❌ Guest has NO password set in database');
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        console.log('🔍 Comparing password with hash...');
        const isMatch = await bcrypt.compare(password, guest.password);
        console.log('🔍 Password match result:', isMatch);

        if (!isMatch) {
            console.log('❌ Password does NOT match');
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        console.log('✅ Password matched successfully!');

        const token = jwt.sign(
            {
                id: guest.id,
                email: guest.email,
                role: 'guest',
                firstName: guest.first_name,
                lastName: guest.last_name
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        delete guest.password;

        console.log('✅ Login successful for:', guest.email);
        console.log('🔍 =========================================');

        res.json({
            success: true,
            message: 'Login successful',
            token,
            guest: {
                id: guest.id,
                first_name: guest.first_name,
                last_name: guest.last_name,
                email: guest.email,
                phone: guest.phone
            }
        });
    } catch (error) {
        console.error('❌ Guest login error:', error);
        console.error('❌ Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// ============================================
// GET GUEST PROFILE – WITH DEBUG LOGS
// ============================================
router.get('/profile', verifyToken, async (req, res) => {
    try {
        console.log('🔍 Guest profile request - User ID:', req.user.id);
        const guest = await Guest.findById(req.user.id);
        console.log('🔍 Guest found:', guest ? 'Yes (ID: ' + guest.id + ')' : 'No');

        if (!guest) {
            return res.status(404).json({
                success: false,
                message: 'Guest not found'
            });
        }
        delete guest.password;
        res.json({
            success: true,
            data: guest
        });
    } catch (error) {
        console.error('❌ Error fetching guest profile:', error);
        console.error('❌ Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: error.message
        });
    }
});

// ============================================
// GET GUEST RESERVATIONS – WITH DEBUG LOGS
// ============================================
router.get('/reservations', verifyToken, async (req, res) => {
    try {
        console.log('🔍 Guest reservations request - User ID:', req.user.id);
        const reservations = await Guest.getReservations(req.user.id);
        console.log('🔍 Reservations found:', reservations.length);
        res.json({
            success: true,
            data: reservations
        });
    } catch (error) {
        console.error('❌ Error fetching guest reservations:', error);
        console.error('❌ Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error fetching reservations',
            error: error.message
        });
    }
});

// ============================================
// GET GUEST INVOICES – WITH DEBUG LOGS
// ============================================
router.get('/invoices', verifyToken, async (req, res) => {
    try {
        console.log('🔍 Guest invoices request - User ID:', req.user.id);
        const invoices = await Guest.getInvoices(req.user.id);
        console.log('🔍 Invoices found:', invoices.length);
        res.json({
            success: true,
            data: invoices
        });
    } catch (error) {
        console.error('❌ Error fetching guest invoices:', error);
        console.error('❌ Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error fetching invoices',
            error: error.message
        });
    }
});

// ============================================
// ✅ NEW: GET GUEST FOOD ORDERS
// ============================================
router.get('/food-orders', verifyToken, async (req, res) => {
    try {
        console.log('🔍 Guest food orders request - User ID:', req.user.id);
        
        const [orders] = await pool.execute(`
            SELECT fo.*, 
                   COUNT(foi.id) as item_count,
                   GROUP_CONCAT(fi.name SEPARATOR ', ') as item_names
            FROM food_orders fo
            LEFT JOIN food_order_items foi ON fo.id = foi.order_id
            LEFT JOIN food_items fi ON foi.food_item_id = fi.id
            WHERE fo.guest_id = ?
            GROUP BY fo.id
            ORDER BY fo.created_at DESC
        `, [req.user.id]);

        // Get items for each order
        for (let order of orders) {
            const [items] = await pool.execute(`
                SELECT foi.*, fi.name as item_name
                FROM food_order_items foi
                JOIN food_items fi ON foi.food_item_id = fi.id
                WHERE foi.order_id = ?
            `, [order.id]);
            order.items = items;
        }

        console.log('🔍 Food orders found:', orders.length);

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('❌ Error fetching guest food orders:', error);
        console.error('❌ Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error fetching food orders',
            error: error.message
        });
    }
});

// ============================================
// UPDATE GUEST PROFILE
// ============================================
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { first_name, last_name, phone, address, city, country } = req.body;
        const updated = await Guest.update(req.user.id, {
            first_name,
            last_name,
            phone,
            address,
            city,
            country
        });
        delete updated.password;
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updated
        });
    } catch (error) {
        console.error('Error updating guest profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile'
        });
    }
});

// ============================================
// CHANGE GUEST PASSWORD
// ============================================
router.post('/change-password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        const guest = await Guest.findById(req.user.id);
        if (!guest || !guest.password) {
            return res.status(404).json({
                success: false,
                message: 'Guest not found or no password set'
            });
        }

        const isMatch = await bcrypt.compare(currentPassword, guest.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await Guest.updatePassword(req.user.id, hashedPassword);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Error changing guest password:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password'
        });
    }
});

// ============================================
// ADMIN: SET GUEST PASSWORD
// ============================================
router.post('/set-password', verifyToken, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { guestId, password } = req.body;

        if (!guestId || !password) {
            return res.status(400).json({
                success: false,
                message: 'Guest ID and password are required'
            });
        }

        const guest = await Guest.findById(guestId);
        if (!guest) {
            return res.status(404).json({
                success: false,
                message: 'Guest not found'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await Guest.updatePassword(guestId, hashedPassword);

        res.json({
            success: true,
            message: 'Password set successfully'
        });
    } catch (error) {
        console.error('Error setting guest password:', error);
        res.status(500).json({
            success: false,
            message: 'Error setting password'
        });
    }
});

module.exports = router;