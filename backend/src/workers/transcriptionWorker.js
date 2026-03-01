const { Worker } = require('bullmq');
const connection = require('../queues/redisConnection');
const transcriptionService = require('../services/transcriptionService');
const Course = require('../models/Course');
const Transcript = require('../models/Transcript');
const notesQueue = require('../queues/notesQueue');
const quizQueue = require('../queues/quizQueue');
const topicsQueue = require('../queues/topicsQueue');
const jobOptions = require('../queues/jobOptions');

const transcriptionWorker = new Worker('transcription', async job => {
    const { lectureId, courseId, youtubeId, durationSecs } = job.data;
    
    try {
        // Verify course/lecture exist and set in_progress
        const course = await Course.findOneAndUpdate(
            { _id: courseId, 'sections.lectures._id': lectureId },
            { $set: { 'sections.$[].lectures.$[lec].aiStatus.transcription': 'in_progress' } },
            { arrayFilters: [{ 'lec._id': lectureId }], new: true }
        );

        if (!course) throw new Error('Course or lecture not found');

        // Transcribe
        const result = await transcriptionService.transcribe(youtubeId, durationSecs);

        // Save Transcript Model
        await Transcript.findOneAndUpdate(
            { lecture: lectureId },
            { 
                lecture: lectureId,
                course: courseId,
                source: result.source,
                fullText: result.fullText,
                segments: result.segments,
                durationSecs: result.durationSecs
            },
            { upsert: true, new: true }
        );

        // Mark complete
        await Course.findOneAndUpdate(
            { _id: courseId, 'sections.lectures._id': lectureId },
            { $set: { 'sections.$[].lectures.$[lec].aiStatus.transcription': 'complete' } },
            { arrayFilters: [{ 'lec._id': lectureId }] }
        );

        // Fan-out to downstream queues
        await notesQueue.add('generate-notes', { lectureId, courseId }, jobOptions);
        await quizQueue.add('generate-quiz', { lectureId, courseId }, jobOptions);
        await topicsQueue.add('generate-topics', { lectureId, courseId }, jobOptions);

        return { success: true, source: result.source };
        
    } catch (error) {
        console.error(`Transcription job failed for ${lectureId}:`, error);
        
        // Mark failed with errorReason
        await Course.findOneAndUpdate(
            { _id: courseId, 'sections.lectures._id': lectureId },
            { 
                $set: { 
                    'sections.$[].lectures.$[lec].aiStatus.transcription': 'failed',
                    'sections.$[].lectures.$[lec].aiStatus.errorReason': error.message || 'Unknown error'
                } 
            },
            { arrayFilters: [{ 'lec._id': lectureId }] }
        );
        
        throw error;
    }
}, { connection });

module.exports = transcriptionWorker;
