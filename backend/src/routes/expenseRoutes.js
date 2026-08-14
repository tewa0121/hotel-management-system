// const express = require('express');
// const { pool } = require('../config/database');
// const { verifyToken, authorize } = require('../middleware/auth');

// const router = express.Router();

// // ============================================
// // GET all expenses
// // ============================================
// router.get('/', verifyToken, async (req, res) => {
//     try {
//         const [expenses] = await pool.execute(`
//             SELECT e.*, u.name as created_by_name
//             FROM expenses e
//             LEFT JOIN users u ON e.created_by = u.id
//             ORDER BY e.expense_date DESC, e.created_at DESC
//         `);

//         res.json({
//             success: true,
//             data: expenses
//         });
//     } catch (error) {
//         console.error('Error fetching expenses:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching expenses'
//         });
//     }
// });

// // ============================================
// // GET single expense
// // ============================================
// router.get('/:id', verifyToken, async (req, res) => {
//     try {
//         const [expenses] = await pool.execute(`
//             SELECT e.*, u.name as created_by_name
//             FROM expenses e
//             LEFT JOIN users u ON e.created_by = u.id
//             WHERE e.id = ?
//         `, [req.params.id]);

//         if (expenses.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Expense not found'
//             });
//         }

//         res.json({
//             success: true,
//             data: expenses[0]
//         });
//     } catch (error) {
//         console.error('Error fetching expense:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching expense'
//         });
//     }
// });

// // ============================================
// // POST create expense
// // ============================================
// router.post('/', verifyToken, async (req, res) => {
//     try {
//         console.log('📤 Creating expense:', req.body);

//         const {
//             category,
//             description,
//             amount,
//             expense_date,
//             payment_method,
//             vendor,
//             notes
//         } = req.body;

//         // Validate
//         if (!category || !description || !amount) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Category, description, and amount are required'
//             });
//         }

//         const [result] = await pool.execute(
//             `INSERT INTO expenses (
//                 category, description, amount, expense_date,
//                 payment_method, vendor, notes, created_by
//             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//             [
//                 category,
//                 description,
//                 amount,
//                 expense_date || new Date().toISOString().split('T')[0],
//                 payment_method || 'cash',
//                 vendor || null,
//                 notes || null,
//                 req.user.id
//             ]
//         );

//         const [newExpense] = await pool.execute(`
//             SELECT e.*, u.name as created_by_name
//             FROM expenses e
//             LEFT JOIN users u ON e.created_by = u.id
//             WHERE e.id = ?
//         `, [result.insertId]);

//         console.log('✅ Expense created:', newExpense[0]);

//         res.status(201).json({
//             success: true,
//             message: 'Expense created successfully',
//             data: newExpense[0]
//         });
//     } catch (error) {
//         console.error('❌ Error creating expense:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error creating expense'
//         });
//     }
// });

// // ============================================
// // PUT update expense
// // ============================================
// router.put('/:id', verifyToken, async (req, res) => {
//     try {
//         const {
//             category,
//             description,
//             amount,
//             expense_date,
//             payment_method,
//             vendor,
//             notes
//         } = req.body;

//         const [result] = await pool.execute(
//             `UPDATE expenses SET
//                 category = ?,
//                 description = ?,
//                 amount = ?,
//                 expense_date = ?,
//                 payment_method = ?,
//                 vendor = ?,
//                 notes = ?
//             WHERE id = ?`,
//             [
//                 category, description, amount,
//                 expense_date, payment_method,
//                 vendor, notes, req.params.id
//             ]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Expense not found'
//             });
//         }

//         const [updatedExpense] = await pool.execute(`
//             SELECT e.*, u.name as created_by_name
//             FROM expenses e
//             LEFT JOIN users u ON e.created_by = u.id
//             WHERE e.id = ?
//         `, [req.params.id]);

//         res.json({
//             success: true,
//             message: 'Expense updated successfully',
//             data: updatedExpense[0]
//         });
//     } catch (error) {
//         console.error('Error updating expense:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error updating expense'
//         });
//     }
// });

// // ============================================
// // DELETE expense
// // ============================================
// router.delete('/:id', verifyToken, authorize('admin', 'manager'), async (req, res) => {
//     try {
//         const [result] = await pool.execute(
//             'DELETE FROM expenses WHERE id = ?',
//             [req.params.id]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Expense not found'
//             });
//         }

//         res.json({
//             success: true,
//             message: 'Expense deleted successfully'
//         });
//     } catch (error) {
//         console.error('Error deleting expense:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error deleting expense'
//         });
//     }
// });

// module.exports = router;