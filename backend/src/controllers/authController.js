const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { authLogger, aiLogger } = require('../utils/logger');
const Session = require('../models/Session');
const { validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const Progress = require('../models/Progress');
const studyPlanService = require('../services/studyPlanService');
const { generateRandomUsername } = require('../utils/nameGenerator');
const { extractClientIP } = require('../middleware/geoBlock');
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
        authLogger.error('StudyPlan Recalculation error during login', { error: err.message, stack: err.stack });
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
    username: user.username,
    usernameSet: user.usernameSet,
    role: user.role,
    tourCompleted: user.tourCompleted,
});

const getRequestIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
    return req.ip || req.socket?.remoteAddress || null;
};

const issueSession = async (req, res, user) => {
    const geoCountry = req.geoInfo?.country || null;
    const session = await Session.create({
        user: user._id,
        refreshTokenHash: 'pending',
        userAgent: req.get('user-agent') || null,
        ip: getRequestIp(req),
        country: geoCountry,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS),
    });

    const accessToken = createAccessToken(user, session._id);
    const refreshToken = createRefreshToken(user, session._id);
    session.refreshTokenHash = hashToken(refreshToken);
    await session.save();

    setAuthCookies(res, accessToken, refreshToken);
    return { session, accessToken, refreshToken };
};

