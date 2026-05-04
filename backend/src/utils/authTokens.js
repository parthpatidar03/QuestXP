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

const cookieOptions = (maxAge) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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
