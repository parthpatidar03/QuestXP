const { validationResult } = require('express-validator');
const progressService = require('../services/progressService');
const Progress = require('../models/Progress');

const savePosition = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { position, watchedSeconds } = req.body;
        const { courseId, lectureId } = req.params;

        const result = await progressService.savePosition(
            req.user._id,
            courseId,
            lectureId,
            { position, watchedSeconds }
        );

        res.json(result);
    } catch (error) {
        next(error);
    }
};

const getProgress = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const progress = await Progress.findOne({ user: req.user._id, course: courseId })
            .select('-__v')
            .lean();

        if (!progress) {
            return res.json({ progress: null });
        }

        res.json({ progress });
    } catch (error) {
        next(error);
    }
};

module.exports = { savePosition, getProgress };
