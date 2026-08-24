/**
 * Email Routes - Hotel Management System
 * Handles sending emails via Nodemailer/Mailtrap
 */
const express = require('express');
const router = express.Router();

// ✅ CORRECTLY IMPORT FROM email.js (using actual exported function names)
const {
    sendEmail,
    sendReservationConfirmation,
    sendCheckInEmail,
    sendCheckOutEmail,
    sendInvoiceEmail,
    sendPasswordReset,
    sendWelcomeEmail
} = require('../utils/email');

// ============================================
// ROUTES
// ============================================

// 📧 Send a generic email
router.post('/send', async (req, res) => {
    try {
        const { to, subject, html, text } = req.body;
        
        if (!to || !subject || !html) {
            return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
        }

        const result = await sendEmail(to, subject, html, text);
        
        if (result.success) {
            res.json({ success: true, messageId: result.messageId });
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error('Email send error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 📧 Send Reservation Confirmation
router.post('/reservation-confirmation', async (req, res) => {
    try {
        const { email, guestName, reservation } = req.body;
        
        if (!email || !guestName || !reservation) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await sendReservationConfirmation(email, guestName, reservation);
        
        if (result.success) {
            res.json({ success: true, messageId: result.messageId });
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error('Reservation email error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 📧 Send Check-in Email
router.post('/check-in', async (req, res) => {
    try {
        const { email, guestName, reservation } = req.body;
        
        if (!email || !guestName || !reservation) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await sendCheckInEmail(email, guestName, reservation);
        
        if (result.success) {
            res.json({ success: true, messageId: result.messageId });
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error('Check-in email error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 📧 Send Check-out Email
router.post('/check-out', async (req, res) => {
    try {
        const { email, guestName, invoice } = req.body;
        
        if (!email || !guestName || !invoice) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await sendCheckOutEmail(email, guestName, invoice);
        
        if (result.success) {
            res.json({ success: true, messageId: result.messageId });
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error('Check-out email error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 📧 Send Invoice Email
router.post('/invoice', async (req, res) => {
    try {
        const { email, guestName, invoice } = req.body;
        
        if (!email || !guestName || !invoice) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await sendInvoiceEmail(email, guestName, invoice);
        
        if (result.success) {
            res.json({ success: true, messageId: result.messageId });
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error('Invoice email error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 📧 Send Password Reset Email
router.post('/password-reset', async (req, res) => {
    try {
        const { email, resetToken } = req.body;
        
        if (!email || !resetToken) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await sendPasswordReset(email, resetToken);
        
        if (result.success) {
            res.json({ success: true, messageId: result.messageId });
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error('Password reset email error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 📧 Send Welcome Email
router.post('/welcome', async (req, res) => {
    try {
        const { email, name, password } = req.body;
        
        if (!email || !name || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await sendWelcomeEmail(email, name, password);
        
        if (result.success) {
            res.json({ success: true, messageId: result.messageId });
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error('Welcome email error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 📧 Test Route - Check if email config is working
router.get('/test', async (req, res) => {
    try {
        const testEmail = process.env.TEST_EMAIL || 'test@example.com';
        const result = await sendEmail(
            testEmail,
            'Test Email from Hotel System',
            '<h1>Test Successful!</h1><p>Your email configuration is working properly.</p>'
        );
        res.json({ success: result.success, messageId: result.messageId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;