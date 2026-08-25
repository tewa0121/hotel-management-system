// const express = require('express');
// const bcrypt = require('bcryptjs'); // ✅ ADDED for password hashing
// const { pool } = require('../config/db');
// const { verifyToken, authorize } = require('../middleware/auth');

// const router = express.Router();

// // ============================================
// // GET ALL GUESTS (with pagination)
// // ============================================
// router.get('/', verifyToken, async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 20;
//         const offset = (page - 1) * limit;
//         const search = req.query.search || '';

//         let query = 'SELECT * FROM guests';
//         let countQuery = 'SELECT COUNT(*) as total FROM guests';
//         const params = [];

//         if (search) {
//             query += ' WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?';
//             countQuery += ' WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?';
//             const searchTerm = `%${search}%`;
//             params.push(searchTerm, searchTerm, searchTerm, searchTerm);
//         }

//         query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
//         params.push(limit, offset);

//         const [guests] = await pool.execute(query, params);
//         const [countResult] = await pool.execute(countQuery, params.slice(0, params.length - 2));

//         res.json({
//             success: true,
//             data: guests,
//             pagination: {
//                 page,
//                 limit,
//                 total: countResult[0].total,
//                 totalPages: Math.ceil(countResult[0].total / limit)
//             }
//         });
//     } catch (error) {
//         console.error('Error fetching guests:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching guests'
//         });
//     }
// });

// // ============================================
// // GET SINGLE GUEST
// // ============================================
// router.get('/:id', verifyToken, async (req, res) => {
//     try {
//         const [guests] = await pool.execute(
//             'SELECT * FROM guests WHERE id = ?',
//             [req.params.id]
//         );

//         if (guests.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Guest not found'
//             });
//         }

//         // ✅ Remove password from response
//         delete guests[0].password;

//         res.json({
//             success: true,
//             data: guests[0]
//         });
//     } catch (error) {
//         console.error('Error fetching guest:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching guest'
//         });
//     }
// });

// // ============================================
// // CREATE GUEST – WITH PASSWORD HASHING
// // ============================================
// router.post('/', verifyToken, async (req, res) => {
//     try {
//         const {
//             first_name,
//             last_name,
//             email,
//             phone,
//             password, // ✅ NEW: accept password from frontend
//             address,
//             city,
//             country,
//             id_type,
//             id_number,
//             date_of_birth,
//             gender,
//             nationality,
//             emergency_contact_name,
//             emergency_contact_phone,
//             notes
//         } = req.body;

//         // Validate required fields
//         if (!first_name || !last_name || !phone) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'First name, last name, and phone are required'
//             });
//         }

//         // ✅ Hash password if provided
//         let hashedPassword = null;
//         if (password) {
//             hashedPassword = await bcrypt.hash(password, 10);
//         }

//         const [result] = await pool.execute(
//             `INSERT INTO guests (
//                 first_name, last_name, email, phone, address, city, country,
//                 id_type, id_number, date_of_birth, gender, nationality,
//                 emergency_contact_name, emergency_contact_phone, notes, password
//             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//             [
//                 first_name, last_name, email || null, phone, address || null,
//                 city || null, country || null, id_type || 'passport',
//                 id_number || null, date_of_birth || null, gender || 'other',
//                 nationality || null, emergency_contact_name || null,
//                 emergency_contact_phone || null, notes || null,
//                 hashedPassword // ← Store the hashed password
//             ]
//         );

//         const [newGuest] = await pool.execute(
//             'SELECT * FROM guests WHERE id = ?',
//             [result.insertId]
//         );

//         // ✅ Remove password from response
//         delete newGuest[0].password;

//         res.status(201).json({
//             success: true,
//             message: 'Guest created successfully',
//             data: newGuest[0]
//         });
//     } catch (error) {
//         console.error('Error creating guest:', error);
//         if (error.code === 'ER_DUP_ENTRY') {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Email already exists'
//             });
//         }
//         res.status(500).json({
//             success: false,
//             message: 'Error creating guest'
//         });
//     }
// });

// // ============================================
// // UPDATE GUEST – WITH OPTIONAL PASSWORD HASHING
// // ============================================
// router.put('/:id', verifyToken, async (req, res) => {
//     try {
//         const {
//             first_name,
//             last_name,
//             email,
//             phone,
//             password, // ✅ NEW: optional password update
//             address,
//             city,
//             country,
//             id_type,
//             id_number,
//             date_of_birth,
//             gender,
//             nationality,
//             emergency_contact_name,
//             emergency_contact_phone,
//             notes
//         } = req.body;

//         // Build dynamic update query
//         let updateFields = [];
//         let params = [];

//         // Helper to add field
//         const addField = (field, value) => {
//             if (value !== undefined) {
//                 updateFields.push(`${field} = ?`);
//                 params.push(value);
//             }
//         };

//         addField('first_name', first_name);
//         addField('last_name', last_name);
//         addField('email', email);
//         addField('phone', phone);
//         addField('address', address);
//         addField('city', city);
//         addField('country', country);
//         addField('id_type', id_type);
//         addField('id_number', id_number);
//         addField('date_of_birth', date_of_birth);
//         addField('gender', gender);
//         addField('nationality', nationality);
//         addField('emergency_contact_name', emergency_contact_name);
//         addField('emergency_contact_phone', emergency_contact_phone);
//         addField('notes', notes);

//         // ✅ Hash password only if provided
//         if (password) {
//             const hashedPassword = await bcrypt.hash(password, 10);
//             updateFields.push('password = ?');
//             params.push(hashedPassword);
//         }

//         if (updateFields.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'No fields to update'
//             });
//         }

//         params.push(req.params.id);
//         const query = `UPDATE guests SET ${updateFields.join(', ')} WHERE id = ?`;

//         const [result] = await pool.execute(query, params);

//         if (result.affectedRows === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Guest not found'
//             });
//         }

//         const [updatedGuest] = await pool.execute(
//             'SELECT * FROM guests WHERE id = ?',
//             [req.params.id]
//         );

//         // ✅ Remove password from response
//         delete updatedGuest[0].password;

//         res.json({
//             success: true,
//             message: 'Guest updated successfully',
//             data: updatedGuest[0]
//         });
//     } catch (error) {
//         console.error('Error updating guest:', error);
//         if (error.code === 'ER_DUP_ENTRY') {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Email already exists'
//             });
//         }
//         res.status(500).json({
//             success: false,
//             message: 'Error updating guest'
//         });
//     }
// });

// // ============================================
// // DELETE GUEST
// // ============================================
// router.delete('/:id', verifyToken, authorize('admin', 'manager'), async (req, res) => {
//     try {
//         const [result] = await pool.execute(
//             'DELETE FROM guests WHERE id = ?',
//             [req.params.id]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Guest not found'
//             });
//         }

//         res.json({
//             success: true,
//             message: 'Guest deleted successfully'
//         });
//     } catch (error) {
//         console.error('Error deleting guest:', error);
//         if (error.code === 'ER_ROW_IS_REFERENCED') {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Cannot delete guest with existing reservations'
//             });
//         }
//         res.status(500).json({
//             success: false,
//             message: 'Error deleting guest'
//         });
//     }
// });

// module.exports = router;