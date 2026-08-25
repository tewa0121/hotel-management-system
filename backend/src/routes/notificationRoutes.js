// const express = require('express');
// const { pool } = require('../config/db');
// const { verifyToken } = require('../middleware/auth');
// const router = express.Router();

// // GET all notifications for current user
// router.get('/', verifyToken, async (req, res) => {
//     try {
//         const [notifications] = await pool.execute(
//             `SELECT * FROM notifications 
//              WHERE user_id = ? 
//              ORDER BY created_at DESC 
//              LIMIT 50`,
//             [req.user.id]
//         );
//         const [unread] = await pool.execute(
//             `SELECT COUNT(*) as count FROM notifications 
//              WHERE user_id = ? AND is_read = FALSE`,
//             [req.user.id]
//         );
//         res.json({
//             success: true,
//             data: notifications,
//             unreadCount: unread[0].count
//         });
//     } catch (error) {
//         console.error('Error fetching notifications:', error);
//         res.status(500).json({ success: false, message: 'Error fetching notifications' });
//     }
// });

// // Mark notification as read
// router.put('/:id/read', verifyToken, async (req, res) => {
//     try {
//         await pool.execute(
//             'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
//             [req.params.id, req.user.id]
//         );
//         res.json({ success: true, message: 'Marked as read' });
//     } catch (error) {
//         console.error('Error marking as read:', error);
//         res.status(500).json({ success: false, message: 'Error updating notification' });
//     }
// });

// // Mark all as read
// router.put('/read-all', verifyToken, async (req, res) => {
//     try {
//         await pool.execute(
//             'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
//             [req.user.id]
//         );
//         res.json({ success: true, message: 'All marked as read' });
//     } catch (error) {
//         console.error('Error marking all as read:', error);
//         res.status(500).json({ success: false, message: 'Error marking all as read' });
//     }
// });

// // Create notification (helper function used by other routes)
// const createNotification = async (userId, message, type, link = null) => {
//     try {
//         await pool.execute(
//             `INSERT INTO notifications (user_id, message, type, link) VALUES (?, ?, ?, ?)`,
//             [userId, message, type, link]
//         );
//     } catch (error) {
//         console.error('Error creating notification:', error);
//     }
// };

// module.exports = router;
// module.exports.createNotification = createNotification;