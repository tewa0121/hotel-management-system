const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// ============================================
// CREATE TRANSPORTER - FIXED FOR MAILTRAP
// ============================================
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // Use STARTTLS (true for port 465)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    // ✅ Fix for TLS connection issues
    tls: {
        rejectUnauthorized: false // Allows self-signed certificates (safe for testing)
    },
    // ✅ Additional connection options
    connectionTimeout: 10000, // 10 seconds
    socketTimeout: 10000
});

// ============================================
// SEND EMAIL FUNCTION - ✅ EXPORTED
// ============================================
const sendEmail = async (to, subject, html, text = '') => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'Hotel Management System <noreply@hotel.com>',
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]*>/g, '')
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email error:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// EMAIL TEMPLATES (unchanged)
// ============================================
const templates = {
    // 1. Reservation Confirmation
    reservationConfirmation: (guestName, reservation, hotelName = 'Hotel Management System') => {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
                <div style="text-align: center; padding: 20px; background: #1e3a8a; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">🏨 ${hotelName}</h1>
                </div>
                <div style="padding: 20px; background: white; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #1e3a8a;">Reservation Confirmed! ✅</h2>
                    <p>Dear <strong>${guestName}</strong>,</p>
                    <p>Your reservation has been confirmed. Here are the details:</p>
                    
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <p><strong>Reservation Number:</strong> ${reservation.reservation_number}</p>
                        <p><strong>Check-in:</strong> ${reservation.check_in_date}</p>
                        <p><strong>Check-out:</strong> ${reservation.check_out_date}</p>
                        <p><strong>Room:</strong> ${reservation.room_number}</p>
                        <p><strong>Total Amount:</strong> $${reservation.total_amount}</p>
                    </div>
                    
                    <p>We look forward to welcoming you!</p>
                    <p style="color: #6b7280; font-size: 12px;">If you have any questions, please contact us.</p>
                </div>
                <div style="text-align: center; padding: 10px; color: #6b7280; font-size: 12px;">
                    © ${new Date().getFullYear()} ${hotelName}. All rights reserved.
                </div>
            </div>
        `;
    },

    // 2. Check-in Confirmation
    checkInConfirmation: (guestName, reservation, hotelName = 'Hotel Management System') => {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
                <div style="text-align: center; padding: 20px; background: #059669; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">🏨 ${hotelName}</h1>
                </div>
                <div style="padding: 20px; background: white; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #059669;">Welcome! You're Checked In 🎉</h2>
                    <p>Dear <strong>${guestName}</strong>,</p>
                    <p>You have successfully checked in. Here are your details:</p>
                    
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <p><strong>Room:</strong> ${reservation.room_number}</p>
                        <p><strong>Check-out:</strong> ${reservation.check_out_date}</p>
                        <p><strong>Reservation:</strong> ${reservation.reservation_number}</p>
                    </div>
                    
                    <p>Enjoy your stay with us!</p>
                    <p style="color: #6b7280; font-size: 12px;">24/7 Reception available for any assistance.</p>
                </div>
                <div style="text-align: center; padding: 10px; color: #6b7280; font-size: 12px;">
                    © ${new Date().getFullYear()} ${hotelName}. All rights reserved.
                </div>
            </div>
        `;
    },

    // 3. Check-out Confirmation
    checkOutConfirmation: (guestName, invoice, hotelName = 'Hotel Management System') => {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
                <div style="text-align: center; padding: 20px; background: #1e3a8a; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">🏨 ${hotelName}</h1>
                </div>
                <div style="padding: 20px; background: white; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #1e3a8a;">Thank You for Staying With Us!</h2>
                    <p>Dear <strong>${guestName}</strong>,</p>
                    <p>Thank you for choosing us. We hope you enjoyed your stay!</p>
                    
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
                        <p><strong>Total Amount:</strong> $${invoice.total}</p>
                        <p><strong>Paid:</strong> $${invoice.paid_amount || 0}</p>
                        <p><strong>Balance:</strong> $${invoice.balance || 0}</p>
                    </div>
                    
                    <p>We look forward to serving you again!</p>
                </div>
                <div style="text-align: center; padding: 10px; color: #6b7280; font-size: 12px;">
                    © ${new Date().getFullYear()} ${hotelName}. All rights reserved.
                </div>
            </div>
        `;
    },

    // 4. Invoice Email
    invoiceEmail: (guestName, invoice, hotelName = 'Hotel Management System') => {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
                <div style="text-align: center; padding: 20px; background: #1e3a8a; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">🏨 ${hotelName}</h1>
                </div>
                <div style="padding: 20px; background: white; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #1e3a8a;">Invoice #${invoice.invoice_number}</h2>
                    <p>Dear <strong>${guestName}</strong>,</p>
                    <p>Please find your invoice below:</p>
                    
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
                        <p><strong>Date:</strong> ${invoice.invoice_date}</p>
                        <p><strong>Due Date:</strong> ${invoice.due_date || 'N/A'}</p>
                        <p><strong>Total:</strong> $${invoice.total}</p>
                        <p><strong>Status:</strong> ${invoice.status}</p>
                    </div>
                    
                    <p>Thank you for your business!</p>
                </div>
                <div style="text-align: center; padding: 10px; color: #6b7280; font-size: 12px;">
                    © ${new Date().getFullYear()} ${hotelName}. All rights reserved.
                </div>
            </div>
        `;
    },

    // 5. Password Reset
    passwordReset: (email, resetToken, hotelName = 'Hotel Management System') => {
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
                <div style="text-align: center; padding: 20px; background: #dc2626; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">🔐 ${hotelName}</h1>
                </div>
                <div style="padding: 20px; background: white; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #dc2626;">Password Reset Request</h2>
                    <p>You requested a password reset. Click the link below:</p>
                    
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${resetLink}" style="background: #dc2626; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    
                    <p>Or copy this link: <br> <span style="color: #1e3a8a; word-break: break-all;">${resetLink}</span></p>
                    
                    <p style="color: #6b7280; font-size: 12px;">This link expires in 24 hours.</p>
                </div>
                <div style="text-align: center; padding: 10px; color: #6b7280; font-size: 12px;">
                    © ${new Date().getFullYear()} ${hotelName}. All rights reserved.
                </div>
            </div>
        `;
    },

    // 6. Welcome Email
    welcomeEmail: (name, email, password, hotelName = 'Hotel Management System') => {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
                <div style="text-align: center; padding: 20px; background: #059669; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">🏨 ${hotelName}</h1>
                </div>
                <div style="padding: 20px; background: white; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #059669;">Welcome ${name}! 🎉</h2>
                    <p>Your account has been created successfully.</p>
                    
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Password:</strong> ${password}</p>
                    </div>
                    
                    <p style="color: #dc2626; font-size: 12px;">Please change your password after first login.</p>
                    <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="background: #059669; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; display: inline-block;">Login Now</a></p>
                </div>
                <div style="text-align: center; padding: 10px; color: #6b7280; font-size: 12px;">
                    © ${new Date().getFullYear()} ${hotelName}. All rights reserved.
                </div>
            </div>
        `;
    }
};

