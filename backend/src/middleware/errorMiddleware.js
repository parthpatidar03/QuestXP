const { logger } = require('../utils/logger');

const errorMiddleware = (err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    const isProd = process.env.NODE_ENV === 'production';

    // Log the error using the centralized logger
    logger.error(err.message, {
        prefix: 'ERROR',
        method: req.method,
        path: req.path,
        status,
        stack: !isProd ? err.stack : undefined,
        user: req.user?._id || 'unauthenticated',
        body: req.body, // The logger utility masks sensitive fields automatically
    });

    // Validation Errors from Express Validator
    if (err.array && typeof err.array === 'function') {
        return res.status(400).json({
            error: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: err.array()
        });
    }

    // Default Error Response
    res.status(status).json({
        error: err.name || 'INTERNAL_SERVER_ERROR',
        message: isProd && status === 500 ? 'An unexpected error occurred' : err.message,
        details: !isProd ? err.stack : undefined
    });
};

module.exports = errorMiddleware;
