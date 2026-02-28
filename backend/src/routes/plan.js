const express = require('express');
const { getTodayPlan } = require('../controllers/studyPlanController');
const auth = require('../middleware/auth');
const featureGate = require('../middleware/featureGate');

const router = express.Router();

router.use(auth);

// Only allow users with level high enough to use STUDY_PLAN
router.get('/today', featureGate('STUDY_PLAN'), getTodayPlan);

module.exports = router;
