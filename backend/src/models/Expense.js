const { pool } = require('../config/database');

class Expense {
    static async findAll(page = 1, limit = 20, category = '', startDate = '', endDate = '') {
        const offset = (page - 1) * limit;
        let query = `
            SELECT e.*, u.name as created_by_name
            FROM expenses e
            LEFT JOIN users u ON e.created_by = u.id
            WHERE 1=1
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM expenses WHERE 1=1';
        const params = [];

        if (category) {
            query += ' AND e.category = ?';
            countQuery += ' AND category = ?';
            params.push(category);
        }

        if (startDate && endDate) {
            query += ' AND e.expense_date BETWEEN ? AND ?';
            countQuery += ' AND expense_date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        query += ' ORDER BY e.expense_date DESC LIMIT ? OFFSET ?';
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
            SELECT e.*, u.name as created_by_name
            FROM expenses e
            LEFT JOIN users u ON e.created_by = u.id
            WHERE e.id = ?
        `, [id]);
        return rows[0];
    }

    static async create(data) {
        const {
            category, description, amount, expense_date,
            payment_method, vendor, reference,
            receipt_image, created_by, notes
        } = data;

        const [result] = await pool.execute(
            `INSERT INTO expenses (
                category, description, amount, expense_date,
                payment_method, vendor, reference,
                receipt_image, created_by, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                category, description, amount,
                expense_date || new Date().toISOString().split('T')[0],
                payment_method || 'cash', vendor || null,
                reference || null, receipt_image || null,
                created_by, notes || null
            ]
        );
        return this.findById(result.insertId);
    }

    static async update(id, data) {
        const {
            category, description, amount, expense_date,
            payment_method, vendor, reference,
            receipt_image, notes
        } = data;

        await pool.execute(
            `UPDATE expenses SET
                category = ?,
                description = ?,
                amount = ?,
                expense_date = ?,
                payment_method = ?,
                vendor = ?,
                reference = ?,
                receipt_image = ?,
                notes = ?
            WHERE id = ?`,
            [
                category, description, amount,
                expense_date, payment_method,
                vendor, reference,
                receipt_image, notes, id
            ]
        );
        return this.findById(id);
    }

    static async delete(id) {
        const [result] = await pool.execute('DELETE FROM expenses WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async getSummaryByCategory(startDate = null, endDate = null) {
        let dateFilter = '';
        const params = [];

        if (startDate && endDate) {
            dateFilter = ' WHERE expense_date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        const [rows] = await pool.execute(`
            SELECT 
                category,
                COUNT(*) as count,
                SUM(amount) as total
            FROM expenses
            ${dateFilter}
            GROUP BY category
            ORDER BY total DESC
        `, params);
        return rows;
    }

    static async getMonthlySummary(year = null) {
        const yearFilter = year || new Date().getFullYear();
        const [rows] = await pool.execute(`
            SELECT 
                MONTH(expense_date) as month,
                DATE_FORMAT(expense_date, '%b') as month_name,
                SUM(amount) as total
            FROM expenses
            WHERE YEAR(expense_date) = ?
            GROUP BY MONTH(expense_date)
            ORDER BY month ASC
        `, [yearFilter]);
        return rows;
    }

    static async getTotalExpenses(startDate = null, endDate = null) {
        let dateFilter = '';
        const params = [];

        if (startDate && endDate) {
            dateFilter = ' WHERE expense_date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        const [rows] = await pool.execute(`
            SELECT 
                SUM(amount) as total,
                COUNT(*) as count
            FROM expenses
            ${dateFilter}
        `, params);
        return rows[0];
    }

    static async getExpensesByVendor(startDate = null, endDate = null) {
        let dateFilter = '';
        const params = [];

        if (startDate && endDate) {
            dateFilter = ' WHERE expense_date BETWEEN ? AND ? AND vendor IS NOT NULL';
            params.push(startDate, endDate);
        } else {
            dateFilter = ' WHERE vendor IS NOT NULL';
        }

        const [rows] = await pool.execute(`
            SELECT 
                vendor,
                COUNT(*) as count,
                SUM(amount) as total
            FROM expenses
            ${dateFilter}
            GROUP BY vendor
            ORDER BY total DESC
            LIMIT 10
        `, params);
        return rows;
    }

    static async getDailyExpenses(date = null) {
        const dateFilter = date || 'CURDATE()';
        const [rows] = await pool.execute(`
            SELECT 
                category,
                SUM(amount) as total,
                COUNT(*) as count
            FROM expenses
            WHERE DATE(expense_date) = ${dateFilter}
            GROUP BY category
        `);
        return rows;
    }
}

module.exports = Expense;