const ApiError = require('./ApiError');
const { createNotification } = require('../routes/notificationRoutes');

// audit_logs.user_id, notifications.user_id and "received_by" columns point to the
// staff `users` table, so a guest-portal login must never be written there.
const actorId = (req) => (req.user && req.user.role !== 'guest' ? req.user.id : null);

// Turns any error into a clean JSON response.
//  - ApiError  -> its own status code and message
//  - anything else -> logged on the server, and a generic 500 is sent
//    (the real error message and stack trace are never sent to the browser)
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

// A failed notification must never turn a successful action into an error
const notify = async (req, message, type, link = null) => {
    const userId = actorId(req);
    if (userId === null) return;

    try {
        await createNotification(userId, message, type, link);
    } catch (error) {
        console.error('Error creating notification:', error.message);
    }
};

module.exports = { actorId, handleError, notify };