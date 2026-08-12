const Guest = require('../models/Guest');
const { validateGuest } = require('../utils/validators');
const { logActivity } = require('../middleware/auth');

// ============================================
// Get all guests
// ============================================
const getGuests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';

        const result = await Guest.findAll(page, limit, search);

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
        console.error('Error fetching guests:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching guests'
        });
    }
};

// ============================================
// Get single guest
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
            data: guest
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
// Create guest - WITH VALIDATION
// ============================================
const createGuest = async (req, res) => {
    try {
        console.log('📤 Creating guest:', req.body);
        
        // ✅ Validate guest data
        const validation = validateGuest(req.body);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }

        // ✅ Check if email already exists
        if (req.body.email) {
            const existing = await Guest.findByEmail(req.body.email);
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists. Please use a different email.'
                });
            }
        }

        // ✅ Check if phone already exists
        if (req.body.phone) {
            const existing = await Guest.findByPhone(req.body.phone);
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number already exists. Please use a different phone number.'
                });
            }
        }

        const guest = await Guest.create(req.body);

        await logActivity(
            req.user.id,
            'CREATE',
            'guest',
            guest.id,
            null,
            guest,
            req.ip
        );

        res.status(201).json({
            success: true,
            message: 'Guest created successfully',
            data: guest
        });
    } catch (error) {
        console.error('❌ Error creating guest:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating guest'
        });
    }
};

// ============================================
// Update guest - WITH VALIDATION
// ============================================
const updateGuest = async (req, res) => {
    try {
        const guestId = req.params.id;
        console.log(`📤 Updating guest ${guestId}`);
        console.log('📤 Request body:', req.body);

        // Check if guest exists
        const guest = await Guest.findById(guestId);
        if (!guest) {
            return res.status(404).json({
                success: false,
                message: 'Guest not found'
            });
        }

        // ✅ Validate guest data
        const validation = validateGuest(req.body);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                errors: validation.errors
            });
        }

        // ✅ Check if email already exists (if email is being changed)
        if (req.body.email && req.body.email !== guest.email) {
            const existing = await Guest.findByEmail(req.body.email);
            if (existing && existing.id !== parseInt(guestId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists. Please use a different email.'
                });
            }
        }

        // ✅ Check if phone already exists (if phone is being changed)
        if (req.body.phone && req.body.phone !== guest.phone) {
            const existing = await Guest.findByPhone(req.body.phone);
            if (existing && existing.id !== parseInt(guestId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number already exists. Please use a different phone number.'
                });
            }
        }

        const updated = await Guest.update(guestId, req.body);

        await logActivity(
            req.user.id,
            'UPDATE',
            'guest',
            updated.id,
            guest,
            updated,
            req.ip
        );

        console.log('✅ Guest updated successfully');

        res.json({
            success: true,
            message: 'Guest updated successfully',
            data: updated
        });
    } catch (error) {
        console.error('❌ Error updating guest:', error);
        console.error('❌ Error details:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error updating guest',
            error: error.message
        });
    }
};

// ============================================
// Delete guest
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

        await logActivity(
            req.user.id,
            'DELETE',
            'guest',
            req.params.id,
            guest,
            null,
            req.ip
        );

        res.json({
            success: true,
            message: 'Guest deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting guest:', error);
        if (error.code === 'ER_ROW_IS_REFERENCED') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete guest with existing reservations'
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