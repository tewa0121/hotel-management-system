const Reservation = require('../models/Reservation');
const Room = require('../models/Room');
const ApiError = require('../utils/ApiError');
const rules = require('../utils/reservationRules');
const { withTransaction } = require('../utils/transaction');
const { logActivity } = require('../middleware/auth');
const { createNotification } = require('../routes/notificationRoutes');

// Rooms in these states cannot be booked or checked in to
const UNAVAILABLE_ROOM_STATUSES = ['maintenance', 'out_of_service'];

// ============================================
// LOCKING RULES (read this before changing anything)
//
// Every operation that changes a booking runs in ONE transaction and locks rows in
// the same order, so two requests can never both succeed for the same room and can
// never deadlock each other:
//
//   create                       : lock the ROOM, check for overlaps, then insert
//   edit / cancel / check-in/out : lock the RESERVATION, then its room(s) (lowest id first)
//
// The room lock must be the first read in the transaction (see Room.lockByIds).
// ============================================

// audit_logs.user_id and notifications point to the staff table, so guests are not logged there
const actorId = (req) => (req.user && req.user.role !== 'guest' ? req.user.id : null);

const statusLabel = (status) => String(status).replace('_', '-');

const handleError = (res, error, fallbackMessage) => {
    if (error instanceof ApiError) {
        const body = { success: false, message: error.message };
        if (error.errors) body.errors = error.errors;
        return res.status(error.statusCode).json(body);
    }

    console.error(`${fallbackMessage}:`, error);
    res.status(500).json({
        success: false,
        message: fallbackMessage
    });
};

// A failed notification must never turn a successful booking into an error
const notify = async (req, message, link) => {
    const userId = actorId(req);
    if (userId === null) return;
    try {
        await createNotification(userId, message, 'reservation', link);
    } catch (error) {
        console.error('Error creating notification:', error.message);
    }
};

const conflictError = (conflict) => new ApiError(
    409,
    `Room is not available for selected dates (already booked ${conflict.check_in_date} to ${conflict.check_out_date})`
);

const assertRoomBookable = (room) => {
    if (!room || !room.is_active) {
        throw new ApiError(404, 'Room not found');
    }
    if (UNAVAILABLE_ROOM_STATUSES.includes(room.status)) {
        throw new ApiError(409, 'Room is not available for selected dates');
    }
};

const assertGuestExists = async (connection, guestId) => {
    const [rows] = await connection.execute('SELECT id FROM guests WHERE id = ?', [guestId]);
    if (rows.length === 0) {
        throw new ApiError(404, 'Guest not found');
    }
};

// The availability search filters by adults, so the booking check uses adults too
const assertCapacity = async (connection, room, adults) => {
    const maxOccupancy = await Room.getMaxOccupancy(room.room_type_id, connection);
    const guests = Number(adults) || 1;
    if (maxOccupancy && guests > maxOccupancy) {
        throw new ApiError(400, `This room holds at most ${maxOccupancy} adult${maxOccupancy > 1 ? 's' : ''}`);
    }
};

// A room that is "available" or "reserved" follows its bookings:
// reserved while a pending/confirmed booking is ahead, available otherwise.
// Rooms that are occupied, dirty, being cleaned or under maintenance are left alone.
const syncRoomReservedState = async (roomId, connection) => {
    const room = await Room.findById(roomId, connection);
    if (!room || !['available', 'reserved'].includes(room.status)) return;

    const upcoming = await Reservation.countUpcoming(roomId, connection);
    const wanted = upcoming > 0 ? 'reserved' : 'available';

    if (wanted !== room.status) {
        await Room.updateStatus(roomId, wanted, connection);
    }
};

// ============================================
// GET /api/reservations
// ============================================
const getReservations = async (req, res) => {
    try {
        const status = typeof req.query.status === 'string' ? req.query.status : '';
        const date = typeof req.query.date === 'string' ? req.query.date : '';

        if (date && !rules.isValidDateString(date)) {
            throw new ApiError(400, 'Date filter must be a valid date (YYYY-MM-DD)');
        }

        const result = await Reservation.findAll(req.query.page, req.query.limit, status, date);

        res.json({
            success: true,
            data: result.data,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: Math.ceil(result.total / result.limit)
            }
        });
    } catch (error) {
        handleError(res, error, 'Error fetching reservations');
    }
};

