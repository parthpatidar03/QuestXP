const { logger } = require('../utils/logger');

/**
 * Centralised error responder & logger.
 *  - Every error is logged with full context (request id, method, path, user,
 *    status, error name + message + stack, sanitized body).
 *  - In production we NEVER leak stack traces or raw error messages for 500s.
 *  - express-validator errors are returned as 400 with `details`.
 */
const errorMiddleware = (err, req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const isProd = process.env.NODE_ENV === 'production';

    // Build a structured context — gets recorded to both file and console
    // (and any external log aggregator if you bolt one onto Winston later).
    const logContext = {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl || req.path,
        status,
        userId: req.user?._id?.toString() || 'anonymous',
        userAgent: req.get?.('user-agent'),
        ip: req.ip,
        errorName: err.name,
        errorMessage: err.message,
        errorCode: err.code,
        // Sensitive fields (password, token, etc.) are masked by the logger
        // formatter, so it's safe to include the body for debugging.
        body: req.body,
        query: req.query,
        params: req.params,
        stack: err.stack,
    };

    const level = status >= 500 ? 'error' : 'warn';
    logger[level](`HTTP ${status} ${req.method} ${req.originalUrl || req.path}`, logContext);

    // express-validator
    if (err.array && typeof err.array === 'function') {
        return res.status(400).json({
            error: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: err.array(),
            requestId: req.requestId,
        });
    }

    // Mongo cast errors → 400
    if (err.name === 'CastError') {
        return res.status(400).json({
            error: 'INVALID_ID',
            message: 'Invalid resource id',
            requestId: req.requestId,
        });
    }

    // Mongo duplicate key → 409
    if (err.code === 11000) {
        return res.status(409).json({
            error: 'DUPLICATE',
            message: 'Resource already exists',
            requestId: req.requestId,
        });
    }

    res.status(status).json({
        error: err.name || 'INTERNAL_SERVER_ERROR',
        message: isProd && status >= 500 ? 'An unexpected error occurred' : err.message,
        details: !isProd ? err.stack : undefined,
        requestId: req.requestId,
    });
};

module.exports = errorMiddleware;
