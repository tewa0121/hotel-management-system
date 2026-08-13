const { pool } = require('../config/database');

class Invoice {
    static async findAll(page = 1, limit = 20, status = '') {
        const offset = (page - 1) * limit;
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

        const [rows] = await pool.execute(query, params);
        const [count] = await pool.execute(countQuery, params.slice(0, params.length - 2));

        return {
            data: rows,
            total: count[0].total
        };
    }

    static async findById(id) {
        const [rows] = await pool.execute(`
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
        `, [id]);
        return rows[0];
    }

    static async findByReservation(reservationId) {
        const [rows] = await pool.execute(`
            SELECT i.*, 
                   g.first_name, g.last_name, g.email,
                   r.reservation_number
            FROM invoices i
            LEFT JOIN guests g ON i.guest_id = g.id
            LEFT JOIN reservations r ON i.reservation_id = r.id
            WHERE i.reservation_id = ?
            ORDER BY i.created_at DESC
        `, [reservationId]);
        return rows;
    }

    static async findByInvoiceNumber(number) {
        const [rows] = await pool.execute(
            'SELECT * FROM invoices WHERE invoice_number = ?',
            [number]
        );
        return rows[0];
    }

    static async create(data) {
        const {
            invoice_number, reservation_id, guest_id, invoice_date,
            due_date, subtotal, tax, discount, total,
            status, created_by, notes
        } = data;

        const [result] = await pool.execute(
            `INSERT INTO invoices (
                invoice_number, reservation_id, guest_id, invoice_date,
                due_date, subtotal, tax, discount, total,
                status, created_by, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                invoice_number, reservation_id, guest_id,
                invoice_date || new Date().toISOString().split('T')[0],
                due_date || null, subtotal, tax || 0,
                discount || 0, total, status || 'draft',
                created_by, notes || null
            ]
        );
        return this.findById(result.insertId);
    }

    static async update(id, data) {
        const {
            invoice_date, due_date, subtotal, tax,
            discount, total, status, notes
        } = data;

        await pool.execute(
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
                invoice_date, due_date, subtotal,
                tax, discount, total, status,
                notes, id
            ]
        );
        return this.findById(id);
    }

    static async updateStatus(id, status) {
        await pool.execute(
            'UPDATE invoices SET status = ? WHERE id = ?',
            [status, id]
        );
    }

    static async updatePayment(id, amount) {
        const [invoice] = await pool.execute(
            'SELECT paid_amount, total FROM invoices WHERE id = ?',
            [id]
        );

        if (invoice.length === 0) return null;

        const newPaid = (invoice[0].paid_amount || 0) + amount;
        const newStatus = newPaid >= invoice[0].total ? 'paid' : 'sent';

        await pool.execute(
            'UPDATE invoices SET paid_amount = ?, status = ? WHERE id = ?',
            [newPaid, newStatus, id]
        );
        return this.findById(id);
    }

    static async delete(id) {
        const [result] = await pool.execute('DELETE FROM invoices WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async getSummaryByStatus() {
        const [rows] = await pool.execute(`
            SELECT status, COUNT(*) as count, SUM(total) as total
            FROM invoices
            GROUP BY status
        `);
        return rows;
    }

    static async getTotalPaid() {
        const [rows] = await pool.execute(
            'SELECT SUM(paid_amount) as total FROM invoices WHERE status = "paid"'
        );
        return rows[0].total || 0;
    }

    static async getTotalOutstanding() {
        const [rows] = await pool.execute(
            'SELECT SUM(total - paid_amount) as total FROM invoices WHERE status IN ("sent", "overdue")'
        );
        return rows[0].total || 0;
    }

    static async generateInvoiceNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        // Get last invoice number
        const [rows] = await pool.execute(
            "SELECT invoice_number FROM invoices ORDER BY id DESC LIMIT 1"
        );
        
        let sequence = 1;
        if (rows.length > 0) {
            const lastNumber = rows[0].invoice_number;
            const lastSeq = parseInt(lastNumber.split('-')[3]);
            if (!isNaN(lastSeq)) {
                sequence = lastSeq + 1;
            }
        }
        
        return `INV-${year}${month}${day}-${String(sequence).padStart(4, '0')}`;
    }
}

module.exports = Invoice;