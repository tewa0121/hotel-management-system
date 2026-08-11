const express = require('express');
const { pool } = require('../config/db');
const { verifyToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Occupancy Report
router.get('/occupancy', verifyToken, authorize('admin', 'manager', 'accountant'), async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let dateFilter = '';
        const params = [];

        if (start_date && end_date) {
            dateFilter = ' AND r.check_in_date <= ? AND r.check_out_date >= ?';
            params.push(end_date, start_date);
        }

        // Total rooms
        const [totalRooms] = await pool.execute(
            'SELECT COUNT(*) as total FROM rooms WHERE is_active = TRUE'
        );

        // Occupied rooms (checked in)
        const [occupied] = await pool.execute(`
            SELECT COUNT(DISTINCT room_id) as occupied
            FROM reservations
            WHERE reservation_status = 'checked_in'
        `);

        // Reserved rooms
        const [reserved] = await pool.execute(`
            SELECT COUNT(DISTINCT room_id) as reserved
            FROM reservations
            WHERE reservation_status = 'confirmed'
            AND check_in_date <= CURDATE() AND check_out_date >= CURDATE()
        `);

        // Available rooms
        const total = totalRooms[0].total;
        const occupiedCount = occupied[0].occupied || 0;
        const reservedCount = reserved[0].reserved || 0;
        const available = total - occupiedCount - reservedCount;

        // Occupancy rate
        const occupancyRate = total > 0 ? Math.round((occupiedCount / total) * 100) : 0;

        res.json({
            success: true,
            data: {
                total_rooms: total,
                occupied: occupiedCount,
                reserved: reservedCount,
                available: available,
                occupancy_rate: occupancyRate
            }
        });
    } catch (error) {
        console.error('Error generating occupancy report:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating occupancy report'
        });
    }
});

// Revenue Report
router.get('/revenue', verifyToken, authorize('admin', 'manager', 'accountant'), async (req, res) => {
    try {
        const { start_date, end_date, period } = req.query;

        let dateFilter = '';
        const params = [];

        if (start_date && end_date) {
            dateFilter = ' AND DATE(created_at) BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        let groupBy = 'DATE(created_at)';
        let label = 'Daily';

        if (period === 'weekly') {
            groupBy = 'YEARWEEK(created_at)';
            label = 'Weekly';
        } else if (period === 'monthly') {
            groupBy = 'DATE_FORMAT(created_at, "%Y-%m")';
            label = 'Monthly';
        }

        // Revenue by date
        const [revenueByDate] = await pool.execute(`
            SELECT ${groupBy} as period, SUM(amount) as total
            FROM payments
            WHERE status = 'completed'
            ${dateFilter}
            GROUP BY ${groupBy}
            ORDER BY period DESC
            LIMIT 30
        `, params);

        // Total revenue
        const [totalRevenue] = await pool.execute(`
            SELECT SUM(amount) as total
            FROM payments
            WHERE status = 'completed'
            ${dateFilter}
        `, params);

        // Revenue by payment method
        const [byPaymentMethod] = await pool.execute(`
            SELECT payment_method, SUM(amount) as total
            FROM payments
            WHERE status = 'completed'
            ${dateFilter}
            GROUP BY payment_method
        `, params);

        // Revenue by room type
        const [byRoomType] = await pool.execute(`
            SELECT rt.name, SUM(p.amount) as total
            FROM payments p
            LEFT JOIN reservations r ON p.reservation_id = r.id
            LEFT JOIN rooms rm ON r.room_id = rm.id
            LEFT JOIN room_types rt ON rm.room_type_id = rt.id
            WHERE p.status = 'completed'
            ${dateFilter}
            GROUP BY rt.id
        `, params);

        res.json({
            success: true,
            data: {
                total_revenue: totalRevenue[0]?.total || 0,
                revenue_by_date: revenueByDate,
                by_payment_method: byPaymentMethod,
                by_room_type: byRoomType,
                period: label
            }
        });
    } catch (error) {
        console.error('Error generating revenue report:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating revenue report'
        });
    }
});

