const express = require('express');
const { body, param } = require('express-validator');
const { savePosition, getProgress } = require('../controllers/progressController');
const auth = require('../middleware/auth');

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

module.exports = router;
