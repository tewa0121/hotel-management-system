const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { initializeDatabase } = require('./config/initDatabase');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const guestRoutes = require('./routes/guestRoutes');
const roomRoutes = require('./routes/roomRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const housekeepingRoutes = require('./routes/housekeepingRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const reportRoutes = require('./routes/reportRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const emailRoutes = require('./routes/emailRoutes');
const guestAuthRoutes = require('./routes/guestAuthRoutes');
const foodRoutes = require('./routes/foodRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// ============================================
// Security middleware
// ============================================
app.use(helmet({
    // The API is called from the React app on another origin
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

// Limit brute-force attempts on both login endpoints
// (relaxed in development so testing is not annoying)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: isProduction ? 10 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many login attempts. Please try again in 15 minutes.'
    }
});
app.use('/api/auth/login', loginLimiter);
app.use('/api/guest/login', loginLimiter);

// ============================================
// Body parsing
// ============================================
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================
// Database
// ============================================
initializeDatabase().then(success => {
    if (!success) {
        console.warn('⚠️ Database initialization had issues, but server will continue...');
    }
});

// ============================================
// Health check
// ============================================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Hotel Management System API is running',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// Routes
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/housekeeping', housekeepingRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/guest', guestAuthRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler (must come before the error handler)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;