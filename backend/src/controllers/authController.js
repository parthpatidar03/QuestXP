const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const Progress = require('../models/Progress');
const studyPlanService = require('../services/studyPlanService');

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


const generateToken = (userId, email) => {
    return jwt.sign({ userId, email }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
};

const setTokenCookie = (res, token) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
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

        const token = generateToken(user._id, user.email);
        setTokenCookie(res, token);

        const userResponse = { _id: user._id, name: user.name, email: user.email, totalXP: user.totalXP, level: user.level };
        res.status(201).json({ user: userResponse });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = generateToken(user._id, user.email);
        setTokenCookie(res, token);

        // T040: Recalculate study plans on login
        await triggerPlanRecalculation(user._id);

        const userResponse = { _id: user._id, name: user.name, email: user.email, totalXP: user.totalXP, level: user.level };
        res.json({ user: userResponse });
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        const userResponse = {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            totalXP: req.user.totalXP,
            level: req.user.level,
            streak: req.user.streak,
            badges: req.user.badges,
            unlockedFeatures: req.user.unlockedFeatures
        };

        // T040: Recalculate study plans on app load
        await triggerPlanRecalculation(req.user._id);

        res.json({ user: userResponse });
    } catch (error) {
        next(error);
    }
};

const logout = (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
};

const googleLogin = async (req, res, next) => {
    try {
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

        const token = generateToken(user._id, user.email);
        setTokenCookie(res, token);

        // T040: Recalculate study plans on login
        await triggerPlanRecalculation(user._id);

        const userResponse = { _id: user._id, name: user.name, email: user.email, totalXP: user.totalXP, level: user.level };
        res.json({ user: userResponse });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, googleLogin, getMe, logout };
