const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_COOKIE = 'accessToken';
const REFRESH_TOKEN_COOKIE = 'refreshToken';
const LEGACY_TOKEN_COOKIE = 'token';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('JWT_SECRET is required in production');
        }
        return 'dev_secret';
    }
    return secret;
};

const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || getJwtSecret();

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const createAccessToken = (user, sessionId) => jwt.sign(
    {
        userId: user._id.toString(),
        email: user.email,
        sessionId: sessionId.toString(),
        type: 'access',
    },
    getJwtSecret(),
    { expiresIn: ACCESS_TOKEN_TTL }
);

const createRefreshToken = (user, sessionId) => jwt.sign(
    {
        userId: user._id.toString(),
        sessionId: sessionId.toString(),
        type: 'refresh',
        jti: crypto.randomUUID(),
    },
    getRefreshSecret(),
    { expiresIn: REFRESH_TOKEN_TTL }
);

// Treat anything that is clearly a server-side hosted environment as "prod"
// for cookie-flag purposes. We deliberately do NOT key off FRONTEND_URL —
// a missing/misconfigured FRONTEND_URL must never silently downgrade cookies
// to insecure values.
const isProd = Boolean(
    process.env.NODE_ENV === 'production' ||
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.WEBSITE_INSTANCE_ID ||      // Azure App Service
    process.env.VERCEL ||                    // Vercel
    process.env.RENDER                       // Render
);

const cookieOptions = (maxAge) => ({
    httpOnly: true,
    // `sameSite: 'none'` is REQUIRED when frontend and backend are on different
    // domains (which is our prod setup). Browsers will reject 'none' without
    // 'secure: true', so the two MUST flip together.
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge,
    path: '/',
});

const setAuthCookies = (res, accessToken, refreshToken) => {
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, cookieOptions(ACCESS_TOKEN_MAX_AGE_MS));
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions(REFRESH_TOKEN_MAX_AGE_MS));
    res.clearCookie(LEGACY_TOKEN_COOKIE, { path: '/' });
};

const clearAuthCookies = (res) => {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
    res.clearCookie(LEGACY_TOKEN_COOKIE, { path: '/' });
};

const verifyAccessToken = (token) => jwt.verify(token, getJwtSecret());
const verifyRefreshToken = (token) => jwt.verify(token, getRefreshSecret());

module.exports = {
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    LEGACY_TOKEN_COOKIE,
    REFRESH_TOKEN_MAX_AGE_MS,
    hashToken,
    createAccessToken,
    createRefreshToken,
    setAuthCookies,
    clearAuthCookies,
    verifyAccessToken,
    verifyRefreshToken,
};
