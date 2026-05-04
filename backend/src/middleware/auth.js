const User = require('../models/User');
const Session = require('../models/Session');
const {
    ACCESS_TOKEN_COOKIE,
    verifyAccessToken,
} = require('../utils/authTokens');

const auth = async (req, res, next) => {
    try {
        const token = req.cookies[ACCESS_TOKEN_COOKIE];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        const decoded = verifyAccessToken(token);

        if (decoded.type && decoded.type !== 'access') {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const user = await User.findById(decoded.userId).select('-passwordHash');

        if (!user) return res.status(401).json({ error: 'User not found' });

        const session = await Session.findOne({
            _id: decoded.sessionId,
            user: user._id,
            revokedAt: null,
            expiresAt: { $gt: new Date() },
        });

        if (!session) return res.status(401).json({ error: 'Session expired' });

        session.lastUsedAt = new Date();
        await session.save();
        req.session = session;

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = auth;
