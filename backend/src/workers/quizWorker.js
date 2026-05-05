const { Worker } = require('bullmq');
const connection = require('../queues/redisConnection');
const quizService = require('../services/quizService');
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');

const quizWorker = new Worker('quiz', async job => {
    const { lectureId, courseId } = job.data;
    
    try {
        // 1. One-time Check: Skip if already complete
        const existingQuiz = await Quiz.findOne({ lecture: lectureId });
        if (existingQuiz) {
            console.log(`[QuizWorker] Quiz already exists for ${lectureId}. Skipping generation.`);
            return { success: true, skipped: 'ALREADY_EXISTS' };
        }

        // 2. Global Wallet Guard: 5 generations per 2 hours
        const redis = connection;
        const rateLimitKey = 'rate_limit:ai_gen:global'; 
        const currentCount = await redis.get(rateLimitKey);

        if (currentCount && parseInt(currentCount) >= 5) {
            const ttl = await redis.ttl(rateLimitKey);
            throw new Error(`Global AI Limit Reached (5/2hrs). Wallet Protected. Try again in ${Math.ceil(ttl/60)} mins.`);
        }

        // Set in_progress
        await Course.findOneAndUpdate(
            { _id: courseId, 'sections.lectures._id': lectureId },
            { $set: { 'sections.$[].lectures.$[lec].aiStatus.quiz': 'in_progress' } },
            { arrayFilters: [{ 'lec._id': lectureId }] }
        );

        // Generate Quiz
        await quizService.generate(lectureId);

        // Increment Rate Limit counter (expires in 2 hours)
        if (!currentCount) {
            await redis.set(rateLimitKey, 1, 'EX', 7200); // 7200s = 2 hours
        } else {
            await redis.incr(rateLimitKey);
        }

        // Mark complete
        await Course.findOneAndUpdate(
            { _id: courseId, 'sections.lectures._id': lectureId },
            { $set: { 'sections.$[].lectures.$[lec].aiStatus.quiz': 'complete' } },
            { arrayFilters: [{ 'lec._id': lectureId }] }
        );

        return { success: true };
        
    } catch (error) {
        console.error(`Quiz job failed for ${lectureId}:`, error);
        
        let status = 'failed';
        let reason = error.message || 'Unknown error';

        if (error.code === 'LECTURE_TOO_SHORT') {
            reason = 'Lecture too short for quiz';
            // Mark failed with graceful reason per spec
        }
        
        // Mark failed with errorReason
        await Course.findOneAndUpdate(
            { _id: courseId, 'sections.lectures._id': lectureId },
            { 
                $set: { 
                    'sections.$[].lectures.$[lec].aiStatus.quiz': status,
                    'sections.$[].lectures.$[lec].aiStatus.errorReason': reason 
                } 
            },
            { arrayFilters: [{ 'lec._id': lectureId }] }
        );
        
        if (error.code === 'LECTURE_TOO_SHORT') {
            return { skipped: true, reason }; // Graceful early exit
        }
        
        throw error; // Re-throw for BullMQ retry logic
    }
}, { connection });

module.exports = quizWorker;