// ============================================
// GET /api/reservations/guest/:guestId
// ============================================
const getReservationsByGuest = async (req, res) => {
    try {
        const reservations = await Reservation.findByGuest(req.params.guestId);
        res.json({
            success: true,
            data: reservations
        });
    } catch (error) {
        handleError(res, error, 'Error fetching guest reservations');
    }
};

// ============================================
// POST /api/reservations/available-rooms
// ============================================
const getAvailableRooms = async (req, res) => {
    try {
        const { check_in_date, check_out_date, room_type_id, guests } = req.body || {};

        const errors = rules.validateSearchDates(check_in_date, check_out_date);
        if (errors.length > 0) {
            throw new ApiError(400, errors.join(', '), errors);
        }

        const positiveInt = (value) => (Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : null);

        const rooms = await Room.getAvailableRooms(
            check_in_date,
            check_out_date,
            positiveInt(room_type_id),
            positiveInt(guests)
        );

        res.json({
            success: true,
            data: rooms
        });
    } catch (error) {
        handleError(res, error, 'Error fetching available rooms');
    }
};

// ============================================
// GET /api/reservations/:id
// ============================================
const getReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            throw new ApiError(404, 'Reservation not found');
        }
        res.json({
            success: true,
            data: reservation
        });
    } catch (error) {
        handleError(res, error, 'Error fetching reservation');
    }
};

