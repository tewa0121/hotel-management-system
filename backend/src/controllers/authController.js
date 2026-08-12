// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const { logActivity } = require('../middleware/auth'); // ✅ ADDED

// // Login
// const login = async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         if (!email || !password) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Please provide email and password'
//             });
//         }

//         const user = await User.findByEmail(email);

//         if (!user || !user.is_active) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Invalid credentials'
//             });
//         }

//         const isMatch = await bcrypt.compare(password, user.password);

//         if (!isMatch) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Invalid credentials'
//             });
//         }

//         const token = jwt.sign(
//             { userId: user.id, email: user.email, role: user.role },
//             process.env.JWT_SECRET,
//             { expiresIn: process.env.JWT_EXPIRE || '30d' }
//         );

//         // ✅ ADD THIS - Log login activity
//         await logActivity(
//             user.id,
//             'LOGIN',
//             'user',
//             user.id,
//             null,
//             null,
//             req.ip
//         );

//         res.json({
//             success: true,
//             token,
//             user: {
//                 id: user.id,
//                 name: user.name,
//                 email: user.email,
//                 role: user.role
//             }
//         });
//     } catch (error) {
//         console.error('Login error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Server error during login'
//         });
//     }
// };

// // Get current user
// const getMe = async (req, res) => {
//     try {
//         res.json({
//             success: true,
//             user: req.user
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching user data'
//         });
//     }
// };

// // Logout
// const logout = async (req, res) => {
//     // ✅ ADD THIS - Log logout activity
//     if (req.user) {
//         await logActivity(
//             req.user.id,
//             'LOGOUT',
//             'user',
//             req.user.id,
//             null,
//             null,
//             req.ip
//         );
//     }
    
//     res.json({
//         success: true,
//         message: 'Logged out successfully'
//     });
// };

// module.exports = {
//     login,
//     getMe,
//     logout
// };