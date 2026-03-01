const express = require('express');
const auth = require('../middleware/auth');
const Course = require('../models/Course');
const transcriptionQueue = require('../queues/transcriptionQueue');
const jobOptions = require('../queues/jobOptions');

const router = express.Router();

// T017: Internal admin endpoint to manually trigger the transcription pipeline
router.post('/lectures/:id/process', auth, async (req, res, next) => {
    try {
        const lectureId = req.params.id;
        
        // Find course containing the lecture
        const course = await Course.findOne({ 
            'sections.lectures._id': lectureId 
        });

        if (!course) return res.status(404).json({ error: 'Lecture not found' });

        // Find the specific lecture to get its youtubeId
        let targetLecture;
        for (const section of course.sections) {
            const lec = section.lectures.id(lectureId);
            if (lec) {
                targetLecture = lec;
                break;
            }
        }

        // Set status to pending to reset UI
        await Course.findOneAndUpdate(
            { _id: course._id, 'sections.lectures._id': lectureId },
            { $set: { 
                'sections.$[].lectures.$[lec].aiStatus.transcription': 'pending',
                'sections.$[].lectures.$[lec].aiStatus.errorReason': null
            } },
            { arrayFilters: [{ 'lec._id': lectureId }] }
        );

        // Enqueue transcription job
        await transcriptionQueue.add('transcribe', {
            courseId: course._id.toString(),
            lectureId: targetLecture.youtubeId,
            durationSecs: targetLecture.duration
        }, jobOptions);

        res.json({ message: 'Transcription queued', lectureId });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
