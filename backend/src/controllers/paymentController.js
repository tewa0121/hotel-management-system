const { pool } = require('../config/database');
const Payment = require('../models/Payment');
const Reservation = require('../models/Reservation');
const Guest = require('../models/Guest');
const { validatePayment } = require('../utils/validators');
const { logActivity } = require('../middleware/auth');

// Get all payments
const getPayments = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status || '';

        const result = await Payment.findAll(page, limit, status);

        res.json({
            success: true,
            data: result.data,
            pagination: {
                page,
                limit,
                total: result.total,
                totalPages: Math.ceil(result.total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payments'
        });
    }
};

// Get payments by reservation
const getPaymentsByReservation = async (req, res) => {
    try {
        const payments = await Payment.findByReservation(req.params.reservationId);
        res.json({
            success: true,
            data: payments
        });
    } catch (error) {
        console.error('Error fetching reservation payments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reservation payments'
        });
    }
};

// Create payment
const createPayment = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const validation = validatePayment(req.body);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }

        const {
            reservation_id, guest_id, amount, currency,
            payment_method, reference_number, status, notes
        } = req.body;

        const reservation = await Reservation.findById(reservation_id);
        if (!reservation) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        const newDepositPaid = Number(reservation.deposit_paid) + Number(amount);
        const newBalance = Number(reservation.total_amount) - newDepositPaid;
        const paymentStatus = newBalance <= 0 ? 'paid' : (newDepositPaid > 0 ? 'partial' : 'pending');

        const paymentData = {
            reservation_id,
            guest_id,
            amount,
            currency: currency || 'USD',
            payment_method,
            reference_number: reference_number || null,
            status: status || 'completed',
            received_by: req.user.id,
            notes: notes || null
        };

        const payment = await Payment.create(paymentData);

        await Reservation.update(reservation_id, {
            ...reservation,
            deposit_paid: newDepositPaid,
            balance: newBalance,
            payment_status: paymentStatus
        });

        await Guest.updateSpent(guest_id, amount);

        await connection.commit();

        await logActivity(
            req.user.id,
            'CREATE',
            'payment',
            payment.id,
            null,
            payment,
            req.ip
        );

        res.status(201).json({
            success: true,
            message: 'Payment recorded successfully',
            data: payment
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error recording payment'
        });
    } finally {
        connection.release();
    }
};

// Get single payment
const getPayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }
        res.json({
            success: true,
            data: payment
        });
    } catch (error) {
        console.error('Error fetching payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment'
        });
    }
};

// ✅ FINAL FIX: Refund using direct SQL with CAST
const refundPayment = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const paymentId = req.params.id;
        const { reason } = req.body;

        console.log('=========================================');
        console.log(`📤 REFUNDING PAYMENT ${paymentId}`);

        // ✅ 1. Get payment
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        console.log('📊 Payment:', { 
            id: payment.id, 
            amount: payment.amount, 
            status: payment.status,
            reservation_id: payment.reservation_id 
        });

        // ✅ 2. Validate payment
        if (payment.status === 'refunded') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Payment already refunded'
            });
        }

        if (payment.status !== 'completed') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Only completed payments can be refunded'
            });
        }

        // ✅ 3. Get reservation
        const reservation = await Reservation.findById(payment.reservation_id);
        if (!reservation) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        console.log('📊 Reservation:', { 
            id: reservation.id, 
            deposit_paid: reservation.deposit_paid,
            balance: reservation.balance,
            total_amount: reservation.total_amount 
        });

        // ✅ 4. Update payment status
        await connection.execute(
            `UPDATE payments SET 
                status = 'refunded',
                notes = CONCAT(IFNULL(notes, ''), ?)
            WHERE id = ?`,
            [` Refunded: ${reason || 'No reason provided'}`, paymentId]
        );

        // ✅ 5. ✅✅✅ THE FIX: Use CAST in SQL to ensure proper decimal handling
        // This forces MySQL to treat the values as decimals, not strings
        await connection.execute(
            `UPDATE reservations SET 
                deposit_paid = CAST(CAST(deposit_paid AS DECIMAL(10,2)) - CAST(? AS DECIMAL(10,2)) AS DECIMAL(10,2)),
                balance = CAST(CAST(balance AS DECIMAL(10,2)) + CAST(? AS DECIMAL(10,2)) AS DECIMAL(10,2)),
                payment_status = ?
            WHERE id = ?`,
            [
                payment.amount,  // subtracted from deposit_paid
                payment.amount,  // added to balance
                'pending',       // payment_status
                reservation.id
            ]
        );

        await connection.commit();

        await logActivity(
            req.user.id,
            'REFUND',
            'payment',
            paymentId,
            { status: payment.status },
            { status: 'refunded', reason },
            req.ip
        );

        console.log('✅✅✅ REFUND SUCCESSFUL');
        console.log('=========================================');

        res.json({
            success: true,
            message: 'Payment refunded successfully'
        });
    } catch (error) {
        await connection.rollback();
        console.error('❌ Refund error:', error);
        console.error('Message:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error refunding payment',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

module.exports = {
    getPayments,
    getPaymentsByReservation,
    createPayment,
    getPayment,
    refundPayment
};