// ============================================
// POST /api/reservations
// ============================================
const createReservation = async (req, res) => {
    try {
        const body = req.body || {};

        const errors = rules.validateReservationInput(body);
        if (errors.length > 0) {
            throw new ApiError(400, errors.join(', '), errors);
        }

        const guestId = Number(body.guest_id);
        const roomId = Number(body.room_id);

        const reservation = await withTransaction(async (connection) => {
            // 1. Lock the room FIRST. Anyone else booking this room now waits here
            //    until this transaction is finished, then sees our booking.
            const [room] = await Room.lockByIds(connection, [roomId]);
            assertRoomBookable(room);

            // 2. Is the room still free for these dates?
            const conflict = await Reservation.findConflict(
                roomId, body.check_in_date, body.check_out_date, null, connection
            );
            if (conflict) {
                throw conflictError(conflict);
            }

            await assertGuestExists(connection, guestId);
            await assertCapacity(connection, room, body.adults);

            // 3. Save the booking
            const total_amount = Number(body.total_amount) || 0;
            const deposit_paid = Number(body.deposit_paid) || 0;
            const { balance, payment_status } = rules.computeFinancials({ total_amount, deposit_paid });

            const created = await Reservation.create({
                reservation_number: await Reservation.generateReservationNumber(connection),
                guest_id: guestId,
                room_id: roomId,
                check_in_date: body.check_in_date,
                check_out_date: body.check_out_date,
                adults: body.adults,
                children: body.children,
                rate: body.rate,
                discount: body.discount,
                tax: body.tax,
                total_amount,
                deposit_paid,
                balance,
                payment_status,
                source: body.source,
                special_requests: body.special_requests,
                notes: body.notes,
                reservation_status: deposit_paid > 0 ? 'confirmed' : 'pending'
            }, connection);

            await syncRoomReservedState(roomId, connection);

            return created;
        });

        await logActivity(actorId(req), 'CREATE', 'reservation', reservation.id, null, reservation, req.ip);
        await notify(
            req,
            `New reservation #${reservation.reservation_number} created for guest ${reservation.first_name || 'Guest'}`,
            `/reservations/${reservation.id}`
        );

        res.status(201).json({
            success: true,
            message: 'Reservation created successfully',
            data: reservation
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return handleError(res, new ApiError(409, 'Could not save the reservation, please try again'), '');
        }
        handleError(res, error, 'Error creating reservation');
    }
};

// ============================================
// PUT /api/reservations/:id  (partial updates allowed)
// ============================================
const updateReservation = async (req, res) => {
    try {
        const body = req.body || {};

        const { before, after } = await withTransaction(async (connection) => {
            // Lock order: this reservation first, then its room(s)
            const existing = await Reservation.findForUpdate(req.params.id, connection);
            if (!existing) {
                throw new ApiError(404, 'Reservation not found');
            }

            if (rules.CLOSED_STATUSES.includes(existing.reservation_status)) {
                throw new ApiError(400, `A ${statusLabel(existing.reservation_status)} reservation cannot be edited`);
            }

            const errors = rules.validateReservationInput(body, { existing });
            if (errors.length > 0) {
                throw new ApiError(400, errors.join(', '), errors);
            }

            const finalGuestId = body.guest_id !== undefined ? Number(body.guest_id) : existing.guest_id;
            const finalRoomId = body.room_id !== undefined ? Number(body.room_id) : existing.room_id;
            const finalCheckIn = body.check_in_date !== undefined ? body.check_in_date : existing.check_in_date;
            const finalCheckOut = body.check_out_date !== undefined ? body.check_out_date : existing.check_out_date;

            const guestChanged = finalGuestId !== existing.guest_id;
            const roomChanged = finalRoomId !== existing.room_id;
            const checkInChanged = finalCheckIn !== existing.check_in_date;
            const datesChanged = checkInChanged || finalCheckOut !== existing.check_out_date;

            if (existing.reservation_status === 'checked_in' && (guestChanged || roomChanged || checkInChanged)) {
                throw new ApiError(400, 'Guest, room and check-in date cannot be changed after check-in');
            }

            // Only pending <-> confirmed can be changed here; everything else has its own action
            if (body.reservation_status !== undefined && body.reservation_status !== existing.reservation_status) {
                const editable = ['pending', 'confirmed'];
                if (!editable.includes(existing.reservation_status) || !editable.includes(body.reservation_status)) {
                    throw new ApiError(
                        400,
                        `Use the cancel, check-in or check-out actions to change the status to "${body.reservation_status}"`
                    );
                }
            }

            const rooms = await Room.lockByIds(connection, [existing.room_id, finalRoomId]);
            const newRoom = rooms.find(r => r.id === finalRoomId);

            if (roomChanged) {
                assertRoomBookable(newRoom);
            }

            if (roomChanged || datesChanged) {
                const conflict = await Reservation.findConflict(
                    finalRoomId, finalCheckIn, finalCheckOut, existing.id, connection
                );
                if (conflict) {
                    throw conflictError(conflict);
                }
            }

            if (guestChanged) {
                await assertGuestExists(connection, finalGuestId);
            }

            if (roomChanged || body.adults !== undefined) {
                await assertCapacity(connection, newRoom, body.adults !== undefined ? body.adults : existing.adults);
            }

            const updated = await Reservation.update(existing.id, body, connection);

            if (roomChanged) {
                await syncRoomReservedState(existing.room_id, connection);
                await syncRoomReservedState(finalRoomId, connection);
            }

            return { before: existing, after: updated };
        });

        await logActivity(actorId(req), 'UPDATE', 'reservation', after.id, before, after, req.ip);
        await notify(req, `Reservation #${after.reservation_number} updated`, `/reservations/${after.id}`);

        res.json({
            success: true,
            message: 'Reservation updated successfully',
            data: after
        });
    } catch (error) {
        handleError(res, error, 'Error updating reservation');
    }
};

// ============================================
// POST /api/reservations/:id/cancel
// ============================================
const cancelReservation = async (req, res) => {
    try {
        const reservation = await withTransaction(async (connection) => {
            const existing = await Reservation.findForUpdate(req.params.id, connection);
            if (!existing) {
                throw new ApiError(404, 'Reservation not found');
            }

            if (existing.reservation_status === 'checked_in') {
                throw new ApiError(400, 'Cannot cancel a checked-in reservation');
            }
            if (existing.reservation_status === 'cancelled') {
                throw new ApiError(400, 'Reservation is already cancelled');
            }
            if (existing.reservation_status !== 'pending' && existing.reservation_status !== 'confirmed') {
                throw new ApiError(400, `Cannot cancel a ${statusLabel(existing.reservation_status)} reservation`);
            }

            await Room.lockByIds(connection, [existing.room_id]);

            await Reservation.cancel(existing.id, connection);
            await syncRoomReservedState(existing.room_id, connection);

            return existing;
        });

        await logActivity(
            actorId(req), 'CANCEL', 'reservation', reservation.id,
            { reservation_status: reservation.reservation_status }, { reservation_status: 'cancelled' }, req.ip
        );
        await notify(req, `Reservation #${reservation.reservation_number} cancelled`, '/reservations');

        res.json({
            success: true,
            message: 'Reservation cancelled successfully'
        });
    } catch (error) {
        handleError(res, error, 'Error cancelling reservation');
    }
};

// ============================================
// POST /api/reservations/:id/check-in
// ============================================
const checkIn = async (req, res) => {
    try {
        const reservation = await withTransaction(async (connection) => {
            const existing = await Reservation.findForUpdate(req.params.id, connection);
            if (!existing) {
                throw new ApiError(404, 'Reservation not found');
            }

            if (existing.reservation_status === 'checked_in') {
                throw new ApiError(400, 'Guest is already checked in');
            }
            if (existing.reservation_status === 'cancelled') {
                throw new ApiError(400, 'Cannot check in a cancelled reservation');
            }
            if (existing.reservation_status !== 'confirmed' && existing.reservation_status !== 'pending') {
                throw new ApiError(400, 'Reservation must be confirmed or pending to check in');
            }

            const [room] = await Room.lockByIds(connection, [existing.room_id]);
            if (!room || UNAVAILABLE_ROOM_STATUSES.includes(room.status)) {
                throw new ApiError(400, 'Room is not available for check-in (maintenance or out of service)');
            }

            const occupant = await Reservation.findOtherCheckedIn(existing.room_id, existing.id, connection);
            if (occupant) {
                throw new ApiError(409, 'Room is currently occupied by another guest');
            }

            await Reservation.checkIn(existing.id, connection);
            await Room.updateStatus(existing.room_id, 'occupied', connection);

            return Reservation.findById(existing.id, connection);
        });

        await logActivity(
            actorId(req), 'CHECK_IN', 'reservation', reservation.id,
            { reservation_status: 'pending/confirmed' }, { reservation_status: 'checked_in' }, req.ip
        );
        await notify(
            req,
            `Guest ${reservation.first_name || 'Guest'} checked in to room ${reservation.room_number}`,
            `/reservations/${reservation.id}`
        );

        res.json({
            success: true,
            message: 'Guest checked in successfully'
        });
    } catch (error) {
        handleError(res, error, 'Error during check-in');
    }
};

// ============================================
// POST /api/reservations/:id/check-out
// ============================================
const checkOut = async (req, res) => {
    try {
        const reservation = await withTransaction(async (connection) => {
            const existing = await Reservation.findForUpdate(req.params.id, connection);
            if (!existing) {
                throw new ApiError(404, 'Reservation not found');
            }

            if (existing.reservation_status !== 'checked_in') {
                throw new ApiError(400, 'Guest is not checked in');
            }

            await Room.lockByIds(connection, [existing.room_id]);

            await Reservation.checkOut(existing.id, connection);
            await Room.markDirty(existing.room_id, connection);

            // One cleaning task per room: do not add another if one is already open
            const [openTasks] = await connection.execute(
                `SELECT id FROM housekeeping
                 WHERE room_id = ? AND status IN ('pending', 'assigned', 'cleaning')
                 LIMIT 1`,
                [existing.room_id]
            );
            if (openTasks.length === 0) {
                await connection.execute(
                    `INSERT INTO housekeeping (room_id, status, priority, created_by)
                     VALUES (?, 'pending', 'normal', ?)`,
                    [existing.room_id, actorId(req)]
                );
            }

            // A stay counts for the guest when it is completed
            await connection.execute(
                'UPDATE guests SET total_stays = total_stays + 1 WHERE id = ?',
                [existing.guest_id]
            );

            return Reservation.findById(existing.id, connection);
        });

        await logActivity(
            actorId(req), 'CHECK_OUT', 'reservation', reservation.id,
            { reservation_status: 'checked_in' }, { reservation_status: 'checked_out' }, req.ip
        );
        await notify(
            req,
            `Guest ${reservation.first_name || 'Guest'} checked out from room ${reservation.room_number}`,
            `/reservations/${reservation.id}`
        );

        res.json({
            success: true,
            message: 'Guest checked out successfully'
        });
    } catch (error) {
        handleError(res, error, 'Error during check-out');
    }
};

module.exports = {
    getReservations,
    getReservationsByGuest,
    getAvailableRooms,
    getReservation,
    createReservation,
    updateReservation,
    cancelReservation,
    checkIn,
    checkOut
};