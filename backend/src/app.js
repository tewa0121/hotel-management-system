const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initializeDatabase } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

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
const notificationRoutes = require('./routes/notificationRoutes');// ✅ ADD THIS

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
initializeDatabase().then(success => {
    if (!success) {
        console.warn('⚠️ Database initialization had issues, but server will continue...');
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Hotel Management System API is running',
        timestamp: new Date().toISOString()
    });
});

// Routes
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
// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

module.exports = app;