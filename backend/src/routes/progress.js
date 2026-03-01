const express = require('express');
const { body, param } = require('express-validator');
const { 
    savePosition, 
    getProgress, 
    generateOrRegenPlan, 
    getPlan, 
    getTodayTarget, 
    getWeeklyTargets 
} = require('../controllers/progressController');
const auth = require('../middleware/auth');
const featureGate = require('../middleware/featureGate');

const router = express.Router();

router.use(auth); // Protect all progress routes

router.patch('/:courseId/lectures/:lectureId/position', [
    param('courseId').isMongoId().withMessage('Invalid courseId'),
    param('lectureId').isMongoId().withMessage('Invalid lectureId'),
    body('position').isInt({ min: 0 }).withMessage('Position must be a positive integer'),
    body('watchedSeconds').isInt({ min: 0 }).withMessage('Watched seconds must be >= 0')
], savePosition);

router.get('/:courseId', [
    param('courseId').isMongoId().withMessage('Invalid courseId')
], getProgress);

// ─── Study Plan Routes (T004, T009, T027) ───────────────────────────────────

// Apply feature gate to all plan routes
router.use('/:courseId/plan', featureGate('STUDY_PLAN'));

router.post('/:courseId/plan', [
    param('courseId').isMongoId().withMessage('Invalid courseId'),
    body('deadline').isISO8601().toDate().withMessage('Invalid deadline date')
        .custom((value) => {
            const tomorrow = new Date();
            tomorrow.setHours(0, 0, 0, 0);
            tomorrow.setDate(tomorrow.getDate() + 1);
            if (value < tomorrow) {
                throw new Error('Deadline must be at least tomorrow');
            }
            return true;
        }),
    body('weekdayCapacityMins').isInt({ min: 0, max: 1440 }).withMessage('Weekday capacity must be 0-1440 mins'),
    body('weekendCapacityMins').isInt({ min: 0, max: 1440 }).withMessage('Weekend capacity must be 0-1440 mins'),
    // custom rule: at least one capacity > 0
    body().custom(body => {
        if (body.weekdayCapacityMins === 0 && body.weekendCapacityMins === 0) {
            throw new Error('At least one capacity (weekday or weekend) must be > 0');
        }
        return true;
    }),
    body('restDays').optional().isArray().withMessage('restDays must be an array')
        .custom((value) => {
            if (value && !value.every(d => !isNaN(Date.parse(d)))) {
                throw new Error('All restDays must be valid ISO date strings');
            }
            return true;
        })
], generateOrRegenPlan);

router.get('/:courseId/plan', [
    param('courseId').isMongoId().withMessage('Invalid courseId')
], getPlan);

router.get('/:courseId/plan/today', [
    param('courseId').isMongoId().withMessage('Invalid courseId')
], getTodayTarget);

router.get('/:courseId/plan/weekly', [
    param('courseId').isMongoId().withMessage('Invalid courseId')
], getWeeklyTargets);

module.exports = router;
