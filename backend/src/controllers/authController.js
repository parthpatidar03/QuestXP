const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Session = require('../models/Session');
const { validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const Progress = require('../models/Progress');
const studyPlanService = require('../services/studyPlanService');
const {
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    REFRESH_TOKEN_MAX_AGE_MS,
    hashToken,
    createAccessToken,
    createRefreshToken,
    setAuthCookies,
    clearAuthCookies,
    verifyRefreshToken,
} = require('../utils/authTokens');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const triggerPlanRecalculation = async (userId) => {
    try {
        const progresses = await Progress.find({ user: userId }).populate('course');
        for (const prog of progresses) {
            if (prog.course && prog.course.status === 'ready' && prog.studyPlan) {
                await studyPlanService.recalculateIfNeeded(userId, prog.course._id, { reason: 'login' });
            }
        }
    } catch (err) {
        console.error('[StudyPlan] Recalculation error during login:', err);
    }
};


const userResponse = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    totalXP: user.totalXP,
    level: user.level,
    streak: user.streak,
    badges: user.badges,
    unlockedFeatures: user.unlockedFeatures,
});

const getRequestIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
    return req.ip || req.socket?.remoteAddress || null;
};

const issueSession = async (req, res, user) => {
    const session = await Session.create({
        user: user._id,
        refreshTokenHash: 'pending',
        userAgent: req.get('user-agent') || null,
        ip: getRequestIp(req),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS),
    });

    const accessToken = createAccessToken(user, session._id);
    const refreshToken = createRefreshToken(user, session._id);
    session.refreshTokenHash = hashToken(refreshToken);
    await session.save();

    setAuthCookies(res, accessToken, refreshToken);
    return session;
};

const register = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) return res.status(400).json({ error: 'Email already exists' });

        const passwordHash = await bcrypt.hash(password, 12);

        const user = new User({
            name,
            email: email.toLowerCase(),
            passwordHash
        });

        await user.save();

        await issueSession(req, res, user);

        res.status(201).json({ success: true, data: { user: userResponse(user) }, user: userResponse(user) });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { email, password } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });
        if (!user.passwordHash) return res.status(400).json({ error: 'Use Google login for this account' });

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        await issueSession(req, res, user);

        // T040: Recalculate study plans on login
        await triggerPlanRecalculation(user._id);

        res.json({ success: true, data: { user: userResponse(user) }, user: userResponse(user) });
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        // T040: Recalculate study plans on app load
        await triggerPlanRecalculation(req.user._id);

        const sessions = await Session.countDocuments({
            user: req.user._id,
            revokedAt: null,
            expiresAt: { $gt: new Date() },
        });

        res.json({
            success: true,
            data: { user: userResponse(req.user), activeSessions: sessions },
            user: userResponse(req.user),
            activeSessions: sessions,
        });
    } catch (error) {
        next(error);
    }
};

const refresh = async (req, res, next) => {
    try {
        const token = req.cookies[REFRESH_TOKEN_COOKIE];
        if (!token) return res.status(401).json({ error: 'Refresh token required' });

        const decoded = verifyRefreshToken(token);
        if (decoded.type !== 'refresh') return res.status(401).json({ error: 'Invalid refresh token' });

        const session = await Session.findById(decoded.sessionId);
        if (!session || session.revokedAt || session.expiresAt <= new Date()) {
            await Session.updateMany(
                { user: decoded.userId, revokedAt: null },
                { revokedAt: new Date(), revokeReason: 'refresh_reuse_or_invalid_session' }
            );
            clearAuthCookies(res);
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        if (session.refreshTokenHash !== hashToken(token)) {
            await Session.updateMany(
                { user: decoded.userId, revokedAt: null },
                { revokedAt: new Date(), revokeReason: 'refresh_token_reuse_detected' }
            );
            clearAuthCookies(res);
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        const user = await User.findById(decoded.userId).select('-passwordHash');
        if (!user) {
            session.revokedAt = new Date();
            session.revokeReason = 'user_not_found';
            await session.save();
            clearAuthCookies(res);
            return res.status(401).json({ error: 'User not found' });
        }

        const accessToken = createAccessToken(user, session._id);
        const refreshToken = createRefreshToken(user, session._id);
        session.refreshTokenHash = hashToken(refreshToken);
        session.lastUsedAt = new Date();
        session.expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);
        await session.save();

        setAuthCookies(res, accessToken, refreshToken);
        res.json({ success: true, data: { user: userResponse(user) }, user: userResponse(user) });
    } catch (error) {
        clearAuthCookies(res);
        res.status(401).json({ error: 'Invalid refresh token' });
    }
};

const logout = async (req, res, next) => {
    try {
        const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];
        const accessToken = req.cookies[ACCESS_TOKEN_COOKIE];
        let sessionId = null;

        if (refreshToken) {
            try {
                sessionId = verifyRefreshToken(refreshToken).sessionId;
            } catch (err) {
                sessionId = null;
            }
        }

        if (!sessionId && accessToken && req.session?._id) {
            sessionId = req.session._id;
        }

        if (sessionId) {
            await Session.findByIdAndUpdate(sessionId, {
                revokedAt: new Date(),
                revokeReason: 'logout',
            });
        }

        clearAuthCookies(res);
        res.json({ success: true, message: 'Logged out' });
    } catch (error) {
        next(error);
    }
};

const logoutAll = async (req, res, next) => {
    try {
        await Session.updateMany(
            { user: req.user._id, revokedAt: null },
            { revokedAt: new Date(), revokeReason: 'logout_all' }
        );
        clearAuthCookies(res);
        res.json({ success: true, message: 'Logged out from all devices' });
    } catch (error) {
        next(error);
    }
};

const googleLogin = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { credential } = req.body;
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        let user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            user = new User({
                name,
                email: email.toLowerCase(),
                googleId,
            });
            await user.save();
        } else if (!user.googleId) {
            user.googleId = googleId;
            await user.save();
        }

        await issueSession(req, res, user);

        // T040: Recalculate study plans on login
        await triggerPlanRecalculation(user._id);

        res.json({ success: true, data: { user: userResponse(user) }, user: userResponse(user) });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, googleLogin, getMe, refresh, logout, logoutAll };
