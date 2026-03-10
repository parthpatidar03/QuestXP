const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const authenticate = require('../middleware/auth');
const doubtController = require('../controllers/doubtController');
const simpleChatController = require('../controllers/simpleChatController');

// RAG routes (kept for backward compat)
router.get('/:lectureId/status',
    authenticate,
    param('lectureId').isMongoId(),
    doubtController.status
);

router.post('/:lectureId/query',
    authenticate,
    param('lectureId').isMongoId(),
    body('questionText').isString().notEmpty().isLength({ max: 500 }),
    doubtController.query
);

router.get('/:lectureId/history',
    authenticate,
    param('lectureId').isMongoId(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    doubtController.history
);

// ─── Simple LLM Chat (no RAG / Pinecone) ─────────────────────────────
router.post('/:lectureId/simple',
    authenticate,
    param('lectureId').isMongoId(),
    body('questionText').isString().notEmpty().isLength({ max: 500 }),
    body('courseTitle').optional().isString().isLength({ max: 200 }),
    body('lectureTitle').optional().isString().isLength({ max: 200 }),
    body('history').optional().isArray({ max: 20 }),
    simpleChatController.query
);

module.exports = router;
