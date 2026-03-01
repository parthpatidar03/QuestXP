const { Worker } = require('bullmq');
const connection = require('../queues/redisConnection');
const quizService = require('../services/quizService');
const Course = require('../models/Course');

const quizWorker = new Worker('quiz', async job => {
    const { lectureId, courseId } = job.data;
    
    try {
        // Set in_progress
        await Course.findOneAndUpdate(
            { _id: courseId, 'sections.lectures._id': lectureId },
            { $set: { 'sections.$[].lectures.$[lec].aiStatus.quiz': 'in_progress' } },
            { arrayFilters: [{ 'lec._id': lectureId }] }
        );

        // Generate Quiz
        await quizService.generate(lectureId);

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
