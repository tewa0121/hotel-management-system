const express = require('express');
const { verifyToken, authorize } = require('../middleware/auth');
const {
    getPayments,
    getPaymentsByReservation,
    getPayment,
    createPayment,
    refundPayment
} = require('../controllers/paymentController');

const router = express.Router();

// Specific paths must be declared BEFORE '/:id', otherwise ':id' would swallow them
router.get('/', verifyToken, getPayments);
router.get('/reservation/:reservationId', verifyToken, getPaymentsByReservation);
router.post('/', verifyToken, authorize('admin', 'manager', 'receptionist', 'accountant'), createPayment);
router.get('/:id', verifyToken, getPayment);
router.post('/:id/refund', verifyToken, authorize('admin', 'manager', 'accountant'), refundPayment);

module.exports = router;