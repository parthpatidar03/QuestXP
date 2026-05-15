/**
 * Centralized logger — Winston with:
 *  - Structured JSON in production (machine-readable for any log aggregator)
 *  - Pretty colorized output in development
 *  - File transports (error.log, combined.log) with rotation by size
 *  - Sensitive-field masking (password, token, secret, authorization, ...)
 *  - Per-subsystem prefixes (AUTH, DB, AI, API, ...)
 *
 * Every log line carries: timestamp, level, prefix, message, and any extra
 * metadata (requestId, userId, method, path, etc.).
 */

const fs = require('fs');
const path = require('path');
const winston = require('winston');
const { format, transports } = winston;

const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
} catch (e) {
    // Read-only FS (Azure App Service consumption tier, etc.) — fall back to
    // console-only. Don't crash the process.
    // eslint-disable-next-line no-console
    console.warn('[logger] Could not create log dir, falling back to console only:', e.message);
}

const SENSITIVE_KEYS = [
    'password', 'pass', 'passwd',
    'token', 'accesstoken', 'refreshtoken', 'idtoken', 'credential',
    'apikey', 'api_key', 'secret', 'authorization', 'auth',
    'cookie', 'set-cookie',
    'jwt_secret', 'jwt_refresh_secret',
];

const isSensitiveKey = (key) => {
    const k = String(key).toLowerCase();
    return SENSITIVE_KEYS.some(s => k.includes(s));
};

const maskSensitive = format((info) => {
    const mask = (obj, depth = 0) => {
        if (depth > 6) return '[depth limit]';
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(v => mask(v, depth + 1));

        const out = {};
        for (const key of Object.keys(obj)) {
            if (isSensitiveKey(key)) {
                out[key] = '[REDACTED]';
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                out[key] = mask(obj[key], depth + 1);
            } else {
                out[key] = obj[key];
            }
        }
        return out;
    };

    if (info.message && typeof info.message === 'object') {
        info.message = mask(info.message);
    }
    for (const key of Object.keys(info)) {
        if (!['level', 'message', 'timestamp', 'stack'].includes(key) && typeof info[key] === 'object') {
            info[key] = mask(info[key]);
        }
    }
    return info;
});

const prettyFormat = format.printf(({ level, message, timestamp, prefix, stack, ...meta }) => {
    const pfx = prefix ? `[${prefix}] ` : '';
    const msg = typeof message === 'object' ? JSON.stringify(message) : message;
    const stackStr = stack ? `\n${stack}` : '';
    const cleanMeta = { ...meta };
    delete cleanMeta.service;
    const metaStr = Object.keys(cleanMeta).length ? ` ${JSON.stringify(cleanMeta)}` : '';
    return `${timestamp} ${level}: ${pfx}${msg}${metaStr}${stackStr}`;
});

const isProd = process.env.NODE_ENV === 'production';

const baseFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    format.errors({ stack: true }),
    maskSensitive(),
);

const consoleFormat = isProd
    ? format.combine(baseFormat, format.json())
    : format.combine(baseFormat, format.colorize(), prettyFormat);

const fileFormat = format.combine(baseFormat, format.json());

const fileTransports = [];
try {
    if (fs.existsSync(LOG_DIR)) {
        fileTransports.push(
            new transports.File({
                filename: path.join(LOG_DIR, 'error.log'),
                level: 'error',
                maxsize: 10 * 1024 * 1024, // 10MB
                maxFiles: 5,
                format: fileFormat,
            }),
            new transports.File({
                filename: path.join(LOG_DIR, 'combined.log'),
                maxsize: 10 * 1024 * 1024,
                maxFiles: 5,
                format: fileFormat,
            }),
        );
    }
} catch (_) { /* fall back to console only */ }

const logger = winston.createLogger({
    level: isProd ? 'info' : 'debug',
    defaultMeta: { service: 'questxp-api' },
    transports: [
        new transports.Console({ format: consoleFormat }),
        ...fileTransports,
    ],
    // Don't crash the process on logging errors.
    exitOnError: false,
});

const createLogger = (prefix) => ({
    info:  (msg, meta = {}) => logger.info(msg,  { prefix, ...meta }),
    error: (msg, meta = {}) => logger.error(msg, { prefix, ...meta }),
    warn:  (msg, meta = {}) => logger.warn(msg,  { prefix, ...meta }),
    debug: (msg, meta = {}) => logger.debug(msg, { prefix, ...meta }),
    // Convenience helper for HTTP request context.
    http:  (msg, meta = {}) => logger.info(msg,  { prefix, level_tag: 'http', ...meta }),
});

module.exports = {
    logger,
    createLogger,
    serverLogger:    createLogger('SERVER'),
    authLogger:      createLogger('AUTH'),
    dbLogger:        createLogger('DB'),
    apiLogger:       createLogger('API'),
    playlistLogger:  createLogger('PLAYLIST'),
    aiLogger:        createLogger('AI'),
    jobLogger:       createLogger('JOB'),
    geoLogger:       createLogger('GEO'),
    securityLogger:  createLogger('SECURITY'),
    clientLogger:    createLogger('CLIENT'),
};
