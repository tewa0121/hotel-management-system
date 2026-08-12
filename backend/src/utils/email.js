// ============================================
// EMAIL UTILITIES
// ============================================

// Note: This is a placeholder for email functionality
// You can integrate with services like Nodemailer, SendGrid, etc.

// Send email
const sendEmail = async (to, subject, html, text = '') => {
  try {
    // TODO: Implement actual email sending
    // Example with Nodemailer:
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({ to, subject, html, text });
    
    console.log(`📧 Email would be sent to: ${to}`);
    console.log(`📝 Subject: ${subject}`);
    console.log(`📄 Content: ${text || html}`);

    return {
      success: true,
      message: 'Email sent successfully',
      to,
      subject
    };
  } catch (error) {
    console.error('Email error:', error);
    return {
      success: false,
      message: 'Failed to send email',
      error: error.message
    };
  }
};

// Send welcome email to new user
const sendWelcomeEmail = async (email, name, password) => {
  const subject = 'Welcome to Hotel Management System';
  const html = `
    <h1>Welcome ${name}!</h1>
    <p>Your account has been created successfully.</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Password:</strong> ${password}</p>
    <p>Please change your password after first login.</p>
    <p>Thank you,<br>Hotel Management Team</p>
  `;
  const text = `Welcome ${name}!\nYour account has been created.\nEmail: ${email}\nPassword: ${password}\nPlease change your password after first login.\nThank you,\nHotel Management Team`;
  return sendEmail(email, subject, html, text);
};

// Send reservation confirmation
const sendReservationConfirmation = async (email, guestName, reservation) => {
  const subject = `Reservation Confirmation - ${reservation.reservation_number}`;
  const html = `
    <h1>Reservation Confirmation</h1>
    <p>Dear ${guestName},</p>
    <p>Your reservation has been confirmed.</p>
    <p><strong>Reservation Number:</strong> ${reservation.reservation_number}</p>
    <p><strong>Check-in:</strong> ${reservation.check_in_date}</p>
    <p><strong>Check-out:</strong> ${reservation.check_out_date}</p>
    <p><strong>Room:</strong> ${reservation.room_number}</p>
    <p><strong>Total Amount:</strong> $${reservation.total_amount}</p>
    <p>Thank you for choosing us!</p>
    <p>Hotel Management Team</p>
  `;
  const text = `Reservation Confirmation\n\nReservation Number: ${reservation.reservation_number}\nCheck-in: ${reservation.check_in_date}\nCheck-out: ${reservation.check_out_date}\nRoom: ${reservation.room_number}\nTotal: $${reservation.total_amount}\n\nThank you for choosing us!`;
  return sendEmail(email, subject, html, text);
};

// Send invoice
const sendInvoiceEmail = async (email, guestName, invoice) => {
  const subject = `Invoice - ${invoice.invoice_number}`;
  const html = `
    <h1>Invoice</h1>
    <p>Dear ${guestName},</p>
    <p>Please find your invoice below:</p>
    <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
    <p><strong>Date:</strong> ${invoice.invoice_date}</p>
    <p><strong>Total:</strong> $${invoice.total}</p>
    <p><strong>Status:</strong> ${invoice.status}</p>
    <p>Thank you for your stay!</p>
    <p>Hotel Management Team</p>
  `;
  const text = `Invoice\n\nInvoice Number: ${invoice.invoice_number}\nDate: ${invoice.invoice_date}\nTotal: $${invoice.total}\nStatus: ${invoice.status}\n\nThank you for your stay!`;
  return sendEmail(email, subject, html, text);
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
  const subject = 'Password Reset Request';
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const html = `
    <h1>Password Reset</h1>
    <p>You requested a password reset.</p>
    <p>Click the link below to reset your password:</p>
    <a href="${resetLink}">${resetLink}</a>
    <p>This link expires in 24 hours.</p>
    <p>If you didn't request this, please ignore this email.</p>
    <p>Hotel Management Team</p>
  `;
  const text = `Password Reset\n\nClick the link to reset your password: ${resetLink}\nThis link expires in 24 hours.\nIf you didn't request this, please ignore this email.`;
  return sendEmail(email, subject, html, text);
};

// Send notification
const sendNotification = async (email, subject, message) => {
  const html = `
    <h1>Notification</h1>
    <p>${message}</p>
    <p>Hotel Management Team</p>
  `;
  return sendEmail(email, subject, html, message);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendReservationConfirmation,
  sendInvoiceEmail,
  sendPasswordResetEmail,
  sendNotification
};