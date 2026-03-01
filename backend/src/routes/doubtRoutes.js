const express = require('express');
const { body, query } = require('express-validator');
const doubtController = require('../controllers/doubtController');
const { authenticate } = require('../middleware/auth');
const featureGate = require('../middleware/featureGate');
const checkEmbeddingReady = require('../middleware/checkEmbeddingReady');

const router = express.Router();

// T011 [US2] GET status route
router.get('/:lectureId/status', authenticate, doubtController.status);

module.exports = router;
