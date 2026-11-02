// Pure functions (no database) that hold the payment business rules.
//
// Money is calculated in WHOLE CENTS (integers) so that results like
// 0.1 + 0.2 = 0.30000000000000004 can never put a balance off by a fraction.

const PAYMENT_METHODS = ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'mobile_money', 'other'];

// Statuses a payment can be recorded with. "refunded" is only ever set by the refund action.
const CREATE_STATUSES = ['pending', 'completed', 'failed'];

// Payments can be taken for these reservations only
const PAYABLE_RESERVATION_STATUSES = ['pending', 'confirmed', 'checked_in', 'checked_out'];

// payments.amount is DECIMAL(10,2): the largest value is 99,999,999.99
const MAX_AMOUNT_CENTS = 9999999999;

const isBlank = (value) => value === undefined || value === null || value === '';

const isPositiveInt = (value) =>
    (typeof value === 'number' || typeof value === 'string')
    && value !== ''
    && Number.isInteger(Number(value))
    && Number(value) > 0;

// '604.80' / 604.8 -> 60480.  Returns null for anything that is not a positive amount
// with at most 2 decimals (so '10.999', '-5', 'abc', '1e5' and 0 are all rejected).
const parseAmountToCents = (value) => {
    if (typeof value !== 'number' && typeof value !== 'string') return null;

    const text = String(value).trim();
    if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;

    const cents = Math.round(Number(text) * 100);
    return cents > 0 && cents <= MAX_AMOUNT_CENTS ? cents : null;
};

// A DECIMAL value read from the database ('404.80') -> 40480
const moneyToCents = (value) => Math.round((Number(value) || 0) * 100);

const centsToMoney = (cents) => cents / 100;

const formatMoney = (cents) => (cents / 100).toFixed(2);

// How much of the reservation is still unpaid, in cents
const getBalanceCents = (reservation) =>
    moneyToCents(reservation.total_amount) - moneyToCents(reservation.deposit_paid);

// Returns a list of error messages (an empty list means the data is valid)
const validatePaymentInput = (data) => {
    const errors = [];

    if (!isPositiveInt(data.reservation_id)) {
        errors.push('Reservation ID is required');
    }
    if (!isPositiveInt(data.guest_id)) {
        errors.push('Guest ID is required');
    }

    if (isBlank(data.amount)) {
        errors.push('Valid amount is required');
    } else if (parseAmountToCents(data.amount) === null) {
        errors.push('Amount must be more than 0, with at most 2 decimals');
    }

    if (isBlank(data.payment_method)) {
        errors.push('Payment method is required');
    } else if (!PAYMENT_METHODS.includes(data.payment_method)) {
        errors.push('Invalid payment method');
    }

    if (!isBlank(data.currency) && !(typeof data.currency === 'string' && /^[A-Za-z]{3}$/.test(data.currency))) {
        errors.push('Currency must be a 3-letter code (for example USD)');
    }

    if (!isBlank(data.status) && !CREATE_STATUSES.includes(data.status)) {
        errors.push(data.status === 'refunded'
            ? 'Use the refund action to refund a payment'
            : 'Status must be pending, completed or failed');
    }

    if (!isBlank(data.reference_number)
        && !(typeof data.reference_number === 'string' && data.reference_number.length <= 100)) {
        errors.push('Reference number must be text of at most 100 characters');
    }

    if (!isBlank(data.notes) && !(typeof data.notes === 'string' && data.notes.length <= 1000)) {
        errors.push('Notes must be text of at most 1000 characters');
    }

    return errors;
};

module.exports = {
    PAYMENT_METHODS,
    CREATE_STATUSES,
    PAYABLE_RESERVATION_STATUSES,
    MAX_AMOUNT_CENTS,
    parseAmountToCents,
    moneyToCents,
    centsToMoney,
    formatMoney,
    getBalanceCents,
    validatePaymentInput
};