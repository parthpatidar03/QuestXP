const express = require('express');
const { body, param, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const featureGate = require('../middleware/featureGate');
const Notes = require('../models/Notes');
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const xpService = require('../services/xpService');
const progressService = require('../services/progressService');
const { aiRouteLogger, attachUserIdToLog } = require('../middleware/aiLogger');

const router = express.Router();

router.use(auth); // Protect all routes in this file
router.use(attachUserIdToLog);
router.use(aiRouteLogger);

// Feature Gate configs (aligns with levels.js or defaults)
const LEVEL_NOTES_READ = 2;
const LEVEL_NOTES_EDIT = 3;
const LEVEL_QUIZ = 1;

// T020: GET /api/lectures/:lectureId/notes
router.get('/:lectureId/notes', [
    param('lectureId').isMongoId().withMessage('Invalid lecture ID')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        // Apply inline featureGate-like logic since req.user is loaded
        if (req.user.level < LEVEL_NOTES_READ) {
            return res.status(403).json({
                locked: true,
                requiredLevel: LEVEL_NOTES_READ,
                currentLevel: req.user.level
            });
        }

        const lectureId = req.params.lectureId;

        // Check course AI status first to verify if notes are even ready
        const course = await Course.findOne(
            { "sections.lectures._id": lectureId },
            { "sections.$": 1 }
        );

        if (!course) return res.status(404).json({ error: 'Lecture not found' });

        const lecture = course.sections[0].lectures.id(lectureId);
        if (lecture.aiStatus.notes !== 'complete') {
            return res.status(404).json({ error: 'Notes not ready yet, status: ' + lecture.aiStatus.notes });
        }

        const notes = await Notes.findOne({ lecture: lectureId }).lean();
        if (!notes) return res.status(404).json({ error: 'Notes missing from DB despite complete status' });

        res.json({ notes });
    } catch (error) {
        next(error);
    }
});

