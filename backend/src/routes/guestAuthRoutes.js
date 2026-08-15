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

        // Find guest by email (including password field)
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

        // Compare password
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

        // Generate JWT token
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

        // Remove password from response
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
// GET GUEST PROFILE
// ============================================
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const guest = await Guest.findById(req.user.id);
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
        console.error('Error fetching guest profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile'
        });
    }
});

// ============================================
// GET GUEST RESERVATIONS
// ============================================
router.get('/reservations', verifyToken, async (req, res) => {
    try {
        const reservations = await Guest.getReservations(req.user.id);
        res.json({
            success: true,
            data: reservations
        });
    } catch (error) {
        console.error('Error fetching guest reservations:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reservations'
        });
    }
});

// ============================================
// GET GUEST INVOICES
// ============================================
router.get('/invoices', verifyToken, async (req, res) => {
    try {
        const invoices = await Guest.getInvoices(req.user.id);
        res.json({
            success: true,
            data: invoices
        });
    } catch (error) {
        console.error('Error fetching guest invoices:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching invoices'
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