// ============================================
// SPECIFIC EMAIL FUNCTIONS - ✅ ALL EXPORTED
// ============================================
const sendReservationConfirmation = async (email, guestName, reservation) => {
    const html = templates.reservationConfirmation(guestName, reservation);
    return sendEmail(email, 'Reservation Confirmed', html);
};

const sendCheckInEmail = async (email, guestName, reservation) => {
    const html = templates.checkInConfirmation(guestName, reservation);
    return sendEmail(email, 'Welcome - Checked In', html);
};

const sendCheckOutEmail = async (email, guestName, invoice) => {
    const html = templates.checkOutConfirmation(guestName, invoice);
    return sendEmail(email, 'Thank You for Staying With Us', html);
};

const sendInvoiceEmail = async (email, guestName, invoice) => {
    const html = templates.invoiceEmail(guestName, invoice);
    return sendEmail(email, `Invoice #${invoice.invoice_number}`, html);
};

const sendPasswordReset = async (email, resetToken) => {
    const html = templates.passwordReset(email, resetToken);
    return sendEmail(email, 'Password Reset Request', html);
};

const sendWelcomeEmail = async (email, name, password) => {
    const html = templates.welcomeEmail(name, email, password);
    return sendEmail(email, 'Welcome to the Hotel Management System', html);
};

// ============================================
// ✅ EXPORT ALL FUNCTIONS
// ============================================
module.exports = {
    sendEmail,
    sendReservationConfirmation,
    sendCheckInEmail,
    sendCheckOutEmail,
    sendInvoiceEmail,
    sendPasswordReset,
    sendWelcomeEmail,
    templates
};