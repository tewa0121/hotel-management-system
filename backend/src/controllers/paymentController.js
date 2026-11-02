const Payment = require('../models/Payment');
const Reservation = require('../models/Reservation');
const ApiError = require('../utils/ApiError');
const rules = require('../utils/paymentRules');
const { withTransaction } = require('../utils/transaction');
const { logActivity } = require('../middleware/auth');
const { actorId, handleError, notify } = require('../utils/controllerHelpers');

// ============================================
// LOCKING RULES
//
// A payment and a refund both change the reservation's balance, so both run in ONE
// transaction and lock the RESERVATION first (then the payment). Two payments for
// the same reservation therefore run one after the other and each sees the balance
// left by the previous one, instead of both starting from the same old balance.
// ============================================

const statusLabel = (status) => String(status).replace('_', '-');

// ============================================
// GET /api/payments
// ============================================
const getPayments = async (req, res) => {
    try {
        const status = typeof req.query.status === 'string' ? req.query.status : '';
        const result = await Payment.findAll(req.query.page, req.query.limit, status);

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
        handleError(res, error, 'Error fetching payments');
    }
};

// ============================================
// GET /api/payments/reservation/:reservationId
// ============================================
const getPaymentsByReservation = async (req, res) => {
    try {
        const payments = await Payment.findByReservation(req.params.reservationId);
        res.json({
            success: true,
            data: payments
        });
    } catch (error) {
        handleError(res, error, 'Error fetching reservation payments');
    }
};

// ============================================
// GET /api/payments/:id
// ============================================
const getPayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            throw new ApiError(404, 'Payment not found');
        }
        res.json({
            success: true,
            data: payment
        });
    } catch (error) {
        handleError(res, error, 'Error fetching payment');
    }
};

// ============================================
// POST /api/payments
// ============================================
const createPayment = async (req, res) => {
    try {
        const body = req.body || {};

        const errors = rules.validatePaymentInput(body);
        if (errors.length > 0) {
            throw new ApiError(400, errors.join(', '), errors);
        }

        const amountCents = rules.parseAmountToCents(body.amount);
        const amount = rules.centsToMoney(amountCents);
        const status = body.status || 'completed';
        const baseCurrency = await Payment.getBaseCurrency();
        const currency = (body.currency || baseCurrency).toUpperCase();

        const payment = await withTransaction(async (connection) => {
            // Lock the reservation FIRST (see the locking rules at the top of this file)
            const reservation = await Reservation.findForUpdate(body.reservation_id, connection);
            if (!reservation) {
                throw new ApiError(404, 'Reservation not found');
            }
            if (reservation.guest_id !== Number(body.guest_id)) {
                throw new ApiError(400, 'Guest does not match this reservation');
            }
            if (!rules.PAYABLE_RESERVATION_STATUSES.includes(reservation.reservation_status)) {
                throw new ApiError(400, `Cannot record a payment for a ${statusLabel(reservation.reservation_status)} reservation`);
            }

            // Only a COMPLETED payment moves money. Pending and failed payments are just
            // recorded: they never change the balance or the guest's spending.
            if (status === 'completed') {
                if (currency !== baseCurrency) {
                    throw new ApiError(
                        400,
                        `Payments must be in ${baseCurrency}, the hotel currency set in Settings (no currency conversion is available)`
                    );
                }

                const balanceCents = rules.getBalanceCents(reservation);
                if (balanceCents <= 0) {
                    throw new ApiError(400, 'This reservation is already fully paid');
                }
                if (amountCents > balanceCents) {
                    throw new ApiError(
                        400,
                        `Payment (${rules.formatMoney(amountCents)}) is more than the remaining balance (${rules.formatMoney(balanceCents)})`
                    );
                }
            }

            const created = await Payment.create({
                reservation_id: reservation.id,
                guest_id: reservation.guest_id,
                amount,
                currency,
                payment_method: body.payment_method,
                reference_number: body.reference_number,
                status,
                received_by: actorId(req),
                notes: body.notes
            }, connection);

            if (status === 'completed') {
                const newDeposit = rules.centsToMoney(rules.moneyToCents(reservation.deposit_paid) + amountCents);

                // Reservation.update recalculates the balance and payment status.
                // The first payment also confirms a booking that was still pending.
                const changes = { deposit_paid: newDeposit };
                if (reservation.reservation_status === 'pending') {
                    changes.reservation_status = 'confirmed';
                }
                await Reservation.update(reservation.id, changes, connection);

                await Payment.adjustGuestTotalSpent(reservation.guest_id, amount, connection);
            }

            return { created, reservation };
        });

        await logActivity(actorId(req), 'CREATE', 'payment', payment.created.id, null, payment.created, req.ip);
        if (status === 'completed') {
            await notify(
                req,
                `Payment of ${currency} ${amount.toFixed(2)} received for reservation #${payment.reservation.reservation_number}`,
                'payment',
                `/payments/${payment.created.id}`
            );
        }

        res.status(201).json({
            success: true,
            message: 'Payment recorded successfully',
            data: payment.created
        });
    } catch (error) {
        handleError(res, error, 'Error recording payment');
    }
};

// ============================================
// POST /api/payments/:id/refund
// ============================================
const refundPayment = async (req, res) => {
    try {
        const reason = String((req.body && req.body.reason) || '').trim().slice(0, 500) || 'No reason provided';

        const result = await withTransaction(async (connection) => {
            // We need the reservation id to lock in the right order. It never changes
            // for a payment, so reading it first is safe; the status is re-checked below
            // on the locked row.
            const lookup = await Payment.findById(req.params.id, connection);
            if (!lookup) {
                throw new ApiError(404, `Payment with ID ${req.params.id} not found`);
            }

            // Reservation first, then the payment (same order as creating a payment)
            const reservation = await Reservation.findForUpdate(lookup.reservation_id, connection);
            const payment = await Payment.findForUpdate(lookup.id, connection);

            if (!payment) {
                throw new ApiError(404, `Payment with ID ${req.params.id} not found`);
            }
            if (payment.status === 'refunded') {
                throw new ApiError(400, 'Payment already refunded');
            }
            if (payment.status !== 'completed') {
                throw new ApiError(400, 'Only completed payments can be refunded');
            }
            if (!reservation) {
                throw new ApiError(404, 'Reservation not found');
            }

            const amountCents = rules.moneyToCents(payment.amount);
            const newDepositCents = Math.max(rules.moneyToCents(reservation.deposit_paid) - amountCents, 0);

            await Payment.markRefunded(payment.id, reason, connection);

            // Reservation.update recalculates the balance and payment status
            await Reservation.update(reservation.id, { deposit_paid: rules.centsToMoney(newDepositCents) }, connection);

            await Payment.adjustGuestTotalSpent(payment.guest_id, -rules.centsToMoney(amountCents), connection);

            return { payment, reservation };
        });

        await logActivity(
            actorId(req), 'REFUND', 'payment', result.payment.id,
            { status: 'completed' }, { status: 'refunded', reason }, req.ip
        );
        await notify(req, `Payment #${result.payment.id} refunded - ${reason}`, 'payment', `/payments/${result.payment.id}`);

        res.json({
            success: true,
            message: 'Payment refunded successfully'
        });
    } catch (error) {
        handleError(res, error, 'Error refunding payment');
    }
};

module.exports = {
    getPayments,
    getPaymentsByReservation,
    getPayment,
    createPayment,
    refundPayment
};