const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redisClient = require('../queues/redisConnection');

/**
 * Global rate limiter (IP based)
 */
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
        prefix: 'rl:global:'
    }),
    handler: (req, res) => {
        res.status(429).json({
            error: 'GLOBAL_RATE_LIMIT',
            message: 'Too many requests from this IP, please try again later.'
        });
    }
});

/**
 * Chatbot Hourly Limiter (User based)
 * Level 1: 3 req/hr
 * Level 2+: 7 req/hr
 */
const chatbotHourlyLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: (req) => {
        if (!req.user) return 0;
        return (req.user.level || 0) <= 1 ? 3 : 7;
    },
    keyGenerator: (req) => req.user?._id.toString() || req.ip,
    handler: (req, res) => {
        const resetTime = new Date(req.rateLimit.resetTime);
        const diff = Math.ceil((resetTime - Date.now()) / 60000);
        res.status(429).json({
            error: 'CHATBOT_LIMIT_HOURLY',
            message: `Question limit reached. Resets in ${diff} minutes (at ${resetTime.toLocaleTimeString()}).`,
            resetAt: req.rateLimit.resetTime,
            limit: req.rateLimit.limit
        });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
        prefix: 'rl:chatbot:hr:'
    }),
});

/**
 * Chatbot 2-Hour Window (User based)
 * Max 10 questions in 2 hours for everyone
 */
const chatbotTwoHourLimiter = rateLimit({
    windowMs: 2 * 60 * 60 * 1000, // 2 hours
    max: 10,
    keyGenerator: (req) => req.user?._id.toString() || req.ip,
    handler: (req, res) => {
        const resetTime = new Date(req.rateLimit.resetTime);
        const diff = Math.ceil((resetTime - Date.now()) / 60000);
        res.status(429).json({
            error: 'CHATBOT_LIMIT_WINDOW',
            message: `Maximum 10 questions allowed every 2 hours. Resets in ${diff} minutes.`,
            resetAt: req.rateLimit.resetTime
        });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
        prefix: 'rl:chatbot:2hr:'
    }),
});

/**
 * Quiz Attempt Limiter (User based)
 * 5 attempts per 12 hours
 */
const quizLimiter = rateLimit({
    windowMs: 12 * 60 * 60 * 1000, 
    max: 5,
    keyGenerator: (req) => req.user?._id.toString() || req.ip,
    handler: (req, res) => {
        const resetTime = new Date(req.rateLimit.resetTime);
        const diff = Math.ceil((resetTime - Date.now()) / 3600000);
        res.status(429).json({
            error: 'QUIZ_LIMIT',
            message: `Quiz limit reached (5 attempts per 12 hours). Resets in about ${diff} hours.`,
            resetAt: req.rateLimit.resetTime
        });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
        prefix: 'rl:quiz:'
    }),
});

/**
 * Summary/Notes Limiter (User based)
 * 5 summaries per hour
 */
const summaryLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    keyGenerator: (req) => req.user?._id.toString() || req.ip,
    handler: (req, res) => {
        const resetTime = new Date(req.rateLimit.resetTime);
        const diff = Math.ceil((resetTime - Date.now()) / 60000);
        res.status(429).json({
            error: 'SUMMARY_LIMIT',
            message: `Summary limit reached (5 per hour). Resets in ${diff} minutes.`,
            resetAt: req.rateLimit.resetTime
        });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
        prefix: 'rl:summary:'
    }),
});

module.exports = {
    globalLimiter,
    chatbotHourlyLimiter,
    chatbotTwoHourLimiter,
    quizLimiter,
    summaryLimiter
};
