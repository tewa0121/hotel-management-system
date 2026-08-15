const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// ============================================
// VERIFY TOKEN – Supports Staff & Guests
// ============================================
const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        console.log('🔍 Verifying token:', token.substring(0, 20) + '...');

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token decoded:', decoded);

        // ✅ Check if it's a guest token (has 'id' and role 'guest')
        if (decoded.role === 'guest' || decoded.id) {
            // Guest token – removed 'is_active' because it doesn't exist
            const [guests] = await pool.execute(
                'SELECT id, first_name, last_name, email, phone, total_stays, total_spent FROM guests WHERE id = ?',
                [decoded.id || decoded.guestId]
            );

            if (guests.length === 0) {
                console.log('❌ Guest not found for ID:', decoded.id);
                return res.status(401).json({
                    success: false,
                    message: 'Guest not found'
                });
            }

            // Attach guest to req.user with role
            req.user = {
                ...guests[0],
                role: 'guest',
                name: `${guests[0].first_name} ${guests[0].last_name}`
            };
            console.log('✅ Guest authenticated:', req.user.email);
            return next();
        }

        // ✅ Staff token (has 'userId')
        if (decoded.userId) {
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
            console.log('✅ Staff authenticated:', req.user.email);
            return next();
        }

        // If neither, reject
        return res.status(401).json({
            success: false,
            message: 'Invalid token payload'
        });

    } catch (error) {
        console.error('❌ Token verification failed:', error.message);
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

// ============================================
// AUTHORIZE – Staff roles only
// ============================================
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        
        // Guests cannot access staff routes
        if (req.user.role === 'guest') {
            return res.status(403).json({
                success: false,
                message: 'Guests are not authorized for this action'
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

// ============================================
// LOG ACTIVITY
// ============================================
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