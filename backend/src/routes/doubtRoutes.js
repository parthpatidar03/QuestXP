const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const authenticate = require('../middleware/auth');
const featureGate = require('../middleware/featureGate');
const doubtController = require('../controllers/doubtController');
const simpleChatController = require('../controllers/simpleChatController');

const { chatbotHourlyLimiter, chatbotTwoHourLimiter } = require('../middleware/rateLimiter');

// RAG routes (kept for backward compat)
router.get('/:lectureId/status',
    authenticate,
    featureGate('DOUBT_CHATBOT_LIMITED'),
    param('lectureId').isMongoId(),
    doubtController.status
);

router.post('/:lectureId/query',
    authenticate,
    featureGate('DOUBT_CHATBOT_LIMITED'),
    chatbotTwoHourLimiter,
    chatbotHourlyLimiter,
    param('lectureId').isMongoId(),
    body('questionText').isString().notEmpty().isLength({ max: 500 }),
    doubtController.query
);

router.get('/:lectureId/history',
    authenticate,
    featureGate('DOUBT_CHATBOT_LIMITED'),
    param('lectureId').isMongoId(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    doubtController.history
);

// ─── Simple LLM Chat (no RAG / Pinecone) ─────────────────────────────
router.post('/:lectureId/simple',
    authenticate,
    featureGate('DOUBT_CHATBOT_LIMITED'),
    chatbotTwoHourLimiter,
    chatbotHourlyLimiter,
    param('lectureId').isMongoId(),
    body('questionText').isString().notEmpty().isLength({ max: 500 }),
    body('courseTitle').optional().isString().isLength({ max: 200 }),
    body('lectureTitle').optional().isString().isLength({ max: 200 }),
    body('history').optional().isArray({ max: 20 }),
    simpleChatController.query
);

module.exports = router;
