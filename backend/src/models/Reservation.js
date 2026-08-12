// const { pool } = require('../config/database');

// class Reservation {
//     // Get all reservations with pagination
//     static async findAll(page = 1, limit = 20, status = '', date = '') {
//         const offset = (page - 1) * limit;
//         let query = `
//             SELECT r.*, 
//                    g.first_name, g.last_name, g.email, g.phone,
//                    rm.room_number, rm.status as room_status,
//                    rt.name as room_type_name
//             FROM reservations r
//             LEFT JOIN guests g ON r.guest_id = g.id
//             LEFT JOIN rooms rm ON r.room_id = rm.id
//             LEFT JOIN room_types rt ON rm.room_type_id = rt.id
//             WHERE 1=1
//         `;
//         let countQuery = 'SELECT COUNT(*) as total FROM reservations WHERE 1=1';
//         const params = [];

//         if (status) {
//             query += ' AND r.reservation_status = ?';
//             countQuery += ' AND reservation_status = ?';
//             params.push(status);
//         }

//         if (date) {
//             query += ' AND (r.check_in_date = ? OR r.check_out_date = ?)';
//             countQuery += ' AND (check_in_date = ? OR check_out_date = ?)';
//             params.push(date, date);
//         }

//         query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
//         params.push(limit, offset);

//         const [rows] = await pool.execute(query, params);
//         const [count] = await pool.execute(countQuery, params.slice(0, params.length - 2));

//         return {
//             data: rows,
//             total: count[0].total
//         };
//     }

//     // Get single reservation by ID
//     static async findById(id) {
//         const [rows] = await pool.execute(`
//             SELECT r.*, 
//                    g.first_name, g.last_name, g.email, g.phone,
//                    rm.room_number, rm.status as room_status,
//                    rt.name as room_type_name
//             FROM reservations r
//             LEFT JOIN guests g ON r.guest_id = g.id
//             LEFT JOIN rooms rm ON r.room_id = rm.id
//             LEFT JOIN room_types rt ON rm.room_type_id = rt.id
//             WHERE r.id = ?
//         `, [id]);
//         return rows[0];
//     }

//     // Find by reservation number
//     static async findByReservationNumber(number) {
//         const [rows] = await pool.execute(
//             'SELECT * FROM reservations WHERE reservation_number = ?',
//             [number]
//         );
//         return rows[0];
//     }

//     // Create new reservation
//     static async create(data) {
//         const {
//             reservation_number, guest_id, room_id, check_in_date, check_out_date,
//             adults, children, rate, discount, tax, total_amount,
//             deposit_paid, balance, payment_status, source,
//             special_requests, notes, reservation_status
//         } = data;

//         const [result] = await pool.execute(
//             `INSERT INTO reservations (
//                 reservation_number, guest_id, room_id, check_in_date, check_out_date,
//                 adults, children, rate, discount, tax, total_amount,
//                 deposit_paid, balance, payment_status, source,
//                 special_requests, notes, reservation_status
//             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//             [
//                 reservation_number, guest_id, room_id, check_in_date, check_out_date,
//                 adults || 1, children || 0, rate, discount || 0, tax || 0, total_amount,
//                 deposit_paid || 0, balance, payment_status,
//                 source || 'direct', special_requests || null, notes || null,
//                 reservation_status
//             ]
//         );
//         return this.findById(result.insertId);
//     }

//     // ✅ FIXED: Update reservation with proper number handling
//     static async update(id, data) {
//         const {
//             check_in_date, check_out_date, adults, children,
//             rate, discount, tax, total_amount, deposit_paid,
//             source, special_requests, notes, reservation_status
//         } = data;

//         // ✅ Convert to numbers using Number()
//         const finalDeposit = Number(deposit_paid) || 0;
//         const finalTotal = Number(total_amount) || 0;
//         const finalRate = Number(rate) || 0;
//         const finalDiscount = Number(discount) || 0;
//         const finalTax = Number(tax) || 0;
//         const finalAdults = Number(adults) || 1;
//         const finalChildren = Number(children) || 0;
        
//         // ✅ Calculate balance (subtraction, not concatenation)
//         const balance = finalTotal - finalDeposit;
//         const paymentStatus = finalDeposit >= finalTotal ? 'paid' : 
//                              (finalDeposit > 0 ? 'partial' : 'pending');

//         console.log('📊 Update Reservation:', {
//             id,
//             finalDeposit,
//             finalTotal,
//             balance,
//             paymentStatus
//         });

