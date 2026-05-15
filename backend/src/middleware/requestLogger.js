const { apiLogger } = require('../utils/logger');

/**
 * Structured HTTP request/response logger.
 *  - Logs at response FINISH (so we know status + duration).
 *  - Skips noisy/sensitive paths (/api/health, /api/logs/client).
 *  - Carries requestId so it can be correlated with errors.
 *  - In dev, includes the body (sensitive fields masked by Winston).
 */

const SKIP_PREFIXES = ['/api/health', '/api/logs/client'];

const shouldSkip = (url) => SKIP_PREFIXES.some(p => url === p || url.startsWith(`${p}?`));

const requestLogger = (req, res, next) => {
    const start = process.hrtime.bigint();

    const onDone = () => {
        res.removeListener('finish', onDone);
        res.removeListener('close', onDone);

        const url = req.originalUrl || req.url;
        if (shouldSkip(url)) return;

        const durationMs = Number((process.hrtime.bigint() - start) / 1_000_000n);
        const meta = {
            requestId: req.requestId,
            method: req.method,
            url,
            status: res.statusCode,
            durationMs,
            userId: req.user?._id?.toString() || null,
            ip: req.ip,
            ua: req.get('user-agent') || null,
        };

        if (process.env.NODE_ENV !== 'production') {
            meta.body = req.body;
            meta.query = req.query;
        }

        const lvl = res.statusCode >= 500 ? 'error'
                  : res.statusCode >= 400 ? 'warn'
                  : 'info';
        apiLogger[lvl](`${req.method} ${url} → ${res.statusCode} (${durationMs}ms)`, meta);
    };

    res.on('finish', onDone);
    res.on('close', onDone);
    next();
};

module.exports = requestLogger;
