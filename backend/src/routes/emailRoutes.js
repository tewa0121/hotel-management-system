const express = require('express');
const { pool } = require('../config/database');
const { verifyToken, authorize } = require('../middleware/auth');
const {
    sendEmail,  // ✅ ADD THIS - Required for test route
    sendReservationConfirmation,
    sendCheckInEmail,
    sendCheckOutEmail,
    sendInvoiceEmail,
    sendPasswordReset,
    sendWelcomeEmail
} = require('../utils/email');
const Reservation = require('../models/Reservation');
const Invoice = require('../models/Invoice');
const Guest = require('../models/Guest');

const router = express.Router();

// ============================================
// SEND RESERVATION CONFIRMATION EMAIL
// ============================================
router.post('/reservation/:id/confirm', verifyToken, async (req, res) => {
    try {
        console.log(`📧 Sending confirmation email for reservation ${req.params.id}`);
        
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        const guest = await Guest.findById(reservation.guest_id);
        if (!guest || !guest.email) {
            return res.status(400).json({
                success: false,
                message: 'Guest email not found'
            });
        }

        const result = await sendReservationConfirmation(
            guest.email,
            `${guest.first_name} ${guest.last_name}`,
            reservation
        );

        if (result.success) {
            res.json({
                success: true,
                message: 'Confirmation email sent successfully',
                data: { to: guest.email }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send email',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending confirmation email',
            error: error.message
        });
    }
});

// ============================================
// SEND CHECK-IN EMAIL
// ============================================
router.post('/reservation/:id/check-in-email', verifyToken, async (req, res) => {
    try {
        console.log(`📧 Sending check-in email for reservation ${req.params.id}`);
        
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        const guest = await Guest.findById(reservation.guest_id);
        if (!guest || !guest.email) {
            return res.status(400).json({
                success: false,
                message: 'Guest email not found'
            });
        }

        const result = await sendCheckInEmail(
            guest.email,
            `${guest.first_name} ${guest.last_name}`,
            reservation
        );

        if (result.success) {
            res.json({
                success: true,
                message: 'Check-in email sent successfully',
                data: { to: guest.email }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send email',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Error sending check-in email:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending check-in email',
            error: error.message
        });
    }
});

// ============================================
// SEND CHECK-OUT EMAIL
// ============================================
router.post('/reservation/:id/check-out-email', verifyToken, async (req, res) => {
    try {
        console.log(`📧 Sending check-out email for reservation ${req.params.id}`);
        
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        const invoices = await Invoice.findByReservation(reservation.id);
        const invoice = invoices[0] || { 
            invoice_number: 'N/A', 
            total: reservation.total_amount || 0, 
            paid_amount: reservation.deposit_paid || 0, 
            balance: reservation.balance || 0 
        };

        const guest = await Guest.findById(reservation.guest_id);
        if (!guest || !guest.email) {
            return res.status(400).json({
                success: false,
                message: 'Guest email not found'
            });
        }

        const result = await sendCheckOutEmail(
            guest.email,
            `${guest.first_name} ${guest.last_name}`,
            invoice
        );

        if (result.success) {
            res.json({
                success: true,
                message: 'Check-out email sent successfully',
                data: { to: guest.email }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send email',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Error sending check-out email:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending check-out email',
            error: error.message
        });
    }
});

// ============================================
// SEND INVOICE EMAIL
// ============================================
router.post('/invoice/:id/send', verifyToken, async (req, res) => {
    try {
        console.log(`📧 Sending invoice email for invoice ${req.params.id}`);
        
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        const guest = await Guest.findById(invoice.guest_id);
        if (!guest || !guest.email) {
            return res.status(400).json({
                success: false,
                message: 'Guest email not found'
            });
        }

        const result = await sendInvoiceEmail(
            guest.email,
            `${guest.first_name} ${guest.last_name}`,
            invoice
        );

        if (result.success) {
            await Invoice.updateStatus(invoice.id, 'sent');
            
            res.json({
                success: true,
                message: 'Invoice email sent successfully',
                data: { to: guest.email }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send email',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Error sending invoice email:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending invoice email',
            error: error.message
        });
    }
});

// ============================================
// SEND PASSWORD RESET EMAIL
// ============================================
router.post('/password-reset', async (req, res) => {
    try {
        const { email } = req.body;
        console.log(`📧 Sending password reset email to ${email}`);
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const resetToken = 'temp-reset-token-' + Date.now();

        const result = await sendPasswordReset(email, resetToken);

        if (result.success) {
            res.json({
                success: true,
                message: 'Password reset email sent successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send email',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Error sending password reset email:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending password reset email',
            error: error.message
        });
    }
});

// ============================================
// SEND WELCOME EMAIL (NEW USER)
// ============================================
router.post('/welcome', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const { email, name, password } = req.body;
        console.log(`📧 Sending welcome email to ${email}`);
        
        if (!email || !name || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email, name, and password are required'
            });
        }

        const result = await sendWelcomeEmail(email, name, password);

        if (result.success) {
            res.json({
                success: true,
                message: 'Welcome email sent successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send email',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Error sending welcome email:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending welcome email',
            error: error.message
        });
    }
});

// ============================================
// ✅ TEST EMAIL CONFIGURATION - FIXED
// ============================================
router.post('/test', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const { email } = req.body;
        console.log(`📧 Sending test email to ${email}`);
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email address is required'
            });
        }

        const testHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
                <div style="text-align: center; padding: 20px; background: #059669; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">✅ Test Email</h1>
                </div>
                <div style="padding: 20px; background: white; border-radius: 0 0 10px 10px;">
                    <p>This is a test email from your Hotel Management System.</p>
                    <p>If you received this, your email configuration is working correctly!</p>
                    <p style="color: #6b7280; font-size: 12px;">Sent at: ${new Date().toLocaleString()}</p>
                </div>
            </div>
        `;

        // ✅ sendEmail is now imported
        const result = await sendEmail(email, 'Test Email - Hotel Management System', testHtml);

        if (result.success) {
            res.json({
                success: true,
                message: 'Test email sent successfully',
                data: { to: email }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send test email',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Error sending test email:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending test email',
            error: error.message
        });
    }
});

module.exports = router;