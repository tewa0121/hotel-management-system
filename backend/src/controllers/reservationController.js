// const { pool } = require('../config/database');
// const Reservation = require('../models/Reservation');
// const Room = require('../models/Room');
// const Guest = require('../models/Guest');
// const Housekeeping = require('../models/Housekeeping');
// const { validateReservation } = require('../utils/validators');
// const { logActivity } = require('../middleware/auth');

// // ============================================
// // 1. GET ALL RESERVATIONS (with pagination)
// // ============================================
// const getReservations = async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 20;
//         const status = req.query.status || '';
//         const date = req.query.date || '';

//         const result = await Reservation.findAll(page, limit, status, date);

//         res.json({
//             success: true,
//             data: result.data,
//             pagination: {
//                 page,
//                 limit,
//                 total: result.total,
//                 totalPages: Math.ceil(result.total / limit)
//             }
//         });
//     } catch (error) {
//         console.error('Error fetching reservations:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching reservations'
//         });
//     }
// };

// // ============================================
// // 2. GET AVAILABLE ROOMS
// // ============================================
// const getAvailableRooms = async (req, res) => {
//     try {
//         const { check_in_date, check_out_date, room_type_id, guests } = req.body;

//         if (!check_in_date || !check_out_date) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Check-in and check-out dates are required'
//             });
//         }

//         const rooms = await Room.getAvailableRooms(
//             check_in_date,
//             check_out_date,
//             room_type_id,
//             guests
//         );

//         res.json({
//             success: true,
//             data: rooms
//         });
//     } catch (error) {
//         console.error('Error fetching available rooms:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching available rooms'
//         });
//     }
// };

// // ============================================
// // 3. CREATE RESERVATION
// // ============================================
// const createReservation = async (req, res) => {
//     const connection = await pool.getConnection();
//     try {
//         await connection.beginTransaction();

//         // Validate input
//         const validation = validateReservation(req.body);
//         if (!validation.isValid) {
//             return res.status(400).json({
//                 success: false,
//                 errors: validation.errors
//             });
//         }

//         const {
//             guest_id, room_id, check_in_date, check_out_date,
//             adults, children, rate, discount, tax, total_amount,
//             deposit_paid, source, special_requests, notes
//         } = req.body;

//         // Check if guest exists
//         const guest = await Guest.findById(guest_id);
//         if (!guest) {
//             await connection.rollback();
//             return res.status(404).json({
//                 success: false,
//                 message: 'Guest not found'
//             });
//         }

//         // Check if room exists and is available
//         const room = await Room.findById(room_id);
//         if (!room) {
//             await connection.rollback();
//             return res.status(404).json({
//                 success: false,
//                 message: 'Room not found'
//             });
//         }

//         // Check room availability
//         const availableRooms = await Room.getAvailableRooms(check_in_date, check_out_date);
//         const roomAvailable = availableRooms.find(r => r.id === parseInt(room_id));

//         if (!roomAvailable) {
//             await connection.rollback();
//             return res.status(400).json({
//                 success: false,
//                 message: 'Room is not available for selected dates'
//             });
//         }

//         // Generate reservation number
//         const reservation_number = await Reservation.generateReservationNumber();

//         // Calculate balance and statuses
//         const balance = (total_amount || 0) - (deposit_paid || 0);
//         const payment_status = deposit_paid > 0 ? (deposit_paid >= total_amount ? 'paid' : 'partial') : 'pending';
//         const reservation_status = deposit_paid > 0 ? 'confirmed' : 'pending';

//         // Create reservation
//         const reservationData = {
//             reservation_number,
//             guest_id,
//             room_id,
//             check_in_date,
//             check_out_date,
//             adults: adults || 1,
//             children: children || 0,
//             rate: rate || 0,
//             discount: discount || 0,
//             tax: tax || 0,
//             total_amount: total_amount || 0,
//             deposit_paid: deposit_paid || 0,
//             balance,
//             payment_status,
//             source: source || 'direct',
//             special_requests: special_requests || null,
//             notes: notes || null,
//             reservation_status
//         };

//         const reservation = await Reservation.create(reservationData);

//         // Update room status
//         await connection.execute(
//             'UPDATE rooms SET status = ? WHERE id = ?',
//             ['reserved', room_id]
//         );

//         // Update guest total stays
//         await connection.execute(
//             'UPDATE guests SET total_stays = total_stays + 1 WHERE id = ?',
//             [guest_id]
//         );

//         // Update guest total spent if deposit paid
//         if (deposit_paid > 0) {
//             await connection.execute(
//                 'UPDATE guests SET total_spent = total_spent + ? WHERE id = ?',
//                 [deposit_paid, guest_id]
//             );
//         }

//         await connection.commit();

//         // Log activity
//         await logActivity(
//             req.user.id,
//             'CREATE',
//             'reservation',
//             reservation.id,
//             null,
//             reservation,
//             req.ip
//         );

