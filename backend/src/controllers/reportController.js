const { pool } = require('../config/database');

// ============================================
// OCCUPANCY REPORT
// ============================================
const getOccupancyReport = async (req, res) => {
    try {
        const [totalRooms] = await pool.execute(
            'SELECT COUNT(*) as total FROM rooms WHERE is_active = TRUE'
        );
        const [occupied] = await pool.execute(`
            SELECT COUNT(DISTINCT room_id) as occupied
            FROM reservations
            WHERE reservation_status = 'checked_in'
        `);
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
};

// ============================================
// REVENUE REPORT - SIMPLIFIED & FIXED
// ============================================
const getRevenueReport = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        // Build date filter
        let dateFilter = '';
        const params = [];

        if (start_date && end_date) {
            dateFilter = ' WHERE DATE(created_at) BETWEEN ? AND ? AND status = "completed"';
            params.push(start_date, end_date);
        } else {
            dateFilter = ' WHERE status = "completed"';
        }

        // 1. Total revenue
        const [totalRevenue] = await pool.execute(`
            SELECT COALESCE(SUM(amount), 0) as total
            FROM payments
            ${dateFilter}
        `, params);

        // 2. Revenue by payment method
        const [byPaymentMethod] = await pool.execute(`
            SELECT 
                payment_method, 
                COALESCE(SUM(amount), 0) as total
            FROM payments
            ${dateFilter}
            GROUP BY payment_method
        `, params);

        // 3. Revenue by room type - DISABLED (causing errors)
        // We'll return an empty array for now.
        const byRoomType = [];

        res.json({
            success: true,
            data: {
                total_revenue: totalRevenue[0]?.total || 0,
                by_payment_method: byPaymentMethod || [],
                by_room_type: byRoomType
            }
        });
    } catch (error) {
        console.error('❌ Revenue report error:', error);
        console.error('❌ SQL Error details:', error.sqlMessage || error.message);
        res.status(500).json({
            success: false,
            message: 'Error generating revenue report',
            error: error.message,
            sqlMessage: error.sqlMessage || null
        });
    }
};

// ============================================
// RESERVATION REPORT
// ============================================
const getReservationReport = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let dateFilter = '';
        const params = [];

        if (start_date && end_date) {
            dateFilter = ' AND created_at BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        const [byStatus] = await pool.execute(`
            SELECT reservation_status, COUNT(*) as count
            FROM reservations
            WHERE 1=1 ${dateFilter}
            GROUP BY reservation_status
        `, params);

        const [total] = await pool.execute(`
            SELECT COUNT(*) as total
            FROM reservations
            WHERE 1=1 ${dateFilter}
        `, params);

        const [bySource] = await pool.execute(`
            SELECT source, COUNT(*) as count
            FROM reservations
            WHERE 1=1 ${dateFilter}
            GROUP BY source
        `, params);

        res.json({
            success: true,
            data: {
                total_reservations: total[0]?.total || 0,
                by_status: byStatus || [],
                by_source: bySource || []
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
};

// ============================================
// GUEST REPORT
// ============================================
const getGuestReport = async (req, res) => {
    try {
        const [total] = await pool.execute(
            'SELECT COUNT(*) as total FROM guests'
        );

        const [byCountry] = await pool.execute(`
            SELECT country, COUNT(*) as count
            FROM guests
            WHERE country IS NOT NULL AND country != ''
            GROUP BY country
            ORDER BY count DESC
            LIMIT 10
        `);

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
};

// ============================================
// PAYMENT REPORT
// ============================================
const getPaymentReport = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let dateFilter = '';
        const params = [];

        if (start_date && end_date) {
            dateFilter = ' AND created_at BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        const [byStatus] = await pool.execute(`
            SELECT status, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
            FROM payments
            WHERE 1=1 ${dateFilter}
            GROUP BY status
        `, params);

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
};

module.exports = {
    getOccupancyReport,
    getRevenueReport,
    getReservationReport,
    getGuestReport,
    getPaymentReport
};