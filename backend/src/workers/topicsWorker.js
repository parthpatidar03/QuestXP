const { Worker } = require('bullmq');
const connection = require('../queues/redisConnection');
const topicsService = require('../services/topicsService');
const Course = require('../models/Course');

const topicsWorker = new Worker('topics', async job => {
    const { lectureId, courseId } = job.data;
    
    try {
        // Set in_progress
        await Course.findOneAndUpdate(
            { _id: courseId, 'sections.lectures._id': lectureId },
            { $set: { 'sections.$[].lectures.$[lec].aiStatus.topics': 'in_progress' } },
            { arrayFilters: [{ 'lec._id': lectureId }] }
        );

        // Generate Topics
        await topicsService.generate(lectureId);

        // Mark complete
        await Course.findOneAndUpdate(
            { _id: courseId, 'sections.lectures._id': lectureId },
            { $set: { 'sections.$[].lectures.$[lec].aiStatus.topics': 'complete' } },
            { arrayFilters: [{ 'lec._id': lectureId }] }
        );

        return { success: true };
        
    } catch (error) {
        console.error(`Topics job failed for ${lectureId}:`, error);
        
        let status = 'failed';
        let reason = error.message || 'Unknown error';

        // Graceful fallback for short lectures
        if (error.code === 'LECTURE_TOO_SHORT') {
            reason = 'Lecture too short for topic segmentation';
            // It's still a terminal state for the pipeline, but we could choose to mark it as complete
            // However, spec says "skip gracefully if under threshold with aiStatus.topics = 'failed' and reason 'Lecture too short'"
        }
        
        // Mark failed with errorReason
        await Course.findOneAndUpdate(
            { _id: courseId, 'sections.lectures._id': lectureId },
            { 
                $set: { 
                    'sections.$[].lectures.$[lec].aiStatus.topics': status,
                    'sections.$[].lectures.$[lec].aiStatus.errorReason': reason // Be careful, this overrides notes/quiz errors if concurrent. Might need an error object map in future iterations.
                } 
            },
            { arrayFilters: [{ 'lec._id': lectureId }] }
        );
        
        // Only retry actual operational failures, not validation/logic exceptions
        if (error.code === 'LECTURE_TOO_SHORT') {
            return { skipped: true, reason }; // Don't throw -> tells BullMQ job succeeded (done processing)
        }
        
        throw error;
    }
}, { connection });

module.exports = topicsWorker;