const register = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) return res.status(400).json({ error: 'Email already exists' });

        const passwordHash = await bcrypt.hash(password, 12);

        const clientIP = extractClientIP(req);
        const user = new User({
            email: email.toLowerCase(),
            passwordHash,
            username: generateRandomUsername(),
            usernameSet: false,
            geo: {
                country: req.geoInfo?.country || null,
                region: req.geoInfo?.region || null,
                city: req.geoInfo?.city || null,
                lastLoginIP: clientIP,
                lastUpdated: new Date(),
            },
        });
        user.name = user.username; // Ensure name equals username for V1 identity

        await user.save();

        // Award Welcome XP
        const xpService = require('../services/xpService');
        await xpService.award(user._id, 'WELCOME_GIFT').catch(err => {
            authLogger.error('Failed to award welcome XP', { error: err.message, userId: user._id });
        });

        const { accessToken, refreshToken } = await issueSession(req, res, user);

        res.status(201).json({ 
            success: true, 
            data: { user: userResponse(user), accessToken, refreshToken }, 
            user: userResponse(user),
            accessToken,
            refreshToken
        });
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

        // Update geo metadata on login
        const clientIP = extractClientIP(req);
        user.geo = {
            country: req.geoInfo?.country || user.geo?.country || null,
            region: req.geoInfo?.region || user.geo?.region || null,
            city: req.geoInfo?.city || user.geo?.city || null,
            lastLoginIP: clientIP,
            lastUpdated: new Date(),
        };
        await user.save();

        const { accessToken, refreshToken } = await issueSession(req, res, user);

        // T040: Recalculate study plans on login (Background - non-blocking)
        triggerPlanRecalculation(user._id).catch(err => {
            authLogger.error('Background plan recalculation failed', { error: err.message, stack: err.stack });
        });

        res.json({ 
            success: true, 
            data: { user: userResponse(user), accessToken, refreshToken }, 
            user: userResponse(user),
            accessToken,
            refreshToken
        });
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        // T040: Recalculate study plans on app load (Background - non-blocking)
        triggerPlanRecalculation(req.user._id).catch(err => {
            authLogger.error('Background plan recalculation failed', { error: err.message, stack: err.stack });
        });

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
        let token = req.cookies[REFRESH_TOKEN_COOKIE] || req.body.refreshToken;
        if (!token) return res.status(401).json({ error: 'Refresh token required' });

        const decoded = verifyRefreshToken(token);
        if (decoded.type !== 'refresh') return res.status(401).json({ error: 'Invalid refresh token' });

        const session = await Session.findById(decoded.sessionId);
        if (!session || session.revokedAt || session.expiresAt <= new Date()) {
            // T071: Don't revoke ALL sessions just because ONE expired or was manually revoked.
            // Only reuse (token hash mismatch) should trigger the security panic.
            clearAuthCookies(res);
            return res.status(401).json({ error: 'Session expired' });
        }

        if (session.refreshTokenHash !== hashToken(token)) {
            // T069: Allow a 30s grace period for the old token to handle network race conditions
            const wasJustUsed = session.lastUsedAt && (Date.now() - session.lastUsedAt.getTime() < 30000);
            
            if (!wasJustUsed) {
                await Session.updateMany(
                    { user: decoded.userId, revokedAt: null },
                    { revokedAt: new Date(), revokeReason: 'refresh_token_reuse_detected' }
                );
                clearAuthCookies(res);
                return res.status(401).json({ error: 'Invalid refresh token' });
            }
            // If it was just used, we let it pass but don't rotate again (or rotate anyway)
            // For simplicity, if it was just used, we'll still issue a new one 
            // because the client might have missed the previous response.
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
        res.json({ 
            success: true, 
            data: { user: userResponse(user), accessToken, refreshToken }, 
            user: userResponse(user),
            accessToken,
            refreshToken
        });
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

        if (!process.env.GOOGLE_CLIENT_ID) {
            authLogger.error('GOOGLE_CLIENT_ID not configured on backend');
            return res.status(500).json({
                error: 'Server is not configured for Google sign-in. Please contact support.',
                code: 'GOOGLE_CLIENT_NOT_CONFIGURED',
            });
        }

        const { credential } = req.body;
        let payload;
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        } catch (verifyErr) {
            authLogger.warn('Google credential verification failed', { error: verifyErr.message });
            return res.status(401).json({
                error: 'Could not verify your Google sign-in. Please retry.',
                code: 'GOOGLE_TOKEN_INVALID',
            });
        }

        if (!payload?.email) {
            return res.status(401).json({
                error: 'Google did not return an email address. Please use email signup.',
                code: 'GOOGLE_NO_EMAIL',
            });
        }

        if (payload.email_verified !== true) {
            authLogger.warn('Google login rejected: unverified email', { email: payload.email });
            return res.status(401).json({
                error: 'Your Google email is not verified. Please verify it with Google before signing in.',
                code: 'GOOGLE_EMAIL_UNVERIFIED',
            });
        }

        const clientIP = extractClientIP(req);
        const geoData = {
            country: req.geoInfo?.country || null,
            region: req.geoInfo?.region || null,
            city: req.geoInfo?.city || null,
            lastLoginIP: clientIP,
            lastUpdated: new Date(),
        };

        const emailLower = String(payload.email).toLowerCase();
        let user = await User.findOne({ email: emailLower });
        let isNew = false;
        
        if (!user) {
            isNew = true;
            user = new User({
                email: emailLower,
                googleId: payload.sub,
                username: generateRandomUsername(),
                usernameSet: false,
                geo: geoData,
            });
            user.name = user.username;
        } else {
            if (!user.googleId) user.googleId = payload.sub;
            if (!user.username) {
                user.username = generateRandomUsername();
                user.usernameSet = false;
            }
            user.geo = geoData; // always refresh geo on login
        }
        await user.save();
        
        if (isNew) {
            const xpService = require('../services/xpService');
            await xpService.award(user._id, 'WELCOME_GIFT').catch(err => {
                authLogger.error('Failed to award welcome XP', { error: err.message, userId: user._id });
            });
        }

        const { accessToken, refreshToken } = await issueSession(req, res, user);

        triggerPlanRecalculation(user._id).catch(err => {
            authLogger.error('Background plan recalculation failed', { error: err.message });
        });

        res.json({
            success: true,
            data: { user: userResponse(user), accessToken, refreshToken },
            user: userResponse(user),
            accessToken,
            refreshToken,
        });
    } catch (error) {
        authLogger.error('Google login failed', {
            error: error.message,
            hasCredential: !!req.body?.credential,
        });
        next(error);
    }
};

const updateUsername = async (req, res, next) => {
    try {
        const { username } = req.body;
        if (!username || username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }

        const cleanUsername = username.trim().toLowerCase();
        if (cleanUsername.length < 3) {
            return res.status(400).json({ error: 'Username too short' });
        }

        const existing = await User.findOne({ username: cleanUsername });
        if (existing) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        const user = await User.findById(req.user._id);
        user.username = cleanUsername;
        user.name = cleanUsername; // Sync name with chosen identity
        user.usernameSet = true;
        await user.save();

        res.json({ 
            success: true, 
            data: { user: userResponse(user) },
            user: userResponse(user) 
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Username already taken' });
        }
        next(error);
    }
};

const completeTour = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        user.tourCompleted = true;
        await user.save();
        res.json({ success: true, user: userResponse(user) });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, googleLogin, getMe, refresh, logout, logoutAll, updateUsername, completeTour };