//         // Get complete reservation with guest info
//         const completeReservation = await Reservation.findById(reservation.id);

//         res.status(201).json({
//             success: true,
//             message: 'Reservation created successfully',
//             data: completeReservation
//         });
//     } catch (error) {
//         await connection.rollback();
//         console.error('Error creating reservation:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error creating reservation'
//         });
//     } finally {
//         connection.release();
//     }
// };

// // ============================================
// // 4. GET SINGLE RESERVATION
// // ============================================
// const getReservation = async (req, res) => {
//     try {
//         const reservation = await Reservation.findById(req.params.id);
//         if (!reservation) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Reservation not found'
//             });
//         }
//         res.json({
//             success: true,
//             data: reservation
//         });
//     } catch (error) {
//         console.error('Error fetching reservation:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching reservation'
//         });
//     }
// };

// // ============================================
// // 5. UPDATE RESERVATION
// // ============================================
// const updateReservation = async (req, res) => {
//     try {
//         const reservation = await Reservation.findById(req.params.id);
//         if (!reservation) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Reservation not found'
//             });
//         }

//         // Validate input
//         const validation = validateReservation(req.body);
//         if (!validation.isValid) {
//             return res.status(400).json({
//                 success: false,
//                 errors: validation.errors
//             });
//         }

//         // Check if room is available if room is being changed
//         if (req.body.room_id && req.body.room_id !== reservation.room_id) {
//             const availableRooms = await Room.getAvailableRooms(
//                 req.body.check_in_date || reservation.check_in_date,
//                 req.body.check_out_date || reservation.check_out_date
//             );
//             const roomAvailable = availableRooms.find(r => r.id === parseInt(req.body.room_id));

//             if (!roomAvailable) {
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Room is not available for selected dates'
//                 });
//             }

//             // Update old room status
//             await Room.updateStatus(reservation.room_id, 'available');
//         }

//         const updated = await Reservation.update(req.params.id, req.body);

//         // If room changed, update new room status
//         if (req.body.room_id && req.body.room_id !== reservation.room_id) {
//             await Room.updateStatus(req.body.room_id, 'reserved');
//         }

//         await logActivity(
//             req.user.id,
//             'UPDATE',
//             'reservation',
//             updated.id,
//             reservation,
//             updated,
//             req.ip
//         );

//         res.json({
//             success: true,
//             message: 'Reservation updated successfully',
//             data: updated
//         });
//     } catch (error) {
//         console.error('Error updating reservation:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error updating reservation'
//         });
//     }
// };

// // ============================================
// // 6. CANCEL RESERVATION
// // ============================================
// const cancelReservation = async (req, res) => {
//     const connection = await pool.getConnection();
//     try {
//         await connection.beginTransaction();

//         const reservation = await Reservation.findById(req.params.id);
//         if (!reservation) {
//             await connection.rollback();
//             return res.status(404).json({
//                 success: false,
//                 message: 'Reservation not found'
//             });
//         }

//         if (reservation.reservation_status === 'checked_in') {
//             await connection.rollback();
//             return res.status(400).json({
//                 success: false,
//                 message: 'Cannot cancel a checked-in reservation'
//             });
//         }

//         if (reservation.reservation_status === 'cancelled') {
//             await connection.rollback();
//             return res.status(400).json({
//                 success: false,
//                 message: 'Reservation is already cancelled'
//             });
//         }

//         // Update reservation status
//         await Reservation.cancel(req.params.id);

//         // Update room status back to available
//         await connection.execute(
//             'UPDATE rooms SET status = ? WHERE id = ?',
//             ['available', reservation.room_id]
//         );

//         await connection.commit();

//         await logActivity(
//             req.user.id,
//             'CANCEL',
//             'reservation',
//             req.params.id,
//             { status: reservation.reservation_status },
//             { status: 'cancelled' },
//             req.ip
//         );

//         res.json({
//             success: true,
//             message: 'Reservation cancelled successfully'
//         });
//     } catch (error) {
//         await connection.rollback();
//         console.error('Error cancelling reservation:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error cancelling reservation'
//         });
//     } finally {
//         connection.release();
//     }
// };

// // ============================================
// // 7. CHECK-IN
// // ============================================
// const checkIn = async (req, res) => {
//     const connection = await pool.getConnection();
//     try {
//         await connection.beginTransaction();

//         const reservation = await Reservation.findById(req.params.id);
//         if (!reservation) {
//             await connection.rollback();
//             return res.status(404).json({
//                 success: false,
//                 message: 'Reservation not found'
//             });
//         }

//         if (reservation.reservation_status === 'checked_in') {
//             await connection.rollback();
//             return res.status(400).json({
//                 success: false,
//                 message: 'Guest is already checked in'
//             });
//         }

//         if (reservation.reservation_status === 'cancelled') {
//             await connection.rollback();
//             return res.status(400).json({
//                 success: false,
//                 message: 'Cannot check in a cancelled reservation'
//             });
//         }

