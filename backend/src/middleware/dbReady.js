const mongoose = require('mongoose');
const { dbLogger } = require('../utils/logger');

/**
 * dbReady — short-circuit DB-dependent requests when Mongo is not connected.
 *
 * Without this, requests would either hang for ~30s while mongoose tries to
 * select a server, or (with bufferCommands enabled) sit in a queue forever.
 *
 * readyState values:
 *   0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
 */
const dbReady = (req, res, next) => {
    const state = mongoose.connection.readyState;
    if (state === 1) return next();

    dbLogger.warn('Request rejected — DB not ready', {
        requestId: req.requestId,
        path: req.originalUrl || req.path,
        state,
    });

    return res.status(503).json({
        error: 'DATABASE_UNAVAILABLE',
        message: 'Server is starting or the database is temporarily unavailable. Please try again in a moment.',
        requestId: req.requestId,
        retryAfter: 5,
    });
};

module.exports = dbReady;
