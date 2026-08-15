const express = require('express');
const { pool } = require('../config/db');
const { verifyToken, authorize } = require('../middleware/auth');

const router = express.Router();

// ============================================
// OCCUPANCY REPORT
// ============================================
router.get('/occupancy', verifyToken, authorize('admin', 'manager', 'accountant'), async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

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

        const total = totalRooms[0]?.total || 0;
        const occupiedCount = occupied[0]?.occupied || 0;
        const reservedCount = reserved[0]?.reserved || 0;
        const available = total - occupiedCount - reservedCount;
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
        console.error('❌ Occupancy report error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating occupancy report',
            error: error.message
        });
    }
});

// ============================================
// REVENUE REPORT - COMPLETE FIX
// ============================================
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

        // 1. Revenue by date
        const [revenueByDate] = await pool.execute(`
            SELECT ${groupBy} as period, COALESCE(SUM(amount), 0) as total
            FROM payments
            WHERE status = 'completed'
            ${dateFilter}
            GROUP BY ${groupBy}
            ORDER BY period DESC
            LIMIT 30
        `, params);

        // 2. Total revenue
        const [totalRevenue] = await pool.execute(`
            SELECT COALESCE(SUM(amount), 0) as total
            FROM payments
            WHERE status = 'completed'
            ${dateFilter}
        `, params);

        // 3. Revenue by payment method
        const [byPaymentMethod] = await pool.execute(`
            SELECT 
                payment_method, 
                COALESCE(SUM(amount), 0) as total
            FROM payments
            WHERE status = 'completed'
            ${dateFilter}
            GROUP BY payment_method
        `, params);

        // 4. Revenue by room type - FIXED: uses p.created_at to avoid ambiguity
        let roomTypeDateFilter = '';
        const roomTypeParams = [];

        if (start_date && end_date) {
            roomTypeDateFilter = ' AND DATE(p.created_at) BETWEEN ? AND ?';
            roomTypeParams.push(start_date, end_date);
        }

        const [byRoomType] = await pool.execute(`
            SELECT 
                COALESCE(rt.name, 'Uncategorized') as name, 
                COALESCE(SUM(p.amount), 0) as total
            FROM payments p
            LEFT JOIN reservations r ON p.reservation_id = r.id
            LEFT JOIN rooms rm ON r.room_id = rm.id
            LEFT JOIN room_types rt ON rm.room_type_id = rt.id
            WHERE p.status = 'completed'
            ${roomTypeDateFilter}
            GROUP BY rt.id
        `, roomTypeParams);

        res.json({
            success: true,
            data: {
                total_revenue: totalRevenue[0]?.total || 0,
                revenue_by_date: revenueByDate || [],
                by_payment_method: byPaymentMethod || [],
                by_room_type: byRoomType || [],
                period: label
            }
        });
    } catch (error) {
        console.error('❌ Revenue report error:', error);
        console.error('❌ SQL Error:', error.sqlMessage || error.message);
        res.status(500).json({
            success: false,
            message: 'Error generating revenue report',
            error: error.message,
            sqlMessage: error.sqlMessage || null
        });
    }
});

// ============================================
// RESERVATION REPORT
// ============================================
router.get('/reservations', verifyToken, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let dateFilter = '';
        const params = [];

        if (start_date && end_date) {
            dateFilter = ' AND created_at BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        // By status
        const [byStatus] = await pool.execute(`
            SELECT reservation_status, COUNT(*) as count
            FROM reservations
            WHERE 1=1 ${dateFilter}
            GROUP BY reservation_status
        `, params);

        // Total
        const [total] = await pool.execute(`
            SELECT COUNT(*) as total
            FROM reservations
            WHERE 1=1 ${dateFilter}
        `, params);

        // By source
        const [bySource] = await pool.execute(`
            SELECT source, COUNT(*) as count
            FROM reservations
            WHERE 1=1 ${dateFilter}
            GROUP BY source
        `, params);

        // Monthly
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
                by_status: byStatus || [],
                by_source: bySource || [],
                monthly: monthly || []
            }
        });
    } catch (error) {
        console.error('❌ Reservation report error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating reservation report',
            error: error.message
        });
    }
});

// ============================================
// GUEST REPORT
// ============================================
router.get('/guests', verifyToken, authorize('admin', 'manager'), async (req, res) => {
    try {
        // Total guests
        const [total] = await pool.execute(
            'SELECT COUNT(*) as total FROM guests'
        );

        // Stay distribution
        const [stays] = await pool.execute(
            'SELECT total_stays, COUNT(*) as count FROM guests GROUP BY total_stays'
        );

        // By country
        const [byCountry] = await pool.execute(`
            SELECT country, COUNT(*) as count
            FROM guests
            WHERE country IS NOT NULL AND country != ''
            GROUP BY country
            ORDER BY count DESC
            LIMIT 10
        `);

        // Top spenders
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
                stays_distribution: stays || [],
                by_country: byCountry || [],
                top_spenders: topSpenders || []
            }
        });
    } catch (error) {
        console.error('❌ Guest report error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating guest report',
            error: error.message
        });
    }
});

// ============================================
// PAYMENT REPORT
// ============================================
router.get('/payments', verifyToken, authorize('admin', 'manager', 'accountant'), async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let dateFilter = '';
        const params = [];

        if (start_date && end_date) {
            dateFilter = ' AND created_at BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        // By status
        const [byStatus] = await pool.execute(`
            SELECT status, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
            FROM payments
            WHERE 1=1 ${dateFilter}
            GROUP BY status
        `, params);

        // Daily summary
        const [daily] = await pool.execute(`
            SELECT DATE(created_at) as date, 
                   COUNT(*) as count,
                   COALESCE(SUM(amount), 0) as total
            FROM payments
            WHERE status = 'completed'
            ${dateFilter}
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 30
        `, params);

        // Outstanding balances
        const [outstanding] = await pool.execute(`
            SELECT COUNT(*) as count, COALESCE(SUM(balance), 0) as total
            FROM reservations
            WHERE reservation_status IN ('confirmed', 'checked_in')
            AND balance > 0
        `);

        res.json({
            success: true,
            data: {
                by_status: byStatus || [],
                daily_summary: daily || [],
                outstanding: outstanding[0] || { count: 0, total: 0 }
            }
        });
    } catch (error) {
        console.error('❌ Payment report error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating payment report',
            error: error.message
        });
    }
});

module.exports = router;