// T021: PATCH /api/lectures/:lectureId/notes/edit
router.patch('/:lectureId/notes/edit', [
    param('lectureId').isMongoId().withMessage('Invalid lecture ID'),
    body('content').notEmpty().withMessage('Content cannot be empty')
], async (req, res, next) => {
    try {
        if (req.user.level < LEVEL_NOTES_EDIT) {
            return res.status(403).json({
                locked: true,
                requiredLevel: LEVEL_NOTES_EDIT,
                currentLevel: req.user.level
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const lectureId = req.params.lectureId;
        const { content } = req.body;

        const updatedNotes = await Notes.findOneAndUpdate(
            { lecture: lectureId },
            { 
                $push: { 
                    userEdits: {
                        userId: req.user._id,
                        content,
                        editedAt: new Date()
                    }
                }
            },
            { new: true }
        );

        if (!updatedNotes) return res.status(404).json({ error: 'Notes not found' });

        res.json({ message: 'Edit saved successfully', notes: updatedNotes });
    } catch (error) {
        next(error);
    }
});

// T025: GET /api/lectures/:lectureId/topics
router.get('/:lectureId/topics', [
    param('lectureId').isMongoId().withMessage('Invalid lecture ID')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        const lectureId = req.params.lectureId;
        
        const course = await Course.findOne(
            { "sections.lectures._id": lectureId },
            { "sections.$": 1 }
        );

        if (!course) return res.status(404).json({ error: 'Lecture not found' });

        const lecture = course.sections[0].lectures.id(lectureId);
        
        // Return 404 if still pending/in_progress
        if (lecture.aiStatus.topics === 'pending' || lecture.aiStatus.topics === 'in_progress') {
            return res.status(404).json({ error: 'Topics not ready yet' });
        }

        // Return empty array if failed/skipped
        if (lecture.aiStatus.topics === 'failed') {
            return res.json({ success: true, topics: [] });
        }

        // Sort ascending
        const topics = [...(lecture.topics || [])].sort((a, b) => a.startTime - b.startTime);
        
        res.json({ topics });
    } catch (error) {
        next(error);
    }
});

// T029: GET /api/lectures/:lectureId/quiz
router.get('/:lectureId/quiz', [
    param('lectureId').isMongoId().withMessage('Invalid lecture ID')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        if (req.user.level < LEVEL_QUIZ) {
            return res.status(403).json({
                locked: true,
                requiredLevel: LEVEL_QUIZ,
                currentLevel: req.user.level
            });
        }

        const lectureId = req.params.lectureId;
        
        const course = await Course.findOne(
            { "sections.lectures._id": lectureId },
            { "sections.$": 1 }
        );

        if (!course) return res.status(404).json({ error: 'Lecture not found' });

        const lecture = course.sections[0].lectures.id(lectureId);
        
        if (lecture.aiStatus.quiz !== 'complete') {
            return res.status(404).json({ error: 'Quiz not ready yet' });
        }

        const quiz = await Quiz.findOne({ lecture: lectureId }).lean();
        if (!quiz) return res.status(404).json({ error: 'Quiz missing' });

        // Strip answers
        const questionsWithoutAnswers = quiz.questions.map(q => {
            const { correctIndex, correctIndices, ...rest } = q;
            return rest;
        });

        res.json({ quiz: { ...quiz, questions: questionsWithoutAnswers } });
    } catch (error) {
        next(error);
    }
});

// T030: POST /api/lectures/:lectureId/quiz/submit
router.post('/:lectureId/quiz/submit', [
    param('lectureId').isMongoId().withMessage('Invalid lecture ID'),
    body('answers').isArray().withMessage('Answers must be an array'),
    body('timeTakenSecs').isNumeric({ min: 0 }).withMessage('Valid time taken is required')
], async (req, res, next) => {
    try {
        if (req.user.level < LEVEL_QUIZ) {
            return res.status(403).json({
                locked: true,
                requiredLevel: LEVEL_QUIZ,
                currentLevel: req.user.level
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const lectureId = req.params.lectureId;
        const { answers, timeTakenSecs } = req.body;

        const quiz = await Quiz.findOne({ lecture: lectureId }).lean();
        if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

        if (answers.length !== quiz.questionCount) {
            return res.status(400).json({ error: `Expected ${quiz.questionCount} answers` });
        }

        let correctCount = 0;
        const evaluatedQuestions = quiz.questions.map((q, idx) => {
            const userAnswers = answers[idx];
            const correctIndices = q.correctIndices || (q.correctIndex !== undefined ? [q.correctIndex] : []);
            
            let isCorrect = false;
            if (Array.isArray(userAnswers)) {
                // For multi-choice
                isCorrect = userAnswers.length === correctIndices.length &&
                            userAnswers.every(val => correctIndices.includes(val));
            } else if (typeof userAnswers === 'number') {
                // For legacy single choice
                isCorrect = correctIndices.length === 1 && correctIndices[0] === userAnswers;
            }

            if (isCorrect) correctCount++;
            return {
                ...q,
                userAnswer: userAnswers,
                isCorrect
            };
        });

        const score = Math.round((correctCount / quiz.questionCount) * 100);

        const priorAttempts = await QuizAttempt.find({ user: req.user._id, lecture: lectureId })
                                               .sort({ score: -1 }).lean();
        
        const personalBest = priorAttempts.length > 0 ? priorAttempts[0].score : 0;
        const isNewPersonalBest = priorAttempts.length > 0 && score > personalBest;
        const attemptNumber = priorAttempts.length + 1;

        const attempt = await QuizAttempt.create({
            user: req.user._id,
            lecture: lectureId,
            answers,
            score,
            timeTakenSecs,
            attemptNumber
        });

        // Award XP
        await xpService.award(req.user._id, 'QUIZ_ATTEMPTED', attempt._id.toString());
        if (score >= 60) await xpService.award(req.user._id, 'QUIZ_PASSED', attempt._id.toString());
        if (score === 100) await xpService.award(req.user._id, 'QUIZ_ACED', attempt._id.toString());

        // T030: MISSION COMPLETION TRIGGER
        // We auto-complete the mission when a quiz is submitted (teaching moment)
        const courseLookup = await Course.findOne({ "sections.lectures._id": lectureId }, { _id: 1 });
        let progressResult = null;
        if (courseLookup) {
            progressResult = await progressService.completeLecture(req.user._id, courseLookup._id.toString(), lectureId);
        }

        res.json({
            score,
            correctCount,
            totalCount: quiz.questionCount,
            isNewPersonalBest,
            attemptNumber,
            evaluatedQuestions,
            progress: progressResult
        });

    } catch (error) {
        next(error);
    }
});

// T032: GET /api/lectures/:lectureId/ai-status
router.get('/:lectureId/ai-status', [
    param('lectureId').isMongoId().withMessage('Invalid lecture ID')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        const lectureId = req.params.lectureId;
        const course = await Course.findOne(
            { "sections.lectures._id": lectureId },
            { "sections.$": 1 }
        );

        if (!course) return res.status(404).json({ error: 'Lecture not found' });
        
        const lecture = course.sections[0].lectures.id(lectureId);
        res.json({ aiStatus: lecture.aiStatus });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