//         if (reservation.reservation_status === 'checked_out') {
//             await connection.rollback();
//             return res.status(400).json({
//                 success: false,
//                 message: 'Guest has already checked out'
//             });
//         }

//         // Update reservation
//         await Reservation.checkIn(req.params.id);

//         // Update room status
//         await connection.execute(
//             'UPDATE rooms SET status = ? WHERE id = ?',
//             ['occupied', reservation.room_id]
//         );

//         await connection.commit();

//         await logActivity(
//             req.user.id,
//             'CHECK_IN',
//             'reservation',
//             req.params.id,
//             { status: reservation.reservation_status },
//             { status: 'checked_in' },
//             req.ip
//         );

//         const updatedReservation = await Reservation.findById(req.params.id);

//         res.json({
//             success: true,
//             message: 'Guest checked in successfully',
//             data: updatedReservation
//         });
//     } catch (error) {
//         await connection.rollback();
//         console.error('Error checking in:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error during check-in'
//         });
//     } finally {
//         connection.release();
//     }
// };

// // ============================================
// // 8. CHECK-OUT
// // ============================================
// const checkOut = async (req, res) => {
//     const connection = await pool.getConnection();
//     try {
//         await connection.beginTransaction();

//         const reservation = await Reservation.findById(req.params.id);
//         if (!reservation) {
//             await connection.rollback();
//             return res.status(404).json({
//                 success: false,
//                 message: 'Reservation not found'
//             });
//         }

//         if (reservation.reservation_status !== 'checked_in') {
//             await connection.rollback();
//             return res.status(400).json({
//                 success: false,
//                 message: 'Guest is not checked in'
//             });
//         }

//         // Update reservation
//         await Reservation.checkOut(req.params.id);

//         // Update room status to dirty for housekeeping
//         await connection.execute(
//             'UPDATE rooms SET status = ?, housekeeping_status = ? WHERE id = ?',
//             ['dirty', 'dirty', reservation.room_id]
//         );

//         // Create housekeeping task automatically
//         await connection.execute(
//             `INSERT INTO housekeeping (room_id, status, priority, created_by)
//              VALUES (?, ?, ?, ?)`,
//             [reservation.room_id, 'pending', 'normal', req.user.id]
//         );

//         await connection.commit();

//         await logActivity(
//             req.user.id,
//             'CHECK_OUT',
//             'reservation',
//             req.params.id,
//             { status: 'checked_in' },
//             { status: 'checked_out' },
//             req.ip
//         );

//         const updatedReservation = await Reservation.findById(req.params.id);

//         res.json({
//             success: true,
//             message: 'Guest checked out successfully',
//             data: updatedReservation
//         });
//     } catch (error) {
//         await connection.rollback();
//         console.error('Error checking out:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error during check-out'
//         });
//     } finally {
//         connection.release();
//     }
// };

// // ============================================
// // 9. GET RESERVATIONS BY GUEST
// // ============================================
// const getReservationsByGuest = async (req, res) => {
//     try {
//         const reservations = await Reservation.getReservationsByGuest(req.params.guestId);
//         res.json({
//             success: true,
//             data: reservations
//         });
//     } catch (error) {
//         console.error('Error fetching guest reservations:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching guest reservations'
//         });
//     }
// };

// // ============================================
// // 10. GET TODAY'S ARRIVALS
// // ============================================
// const getTodayArrivals = async (req, res) => {
//     try {
//         const arrivals = await Reservation.getCheckInsToday();
//         res.json({
//             success: true,
//             data: arrivals
//         });
//     } catch (error) {
//         console.error('Error fetching today\'s arrivals:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching today\'s arrivals'
//         });
//     }
// };

// // ============================================
// // 11. GET TODAY'S DEPARTURES
// // ============================================
// const getTodayDepartures = async (req, res) => {
//     try {
//         const departures = await Reservation.getCheckOutsToday();
//         res.json({
//             success: true,
//             data: departures
//         });
//     } catch (error) {
//         console.error('Error fetching today\'s departures:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching today\'s departures'
//         });
//     }
// };

// // ============================================
// // 12. GET ACTIVE RESERVATIONS
// // ============================================
// const getActiveReservations = async (req, res) => {
//     try {
//         const active = await Reservation.getActiveReservations();
//         res.json({
//             success: true,
//             data: active
//         });
//     } catch (error) {
//         console.error('Error fetching active reservations:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching active reservations'
//         });
//     }
// };

// // ============================================
// // EXPORT ALL FUNCTIONS
// // ============================================
// module.exports = {
//     getReservations,
//     getAvailableRooms,
//     createReservation,
//     getReservation,
//     updateReservation,
//     cancelReservation,
//     checkIn,
//     checkOut,
//     getReservationsByGuest,
//     getTodayArrivals,
//     getTodayDepartures,
//     getActiveReservations
// };