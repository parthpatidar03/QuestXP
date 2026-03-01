const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const featureGate = require('../middleware/featureGate');
const Notes = require('../models/Notes');
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const xpService = require('../services/xpService');
const { aiRouteLogger, attachUserIdToLog } = require('../middleware/aiLogger');

const router = express.Router();

router.use(auth); // Protect all routes in this file
router.use(attachUserIdToLog);
router.use(aiRouteLogger);

// Feature Gate configs (aligns with levels.js or defaults)
const LEVEL_NOTES_READ = 2;
const LEVEL_NOTES_EDIT = 3;
const LEVEL_QUIZ = 3;

// T020: GET /api/lectures/:lectureId/notes
router.get('/:lectureId/notes', async (req, res, next) => {
    try {
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
router.get('/:lectureId/topics', async (req, res, next) => {
    try {
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
router.get('/:lectureId/quiz', async (req, res, next) => {
    try {
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

        // Strip correctIndex
        const questionsWithoutAnswers = quiz.questions.map(q => {
            const { correctIndex, ...rest } = q;
            return rest;
        });

        res.json({ quiz: { ...quiz, questions: questionsWithoutAnswers } });
    } catch (error) {
        next(error);
    }
});

// T030: POST /api/lectures/:lectureId/quiz/submit
router.post('/:lectureId/quiz/submit', [
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
            const isCorrect = answers[idx] === q.correctIndex;
            if (isCorrect) correctCount++;
            return {
                ...q,
                userAnswer: answers[idx],
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

        res.json({
            score,
            correctCount,
            totalCount: quiz.questionCount,
            isNewPersonalBest,
            attemptNumber,
            evaluatedQuestions
        });

    } catch (error) {
        next(error);
    }
});

// T032: GET /api/lectures/:lectureId/ai-status
router.get('/:lectureId/ai-status', async (req, res, next) => {
    try {
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
