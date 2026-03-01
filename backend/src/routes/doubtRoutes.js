const express = require('express');
const { body, query } = require('express-validator');
const doubtController = require('../controllers/doubtController');
const { authenticate } = require('../middleware/auth');
const featureGate = require('../middleware/featureGate');
const checkEmbeddingReady = require('../middleware/checkEmbeddingReady');

const router = express.Router();

// T011 [US2] GET status route
router.get('/:lectureId/status', authenticate, doubtController.status);

// T017 [US1] POST query route
router.post(
    '/:lectureId/query',
    authenticate,
    featureGate('DOUBT_CHATBOT_LIMITED'),
    body('questionText').notEmpty().withMessage('Question text is required').isLength({ max: 1000 }).withMessage('Max 1000 characters allowed'),
    checkEmbeddingReady,
    doubtController.query
);

// T025 [US4] GET history route
router.get(
    '/:lectureId/history',
    authenticate,
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('before').optional().isISO8601(),
    doubtController.history
);

module.exports = router;