//         await pool.execute(
//             `UPDATE reservations SET
//                 check_in_date = ?,
//                 check_out_date = ?,
//                 adults = ?,
//                 children = ?,
//                 rate = ?,
//                 discount = ?,
//                 tax = ?,
//                 total_amount = ?,
//                 deposit_paid = ?,
//                 balance = ?,
//                 payment_status = ?,
//                 source = ?,
//                 special_requests = ?,
//                 notes = ?,
//                 reservation_status = ?
//             WHERE id = ?`,
//             [
//                 check_in_date, 
//                 check_out_date, 
//                 finalAdults, 
//                 finalChildren,
//                 finalRate, 
//                 finalDiscount, 
//                 finalTax, 
//                 finalTotal,
//                 finalDeposit, 
//                 balance, 
//                 paymentStatus,
//                 source || 'direct', 
//                 special_requests || null, 
//                 notes || null,
//                 reservation_status, 
//                 id
//             ]
//         );
//         return this.findById(id);
//     }

//     // Update reservation status
//     static async updateStatus(id, status) {
//         await pool.execute(
//             'UPDATE reservations SET reservation_status = ? WHERE id = ?',
//             [status, id]
//         );
//     }

//     // Update payment status
//     static async updatePaymentStatus(id, status) {
//         await pool.execute(
//             'UPDATE reservations SET payment_status = ? WHERE id = ?',
//             [status, id]
//         );
//     }

//     // Check in guest
//     static async checkIn(id) {
//         await pool.execute(
//             `UPDATE reservations SET 
//                 reservation_status = 'checked_in',
//                 checked_in_at = NOW()
//             WHERE id = ?`,
//             [id]
//         );
//     }

//     // Check out guest
//     static async checkOut(id) {
//         await pool.execute(
//             `UPDATE reservations SET 
//                 reservation_status = 'checked_out',
//                 checked_out_at = NOW()
//             WHERE id = ?`,
//             [id]
//         );
//     }

//     // Cancel reservation
//     static async cancel(id) {
//         await pool.execute(
//             'UPDATE reservations SET reservation_status = ? WHERE id = ?',
//             ['cancelled', id]
//         );
//     }

//     // Get reservations by guest
//     static async getReservationsByGuest(guestId) {
//         const [rows] = await pool.execute(`
//             SELECT r.*, rm.room_number
//             FROM reservations r
//             LEFT JOIN rooms rm ON r.room_id = rm.id
//             WHERE r.guest_id = ?
//             ORDER BY r.created_at DESC
//         `, [guestId]);
//         return rows;
//     }

//     // Get active reservations
//     static async getActiveReservations() {
//         const [rows] = await pool.execute(`
//             SELECT r.*, g.first_name, g.last_name, rm.room_number
//             FROM reservations r
//             LEFT JOIN guests g ON r.guest_id = g.id
//             LEFT JOIN rooms rm ON r.room_id = rm.id
//             WHERE r.reservation_status IN ('confirmed', 'checked_in')
//             AND r.check_out_date >= CURDATE()
//             ORDER BY r.check_in_date ASC
//         `);
//         return rows;
//     }

//     // Get today's arrivals
//     static async getCheckInsToday() {
//         const [rows] = await pool.execute(`
//             SELECT r.*, g.first_name, g.last_name, rm.room_number
//             FROM reservations r
//             LEFT JOIN guests g ON r.guest_id = g.id
//             LEFT JOIN rooms rm ON r.room_id = rm.id
//             WHERE r.check_in_date = CURDATE()
//             AND r.reservation_status IN ('confirmed', 'pending')
//             ORDER BY r.created_at ASC
//         `);
//         return rows;
//     }

//     // Get today's departures
//     static async getCheckOutsToday() {
//         const [rows] = await pool.execute(`
//             SELECT r.*, g.first_name, g.last_name, rm.room_number
//             FROM reservations r
//             LEFT JOIN guests g ON r.guest_id = g.id
//             LEFT JOIN rooms rm ON r.room_id = rm.id
//             WHERE r.check_out_date = CURDATE()
//             AND r.reservation_status = 'checked_in'
//             ORDER BY r.created_at ASC
//         `);
//         return rows;
//     }

//     // Generate reservation number
//     static async generateReservationNumber() {
//         const date = new Date();
//         const year = date.getFullYear().toString().slice(-2);
//         const month = String(date.getMonth() + 1).padStart(2, '0');
//         const day = String(date.getDate()).padStart(2, '0');
//         const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
//         return `RES-${year}${month}${day}-${random}`;
//     }
// }

// module.exports = Reservation;