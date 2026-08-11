const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    let error = { ...err };
    error.message = err.message;

    // MySQL errors
    if (err.code === 'ER_DUP_ENTRY') {
        const message = 'Duplicate entry found';
        return res.status(400).json({
            success: false,
            message,
            code: err.code
        });
    }

    // Foreign key constraint
    if (err.code === 'ER_NO_REFERENCED_ROW') {
        const message = 'Referenced record not found';
        return res.status(400).json({
            success: false,
            message,
            code: err.code
        });
    }

    if (err.code === 'ER_ROW_IS_REFERENCED') {
        const message = 'Record is referenced and cannot be deleted';
        return res.status(400).json({
            success: false,
            message,
            code: err.code
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        return res.status(400).json({
            success: false,
            message
        });
    }

    // Default error
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;