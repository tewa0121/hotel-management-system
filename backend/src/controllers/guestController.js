const bcrypt = require('bcryptjs');
const Guest = require('../models/Guest');
const { validateGuest } = require('../utils/validators');
const { logActivity } = require('../middleware/auth');

const SALT_ROUNDS = 10;
const PASSWORD_MIN_LENGTH = 6;

// These are the fields validateGuest() looks at
const VALIDATED_FIELDS = ['first_name', 'last_name', 'phone', 'email', 'date_of_birth'];

// Known-valid stand-ins, used on updates for fields the request did not send.
// This way editing only the notes of an older guest is not blocked by an
// old (invalid) phone number that the request never touched.
const PLACEHOLDERS = {
    first_name: 'Valid',
    last_name: 'Valid',
    phone: '0900000000',
    email: 'valid@gmail.com'
};

// audit_logs.user_id points to the staff `users` table, so guests are logged as NULL
const actorId = (req) => (req.user && req.user.role !== 'guest' ? req.user.id : null);

// Trim the validated text fields (numbers etc. are turned into text first)
const cleanBody = (body = {}) => {
    const clean = { ...body };
    for (const field of VALIDATED_FIELDS) {
        if (clean[field] !== undefined && clean[field] !== null) {
            clean[field] = String(clean[field]).trim();
        }
    }
    return clean;
};

// Returns a list of error messages (an empty list means the data is valid).
// partial = true  -> update: only the fields that were sent are checked
const getGuestErrors = (data, { partial = false } = {}) => {
    let toValidate = data;

    if (partial) {
        toValidate = { ...PLACEHOLDERS };
        for (const field of VALIDATED_FIELDS) {
            if (data[field] !== undefined) {
                toValidate[field] = data[field];
            }
        }
    }

    const { errors } = validateGuest(toValidate);

    if (data.password !== undefined && data.password !== null && data.password !== ''
        && String(data.password).length < PASSWORD_MIN_LENGTH) {
        errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
    }

    return errors;
};

const validationFailed = (res, errors) => res.status(400).json({
    success: false,
    message: errors.join(', '),
    errors
});

// ============================================
// GET /api/guests
// ============================================
const getGuests = async (req, res) => {
    try {
        const search = typeof req.query.search === 'string' ? req.query.search : '';
        const result = await Guest.findAll(req.query.page, req.query.limit, search);

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
        console.error('Error fetching guests:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching guests'
        });
    }
};

// ============================================
// GET /api/guests/:id
// ============================================
const getGuest = async (req, res) => {
    try {
        const guest = await Guest.findById(req.params.id);

        if (!guest) {
            return res.status(404).json({
                success: false,
                message: 'Guest not found'
            });
        }

        res.json({
            success: true,
            data: Guest.sanitize(guest)
        });
    } catch (error) {
        console.error('Error fetching guest:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching guest'
        });
    }
};

// ============================================
// POST /api/guests
// ============================================
const createGuest = async (req, res) => {
    try {
        const body = cleanBody(req.body);

        const errors = getGuestErrors(body);
        if (errors.length > 0) {
            return validationFailed(res, errors);
        }

        const existing = await Guest.findByEmail(body.email);
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists. Please use a different email.'
            });
        }

        // The portal password is stored as a bcrypt hash, never as plain text
        const data = { ...body };
        if (body.password) {
            data.password = await bcrypt.hash(String(body.password), SALT_ROUNDS);
        } else {
            delete data.password;
        }

        const guest = Guest.sanitize(await Guest.create(data));

        await logActivity(actorId(req), 'CREATE', 'guest', guest.id, null, guest, req.ip);

        res.status(201).json({
            success: true,
            message: 'Guest created successfully',
            data: guest
        });
    } catch (error) {
        console.error('Error creating guest:', error.message);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Email already exists. Please use a different email.'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error creating guest'
        });
    }
};

// ============================================
// PUT /api/guests/:id  (partial updates allowed)
// ============================================
const updateGuest = async (req, res) => {
    try {
        const existing = await Guest.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Guest not found'
            });
        }

        const body = cleanBody(req.body);

        const hasChanges = Guest.UPDATABLE_FIELDS.some(field => body[field] !== undefined)
            || (body.password !== undefined && body.password !== '');
        if (!hasChanges) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        const errors = getGuestErrors(body, { partial: true });
        if (errors.length > 0) {
            return validationFailed(res, errors);
        }

        // Only look for a duplicate when the email is really changing
        if (body.email && body.email.toLowerCase() !== String(existing.email || '').toLowerCase()) {
            const duplicate = await Guest.findByEmail(body.email);
            if (duplicate && duplicate.id !== existing.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists. Please use a different email.'
                });
            }
        }

        // Only change the password when a new one was sent; always store it hashed
        const data = { ...body };
        if (body.password) {
            data.password = await bcrypt.hash(String(body.password), SALT_ROUNDS);
        } else {
            delete data.password;
        }

        const updated = Guest.sanitize(await Guest.update(req.params.id, data));

        await logActivity(actorId(req), 'UPDATE', 'guest', updated.id, Guest.sanitize(existing), updated, req.ip);

        res.json({
            success: true,
            message: 'Guest updated successfully',
            data: updated
        });
    } catch (error) {
        console.error('Error updating guest:', error.message);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Email already exists. Please use a different email.'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error updating guest'
        });
    }
};

// ============================================
// DELETE /api/guests/:id
// ============================================
const deleteGuest = async (req, res) => {
    try {
        const guest = await Guest.findById(req.params.id);
        if (!guest) {
            return res.status(404).json({
                success: false,
                message: 'Guest not found'
            });
        }

        await Guest.delete(req.params.id);

        await logActivity(actorId(req), 'DELETE', 'guest', guest.id, Guest.sanitize(guest), null, req.ip);

        res.json({
            success: true,
            message: 'Guest deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting guest:', error.message);
        // MySQL reports a blocked delete (reservations, payments, invoices or orders
        // point at this guest) as ER_ROW_IS_REFERENCED_2
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete guest with existing reservations or orders'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error deleting guest'
        });
    }
};

module.exports = {
    getGuests,
    getGuest,
    createGuest,
    updateGuest,
    deleteGuest
};