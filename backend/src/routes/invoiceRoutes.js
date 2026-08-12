const express = require('express');
const { pool } = require('../config/db');
const { verifyToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Generate invoice number
const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `INV-${year}${month}${day}-${random}`;
};

// Get all invoices
router.get('/', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status || '';

    let query = `
      SELECT i.*, 
             g.first_name, g.last_name, g.email,
             r.reservation_number,
             rm.room_number
      FROM invoices i
      LEFT JOIN guests g ON i.guest_id = g.id
      LEFT JOIN reservations r ON i.reservation_id = r.id
      LEFT JOIN rooms rm ON r.room_id = rm.id
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM invoices WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND i.status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [invoices] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, params.slice(0, params.length - 2));

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoices'
    });
  }
});

// Get invoice by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [invoices] = await pool.execute(`
      SELECT i.*, 
             g.first_name, g.last_name, g.email, g.phone, g.address,
             r.reservation_number, r.check_in_date, r.check_out_date,
             rm.room_number, rt.name as room_type_name
      FROM invoices i
      LEFT JOIN guests g ON i.guest_id = g.id
      LEFT JOIN reservations r ON i.reservation_id = r.id
      LEFT JOIN rooms rm ON r.room_id = rm.id
      LEFT JOIN room_types rt ON rm.room_type_id = rt.id
      WHERE i.id = ?
    `, [req.params.id]);

    if (invoices.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoices[0]
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice'
    });
  }
});

// Get invoice by reservation
router.get('/reservation/:reservationId', verifyToken, async (req, res) => {
  try {
    const [invoices] = await pool.execute(`
      SELECT i.*, 
             g.first_name, g.last_name, g.email,
             r.reservation_number
      FROM invoices i
      LEFT JOIN guests g ON i.guest_id = g.id
      LEFT JOIN reservations r ON i.reservation_id = r.id
      WHERE i.reservation_id = ?
      ORDER BY i.created_at DESC
    `, [req.params.reservationId]);

    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Error fetching reservation invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reservation invoices'
    });
  }
});

// Create invoice
router.post('/', verifyToken, authorize('admin', 'manager', 'receptionist', 'accountant'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      reservation_id,
      invoice_date,
      due_date,
      subtotal,
      tax,
      discount,
      total,
      notes
    } = req.body;

    if (!reservation_id) {
      return res.status(400).json({
        success: false,
        message: 'Reservation ID is required'
      });
    }

    // Get reservation details
    const [reservation] = await connection.execute(
      'SELECT guest_id, total_amount FROM reservations WHERE id = ?',
      [reservation_id]
    );

    if (reservation.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    const invoice_number = generateInvoiceNumber();

    const [result] = await connection.execute(
      `INSERT INTO invoices (
        invoice_number, reservation_id, guest_id, invoice_date, due_date,
        subtotal, tax, discount, total, status, created_by, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoice_number,
        reservation_id,
        reservation[0].guest_id,
        invoice_date || new Date().toISOString().split('T')[0],
        due_date || null,
        subtotal || reservation[0].total_amount || 0,
        tax || 0,
        discount || 0,
        total || reservation[0].total_amount || 0,
        'draft',
        req.user.id,
        notes || null
      ]
    );

    await connection.commit();

    const [newInvoice] = await connection.execute(`
      SELECT i.*, 
             g.first_name, g.last_name,
             r.reservation_number
      FROM invoices i
      LEFT JOIN guests g ON i.guest_id = g.id
      LEFT JOIN reservations r ON i.reservation_id = r.id
      WHERE i.id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: newInvoice[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating invoice'
    });
  } finally {
    connection.release();
  }
});

// Update invoice
router.put('/:id', verifyToken, authorize('admin', 'manager', 'accountant'), async (req, res) => {
  try {
    const {
      invoice_date,
      due_date,
      subtotal,
      tax,
      discount,
      total,
      status,
      notes
    } = req.body;

    const [result] = await pool.execute(
      `UPDATE invoices SET
        invoice_date = ?,
        due_date = ?,
        subtotal = ?,
        tax = ?,
        discount = ?,
        total = ?,
        status = ?,
        notes = ?
      WHERE id = ?`,
      [
        invoice_date, due_date, subtotal, tax,
        discount, total, status, notes, req.params.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    const [updatedInvoice] = await pool.execute(`
      SELECT i.*, 
             g.first_name, g.last_name,
             r.reservation_number
      FROM invoices i
      LEFT JOIN guests g ON i.guest_id = g.id
      LEFT JOIN reservations r ON i.reservation_id = r.id
      WHERE i.id = ?
    `, [req.params.id]);

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: updatedInvoice[0]
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating invoice'
    });
  }
});

// Download invoice (PDF placeholder)
router.get('/:id/download', verifyToken, async (req, res) => {
  try {
    const [invoice] = await pool.execute(`
      SELECT i.*, 
             g.first_name, g.last_name, g.email, g.phone, g.address,
             r.reservation_number, r.check_in_date, r.check_out_date,
             rm.room_number, rt.name as room_type_name
      FROM invoices i
      LEFT JOIN guests g ON i.guest_id = g.id
      LEFT JOIN reservations r ON i.reservation_id = r.id
      LEFT JOIN rooms rm ON r.room_id = rm.id
      LEFT JOIN room_types rt ON rm.room_type_id = rt.id
      WHERE i.id = ?
    `, [req.params.id]);

    if (invoice.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // For now, return JSON instead of PDF
    // In production, you would generate a PDF here
    res.json({
      success: true,
      message: 'PDF download would be generated here',
      data: invoice[0]
    });
  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading invoice'
    });
  }
});

// Send invoice email
router.post('/:id/send', verifyToken, authorize('admin', 'manager', 'receptionist', 'accountant'), async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    const [invoice] = await pool.execute(`
      SELECT i.*, 
             g.first_name, g.last_name, g.email as guest_email
      FROM invoices i
      LEFT JOIN guests g ON i.guest_id = g.id
      WHERE i.id = ?
    `, [req.params.id]);

    if (invoice.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Update invoice status to 'sent'
    await pool.execute(
      'UPDATE invoices SET status = ? WHERE id = ?',
      ['sent', req.params.id]
    );

    // In production, you would send an actual email here
    res.json({
      success: true,
      message: `Invoice sent to ${email}`,
      data: {
        to: email,
        invoice_number: invoice[0].invoice_number
      }
    });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending invoice email'
    });
  }
});

// Print invoice (HTML placeholder)
router.get('/:id/print', verifyToken, async (req, res) => {
  try {
    const [invoice] = await pool.execute(`
      SELECT i.*, 
             g.first_name, g.last_name, g.email, g.phone, g.address,
             r.reservation_number, r.check_in_date, r.check_out_date,
             rm.room_number, rt.name as room_type_name
      FROM invoices i
      LEFT JOIN guests g ON i.guest_id = g.id
      LEFT JOIN reservations r ON i.reservation_id = r.id
      LEFT JOIN rooms rm ON r.room_id = rm.id
      LEFT JOIN room_types rt ON rm.room_type_id = rt.id
      WHERE i.id = ?
    `, [req.params.id]);

    if (invoice.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // For now, return JSON
    res.json({
      success: true,
      message: 'Print view would be generated here',
      data: invoice[0]
    });
  } catch (error) {
    console.error('Error printing invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error printing invoice'
    });
  }
});

module.exports = router;