const express = require('express');
const { verifyToken, authorize } = require('../middleware/auth');
const {
    getReservations,
    getReservationsByGuest,
    getAvailableRooms,
    getReservation,
    createReservation,
    updateReservation,
    cancelReservation,
    checkIn,
    checkOut
} = require('../controllers/reservationController');

const router = express.Router();

// Specific paths must be declared BEFORE '/:id', otherwise ':id' would swallow them
router.get('/', verifyToken, getReservations);
router.get('/guest/:guestId', verifyToken, getReservationsByGuest);
router.post('/available-rooms', verifyToken, getAvailableRooms);
router.post('/', verifyToken, createReservation);

router.get('/:id', verifyToken, getReservation);
router.put('/:id', verifyToken, updateReservation);
router.post('/:id/cancel', verifyToken, cancelReservation);
router.post('/:id/check-in', verifyToken, authorize('admin', 'manager', 'receptionist'), checkIn);
router.post('/:id/check-out', verifyToken, authorize('admin', 'manager', 'receptionist'), checkOut);

module.exports = router;