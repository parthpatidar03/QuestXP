const { Worker } = require('bullmq');
const connection = require('../queues/redisConnection');
const notesService = require('../services/notesService');
const Course = require('../models/Course');

const notesWorker = new Worker('notes', async job => {
    const { lectureId, courseId } = job.data;
    
    try {
        // Set in_progress
        await Course.findOneAndUpdate(
            { _id: courseId, 'sections.lectures._id': lectureId },
            { $set: { 'sections.$[].lectures.$[lec].aiStatus.notes': 'in_progress' } },
            { arrayFilters: [{ 'lec._id': lectureId }] }
        );

        // Generate Notes
        await notesService.generate(lectureId);

        // Mark complete
        await Course.findOneAndUpdate(
            { _id: courseId, 'sections.lectures._id': lectureId },
            { $set: { 'sections.$[].lectures.$[lec].aiStatus.notes': 'complete' } },
            { arrayFilters: [{ 'lec._id': lectureId }] }
        );

        return { success: true };
        
    } catch (error) {
        console.error(`Notes job failed for ${lectureId}:`, error);
        
        // Mark failed with errorReason
        await Course.findOneAndUpdate(
            { _id: courseId, 'sections.lectures._id': lectureId },
            { 
                $set: { 
                    'sections.$[].lectures.$[lec].aiStatus.notes': 'failed',
                    'sections.$[].lectures.$[lec].aiStatus.errorReason': error.message || 'Unknown error'
                } 
            },
            { arrayFilters: [{ 'lec._id': lectureId }] }
        );
        
        throw error; // Re-throw for BullMQ retry logic
    }
}, { connection });

module.exports = notesWorker;
