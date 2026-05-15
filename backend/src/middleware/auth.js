const User = require('../models/User');
const Session = require('../models/Session');
const {
    ACCESS_TOKEN_COOKIE,
    verifyAccessToken,
} = require('../utils/authTokens');

const auth = async (req, res, next) => {
    try {
        let token = req.cookies?.[ACCESS_TOKEN_COOKIE];

        // Fallback to Authorization header — supports the localStorage-token path
        // used by the frontend when cookies are unavailable (incognito, iOS Safari
        // third-party cookie blocks, etc.).
        if (!token && req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        let decoded;
        try {
            decoded = verifyAccessToken(token);
        } catch {
            return res.status(401).json({ error: 'Invalid token' });
        }

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

        // Fire-and-forget lastUsedAt bump. Awaiting this on every request was
        // adding a synchronous round-trip to Mongo to the critical path.
        Session.updateOne({ _id: session._id }, { $set: { lastUsedAt: new Date() } })
            .catch(() => { /* non-critical */ });

        req.session = session;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = auth;
