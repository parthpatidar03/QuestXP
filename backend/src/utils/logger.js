const winston = require('winston');
const { format, transports } = winston;

// Mask sensitive data
const maskSensitive = format((info) => {
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'authorization'];
    
    const mask = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(mask);
        
        const newObj = { ...obj };
        for (const key of Object.keys(newObj)) {
            if (sensitiveKeys.some(sKey => key.toLowerCase().includes(sKey.toLowerCase()))) {
                newObj[key] = '[REDACTED]';
            } else if (typeof newObj[key] === 'object') {
                newObj[key] = mask(newObj[key]);
            }
        }
        return newObj;
    };

    if (info.message && typeof info.message === 'object') {
        info.message = mask(info.message);
    }
    
    // Also mask metadata
    for (const key of Object.keys(info)) {
        if (key !== 'level' && key !== 'message' && key !== 'timestamp' && typeof info[key] === 'object') {
            info[key] = mask(info[key]);
        }
    }

    return info;
});

const myFormat = format.printf(({ level, message, timestamp, prefix, ...meta }) => {
    const pfx = prefix ? `[${prefix}] ` : '';
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} ${level}: ${pfx}${typeof message === 'object' ? JSON.stringify(message) : message} ${metaStr}`;
});

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: format.combine(
        maskSensitive(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        format.errors({ stack: true }),
        process.env.NODE_ENV === 'production' ? format.json() : format.combine(format.colorize(), myFormat)
    ),
    transports: [
        new transports.Console()
    ]
});

// Utility to create pre-fixed loggers
const createLogger = (prefix) => {
    return {
        info: (msg, meta = {}) => logger.info(msg, { prefix, ...meta }),
        error: (msg, meta = {}) => logger.error(msg, { prefix, ...meta }),
        warn: (msg, meta = {}) => logger.warn(msg, { prefix, ...meta }),
        debug: (msg, meta = {}) => logger.debug(msg, { prefix, ...meta }),
    };
};

module.exports = {
    logger,
    createLogger,
    serverLogger: createLogger('SERVER'),
    authLogger: createLogger('AUTH'),
    dbLogger: createLogger('DB'),
    apiLogger: createLogger('API'),
    playlistLogger: createLogger('PLAYLIST'),
    aiLogger: createLogger('AI'),
    jobLogger: createLogger('JOB'),
    geoLogger: createLogger('GEO-BLOCK')
};