// Reservation Report
router.get('/reservations', verifyToken, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let dateFilter = '';
        const params = [];

        if (start_date && end_date) {
            dateFilter = ' AND created_at BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        // Reservation counts by status
        const [byStatus] = await pool.execute(`
            SELECT reservation_status, COUNT(*) as count
            FROM reservations
            WHERE 1=1 ${dateFilter}
            GROUP BY reservation_status
        `, params);

        // Total reservations
        const [total] = await pool.execute(`
            SELECT COUNT(*) as total
            FROM reservations
            WHERE 1=1 ${dateFilter}
        `, params);

        // Reservations by source
        const [bySource] = await pool.execute(`
            SELECT source, COUNT(*) as count
            FROM reservations
            WHERE 1=1 ${dateFilter}
            GROUP BY source
        `, params);

        // Monthly reservations
        const [monthly] = await pool.execute(`
            SELECT DATE_FORMAT(created_at, "%Y-%m") as month, COUNT(*) as count
            FROM reservations
            WHERE 1=1 ${dateFilter}
            GROUP BY DATE_FORMAT(created_at, "%Y-%m")
            ORDER BY month DESC
            LIMIT 12
        `, params);

        res.json({
            success: true,
            data: {
                total_reservations: total[0]?.total || 0,
                by_status: byStatus,
                by_source: bySource,
                monthly: monthly
            }
        });
    } catch (error) {
        console.error('Error generating reservation report:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating reservation report'
        });
    }
});

// Guest Report
router.get('/guests', verifyToken, authorize('admin', 'manager'), async (req, res) => {
    try {
        // Total guests
        const [total] = await pool.execute(
            'SELECT COUNT(*) as total FROM guests'
        );

        // New vs returning
        const [stays] = await pool.execute(
            'SELECT total_stays, COUNT(*) as count FROM guests GROUP BY total_stays'
        );

        // Guests by country
        const [byCountry] = await pool.execute(`
            SELECT country, COUNT(*) as count
            FROM guests
            WHERE country IS NOT NULL AND country != ''
            GROUP BY country
            ORDER BY count DESC
            LIMIT 10
        `);

        // Top spending guests
        const [topSpenders] = await pool.execute(`
            SELECT g.first_name, g.last_name, g.email, g.total_spent
            FROM guests g
            WHERE g.total_spent > 0
            ORDER BY g.total_spent DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            data: {
                total_guests: total[0]?.total || 0,
                stays_distribution: stays,
                by_country: byCountry,
                top_spenders: topSpenders
            }
        });
    } catch (error) {
        console.error('Error generating guest report:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating guest report'
        });
    }
});

// Payment Report
router.get('/payments', verifyToken, authorize('admin', 'manager', 'accountant'), async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let dateFilter = '';
        const params = [];

        if (start_date && end_date) {
            dateFilter = ' AND created_at BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        // Payments by status
        const [byStatus] = await pool.execute(`
            SELECT status, COUNT(*) as count, SUM(amount) as total
            FROM payments
            WHERE 1=1 ${dateFilter}
            GROUP BY status        `, params);

        // Daily payment summary
        const [daily] = await pool.execute(`
            SELECT DATE(created_at) as date, 
                   COUNT(*) as count,
                   SUM(amount) as total
            FROM payments
            WHERE status = 'completed'
            ${dateFilter}
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 30
        `, params);

        // Outstanding balances
        const [outstanding] = await pool.execute(`
            SELECT COUNT(*) as count, SUM(balance) as total
            FROM reservations
            WHERE reservation_status IN ('confirmed', 'checked_in')
            AND balance > 0
        `);

        res.json({
            success: true,
            data: {
                by_status: byStatus,
                daily_summary: daily,
                outstanding: outstanding[0]
            }
        });
    } catch (error) {
        console.error('Error generating payment report:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating payment report'
        });
    }
});

module.exports = router;