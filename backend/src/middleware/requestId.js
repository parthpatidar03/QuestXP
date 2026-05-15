const crypto = require('crypto');

/**
 * Attach a short request ID to every request and echo it in `X-Request-Id`.
 * Lets you correlate a frontend error report with a server-side log line —
 * the frontend client logger forwards this header back.
 */
const requestId = (req, res, next) => {
    const incoming = req.headers['x-request-id'];
    const id = (typeof incoming === 'string' && /^[a-zA-Z0-9-]{6,64}$/.test(incoming))
        ? incoming
        : crypto.randomBytes(8).toString('hex');
    req.requestId = id;
    res.setHeader('X-Request-Id', id);
    next();
};

module.exports = requestId;
