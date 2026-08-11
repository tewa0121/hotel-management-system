const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// Verify JWT token
const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user still exists
        const [users] = await pool.execute(
            'SELECT id, name, email, role, is_active FROM users WHERE id = ? AND is_active = TRUE',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
        }

        req.user = users[0];
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

// Check role permission
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }
        
        next();
    };
};

// Log user activity
const logActivity = async (userId, action, entity, entityId, previousData = null, newData = null, ipAddress = null) => {
    try {
        await pool.execute(
            'INSERT INTO audit_logs (user_id, action, entity, entity_id, previous_data, new_data, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, action, entity, entityId, previousData ? JSON.stringify(previousData) : null, newData ? JSON.stringify(newData) : null, ipAddress]
        );
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

module.exports = {
    verifyToken,
    authorize,
    logActivity
};