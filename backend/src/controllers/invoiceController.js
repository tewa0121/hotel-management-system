const Invoice = require('../models/Invoice');
const Reservation = require('../models/Reservation');
const { logActivity } = require('../middleware/auth');

// ============================================
// 1. GET ALL INVOICES (with pagination & filter)
// ============================================
const getInvoices = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status || '';

        const result = await Invoice.findAll(page, limit, status);

        res.json({
            success: true,
            data: result.data,
            pagination: {
                page,
                limit,
                total: result.total,
                totalPages: Math.ceil(result.total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching invoices'
        });
    }
};

// ============================================
// 2. GET SINGLE INVOICE BY ID
// ============================================
const getInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }
        res.json({
            success: true,
            data: invoice
        });
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching invoice'
        });
    }
};

// ============================================
// 3. GET INVOICES BY RESERVATION
// ============================================
const getInvoiceByReservation = async (req, res) => {
    try {
        const invoices = await Invoice.findByReservation(req.params.reservationId);
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
};

// ============================================
// 4. CREATE INVOICE
// ============================================
const createInvoice = async (req, res) => {
    try {
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

        const reservation = await Reservation.findById(reservation_id);
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        const invoice_number = await Invoice.generateInvoiceNumber();

        const invoiceData = {
            invoice_number,
            reservation_id,
            guest_id: reservation.guest_id,
            invoice_date: invoice_date || new Date().toISOString().split('T')[0],
            due_date: due_date || null,
            subtotal: subtotal || reservation.total_amount || 0,
            tax: tax || 0,
            discount: discount || 0,
            total: total || reservation.total_amount || 0,
            created_by: req.user.id,
            notes: notes || null
        };

        const invoice = await Invoice.create(invoiceData);

        await logActivity(
            req.user.id,
            'CREATE',
            'invoice',
            invoice.id,
            null,
            invoice,
            req.ip
        );

        res.status(201).json({
            success: true,
            message: 'Invoice created successfully',
            data: invoice
        });
    } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating invoice'
        });
    }
};

// ============================================
// 5. UPDATE INVOICE
// ============================================
const updateInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        const updated = await Invoice.update(req.params.id, req.body);

        await logActivity(
            req.user.id,
            'UPDATE',
            'invoice',
            updated.id,
            invoice,
            updated,
            req.ip
        );

        res.json({
            success: true,
            message: 'Invoice updated successfully',
            data: updated
        });
    } catch (error) {
        console.error('Error updating invoice:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating invoice'
        });
    }
};

// ============================================
// 6. DOWNLOAD INVOICE (PDF placeholder)
// ============================================
const downloadInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        // For now, return JSON
        // In production, generate PDF here
        res.json({
            success: true,
            message: 'PDF download would be generated here',
            data: invoice
        });
    } catch (error) {
        console.error('Error downloading invoice:', error);
        res.status(500).json({
            success: false,
            message: 'Error downloading invoice'
        });
    }
};

// ============================================
// 7. SEND INVOICE EMAIL
// ============================================
const sendInvoiceEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email address is required'
            });
        }

        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        // Update invoice status
        await Invoice.updateStatus(req.params.id, 'sent');

        await logActivity(
            req.user.id,
            'SEND_EMAIL',
            'invoice',
            req.params.id,
            { status: invoice.status },
            { status: 'sent' },
            req.ip
        );

        res.json({
            success: true,
            message: `Invoice sent to ${email}`,
            data: {
                to: email,
                invoice_number: invoice.invoice_number
            }
        });
    } catch (error) {
        console.error('Error sending invoice email:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending invoice email'
        });
    }
};

// ============================================
// 8. PRINT INVOICE (placeholder)
// ============================================
const printInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        res.json({
            success: true,
            message: 'Print view would be generated here',
            data: invoice
        });
    } catch (error) {
        console.error('Error printing invoice:', error);
        res.status(500).json({
            success: false,
            message: 'Error printing invoice'
        });
    }
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================
module.exports = {
    getInvoices,
    getInvoice,
    getInvoiceByReservation,
    createInvoice,
    updateInvoice,
    downloadInvoice,
    sendInvoiceEmail,
    printInvoice
};