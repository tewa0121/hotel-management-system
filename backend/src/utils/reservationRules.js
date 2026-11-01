// Pure functions (no database) that hold the reservation business rules.
// Dates are handled as plain 'YYYY-MM-DD' strings on purpose: that avoids every
// time-zone surprise you get from JavaScript Date objects.

// A reservation in one of these statuses occupies its room for its dates
const BLOCKING_STATUSES = ['pending', 'confirmed', 'checked_in'];

// Reservations in these statuses are finished and can no longer be edited
const CLOSED_STATUSES = ['cancelled', 'checked_out', 'no_show'];

const VALID_SOURCES = [
    'direct', 'website', 'phone', 'walk_in',
    'travel_agent', 'booking_platform', 'corporate', 'other'
];

const MAX_NIGHTS = 365;

const MONEY_FIELDS = {
    rate: 'Rate',
    discount: 'Discount',
    tax: 'Tax',
    total_amount: 'Total amount',
    deposit_paid: 'Deposit'
};

const pad = (n) => String(n).padStart(2, '0');

// Today's date on the server, as 'YYYY-MM-DD'
const todayString = (now = new Date()) =>
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

// True only for real calendar dates written as YYYY-MM-DD (so '2026-02-30' is rejected)
const isValidDateString = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

// Whole nights between two YYYY-MM-DD dates
const nightsBetween = (checkIn, checkOut) => {
    const [y1, m1, d1] = checkIn.split('-').map(Number);
    const [y2, m2, d2] = checkOut.split('-').map(Number);
    return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
};

const isBlank = (value) => value === undefined || value === null || value === '';

const isNumberLike = (value) => typeof value === 'number' || typeof value === 'string';

const isPositiveInt = (value) =>
    isNumberLike(value) && value !== '' && Number.isInteger(Number(value)) && Number(value) > 0;

const isNonNegativeNumber = (value) =>
    isNumberLike(value) && value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0;

const round2 = (n) => Math.round(n * 100) / 100;

// ============================================
// Validate the data of a new or edited reservation.
// Returns a list of error messages (empty list = valid).
//
//   create : pass only `data`
//   update : pass `{ existing }` - only the fields that were sent are checked,
//            the rest is taken from the existing reservation
// ============================================
const validateReservationInput = (data, { existing = null, today = todayString() } = {}) => {
    const errors = [];
    const isUpdate = Boolean(existing);

    // ---- guest and room ----
    if (!isUpdate) {
        if (!isPositiveInt(data.guest_id)) errors.push('Guest ID is required');
        if (!isPositiveInt(data.room_id)) errors.push('Room ID is required');
    } else {
        if (data.guest_id !== undefined && !isPositiveInt(data.guest_id)) errors.push('Guest ID is invalid');
        if (data.room_id !== undefined && !isPositiveInt(data.room_id)) errors.push('Room ID is invalid');
    }

    // ---- dates ----
    const checkIn = data.check_in_date !== undefined ? data.check_in_date : existing?.check_in_date;
    const checkOut = data.check_out_date !== undefined ? data.check_out_date : existing?.check_out_date;
    let datesAreValid = true;

    const checkDate = (value, sent, label) => {
        if (isUpdate && !sent) return;
        if (isBlank(value)) {
            errors.push(`${label} date is required`);
            datesAreValid = false;
        } else if (!isValidDateString(value)) {
            errors.push(`${label} date must be a valid date (YYYY-MM-DD)`);
            datesAreValid = false;
        }
    };
    checkDate(data.check_in_date, data.check_in_date !== undefined, 'Check-in');
    checkDate(data.check_out_date, data.check_out_date !== undefined, 'Check-out');

    if (datesAreValid && isValidDateString(checkIn) && isValidDateString(checkOut)) {
        const nights = nightsBetween(checkIn, checkOut);

        if (nights <= 0) {
            errors.push('Check-out date must be after check-in date');
        } else if (nights > MAX_NIGHTS) {
            errors.push(`A stay cannot be longer than ${MAX_NIGHTS} nights`);
        }

        // A past check-in is only rejected when it is new or is being changed
        // (an edit that does not send the check-in date leaves it as it was)
        const checkInChanged = !isUpdate
            || (data.check_in_date !== undefined && data.check_in_date !== existing.check_in_date);
        if (checkInChanged && checkIn < today) {
            errors.push('Check-in date cannot be in the past');
        }
    }

    // ---- guests ----
    if (!isBlank(data.adults) && !(Number.isInteger(Number(data.adults)) && Number(data.adults) >= 1)) {
        errors.push('At least 1 adult is required');
    }
    if (!isBlank(data.children) && !(Number.isInteger(Number(data.children)) && Number(data.children) >= 0)) {
        errors.push('Children must be 0 or more');
    }

    // ---- money ----
    for (const [field, label] of Object.entries(MONEY_FIELDS)) {
        if (!isBlank(data[field]) && !isNonNegativeNumber(data[field])) {
            errors.push(`${label} must be a number that is not negative`);
        }
    }

    const total = !isBlank(data.total_amount) ? Number(data.total_amount) : Number(existing?.total_amount || 0);
    const deposit = !isBlank(data.deposit_paid) ? Number(data.deposit_paid) : Number(existing?.deposit_paid || 0);
    if (Number.isFinite(total) && Number.isFinite(deposit) && deposit - total > 0.005) {
        errors.push('Deposit cannot be more than the total amount');
    }

    // ---- other fields ----
    if (!isBlank(data.source) && !VALID_SOURCES.includes(data.source)) {
        errors.push('Invalid booking source');
    }
    for (const field of ['notes', 'special_requests']) {
        if (data[field] !== undefined && data[field] !== null && typeof data[field] !== 'string') {
            errors.push(`${field === 'notes' ? 'Notes' : 'Special requests'} must be text`);
        }
    }

    return errors;
};

// Validate the two dates of an availability search
const validateSearchDates = (checkIn, checkOut) => {
    if (isBlank(checkIn) || isBlank(checkOut)) {
        return ['Check-in and check-out dates are required'];
    }
    if (!isValidDateString(checkIn) || !isValidDateString(checkOut)) {
        return ['Dates must be valid dates (YYYY-MM-DD)'];
    }
    if (nightsBetween(checkIn, checkOut) <= 0) {
        return ['Check-out date must be after check-in date'];
    }
    return [];
};

// Balance and payment status are always derived from total and deposit
const computeFinancials = ({ total_amount, deposit_paid }) => {
    const total = Number(total_amount) || 0;
    const deposit = Number(deposit_paid) || 0;

    let payment_status = 'pending';
    if (deposit > 0) {
        payment_status = deposit >= total ? 'paid' : 'partial';
    }

    return { balance: round2(total - deposit), payment_status };
};

module.exports = {
    BLOCKING_STATUSES,
    CLOSED_STATUSES,
    VALID_SOURCES,
    MAX_NIGHTS,
    todayString,
    isValidDateString,
    nightsBetween,
    validateReservationInput,
    validateSearchDates,
    computeFinancials
};