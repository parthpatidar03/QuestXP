const { Worker } = require('bullmq');
const connection = require('../queues/redisConnection');
const transcriptionService = require('../services/transcriptionService');
const Course = require('../models/Course');
const Transcript = require('../models/Transcript');
const notesQueue = require('../queues/notesQueue');
const quizQueue = require('../queues/quizQueue');
const topicsQueue = require('../queues/topicsQueue');
const embeddingQueue = require('../queues/embeddingQueue');
const chapterizationService = require('../services/chapterizationService');
const jobOptions = require('../queues/jobOptions');

const transcriptionWorker = new Worker('transcription', async job => {
    const { lectureId, courseId, youtubeId, durationSecs, startTime = 0, endTime = null } = job.data;
    
    try {
        const mongoose = require('mongoose');
        
        // Verify course/lecture exist and set in_progress
        const course = await Course.findOneAndUpdate(
            { 
                _id: new mongoose.Types.ObjectId(courseId), 
                'sections.lectures._id': new mongoose.Types.ObjectId(lectureId) 
            },
            { $set: { 'sections.$[].lectures.$[lec].aiStatus.transcription': 'in_progress' } },
            { 
                arrayFilters: [{ 'lec._id': new mongoose.Types.ObjectId(lectureId) }], 
                new: true 
            }
        );

        if (!course) throw new Error('Course or lecture not found');

        const targetLecture = course.sections
            .flatMap(section => section.lectures)
            .find(lecture => lecture._id.toString() === lectureId);

        // Transcribe
        const result = await transcriptionService.transcribe(youtubeId, durationSecs, {
            title: targetLecture?.title,
            courseTitle: course.title
        });

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

        // CHECK FOR AUTO-SPLIT (Chapterization)
        // If it's a long video (>15 mins) and covers almost the whole duration (indicating it's the only lecture for this video)
        const isOneShot = durationSecs > 900 && (!startTime || startTime === 0) && (!endTime || endTime >= durationSecs);
        
        if (isOneShot) {
            console.log(`[TranscriptionWorker] Detected One-Shot lecture for ${youtubeId}. Splitting...`);
            const chapters = await chapterizationService.splitTranscript(result.fullText, durationSecs);
            
            if (chapters && chapters.length > 1) {
                // We have chapters! Replace the current lecture with multiple chapters.
                const updatedCourse = await Course.findById(courseId);
                let originalLectureIdx = -1;
                let sectionIdx = -1;
                
                updatedCourse.sections.forEach((sec, sIdx) => {
                    const lIdx = sec.lectures.findIndex(l => l._id.toString() === lectureId);
                    if (lIdx !== -1) {
                        originalLectureIdx = lIdx;
                        sectionIdx = sIdx;
                    }
                });

                if (sectionIdx !== -1) {
                    const originalLecture = updatedCourse.sections[sectionIdx].lectures[originalLectureIdx];
                    const newLectures = chapters.map((ch, idx) => ({
                        youtubeId: originalLecture.youtubeId,
                        title: ch.title,
                        duration: ch.endTime - ch.startTime,
                        startTime: ch.startTime,
                        endTime: ch.endTime,
                        order: originalLecture.order + idx,
                        thumbnailUrl: originalLecture.thumbnailUrl,
                        aiStatus: {
                            transcription: 'complete', // Already done
                            notes: 'pending',
                            quiz: 'pending',
                            topics: 'pending',
                            embedding: 'pending'
                        }
                    }));

                    // Replace the original with new ones
                    updatedCourse.sections[sectionIdx].lectures.splice(originalLectureIdx, 1, ...newLectures);
                    updatedCourse.totalLectures = updatedCourse.totalLectures - 1 + newLectures.length;
                    await updatedCourse.save();

                    // For each new lecture, we need to create its own transcript entry (filtered segments)
                    // Or just reuse the full one for now. Let's create separate ones for cleaner RAG.
                    for (const newLec of updatedCourse.sections[sectionIdx].lectures.slice(originalLectureIdx, originalLectureIdx + newLectures.length)) {
                        const filteredSegments = result.segments.filter(s => s.start >= newLec.startTime && s.start <= newLec.endTime);
                        const filteredText = filteredSegments.map(s => s.text).join(' ');
                        
                        await Transcript.create({
                            lecture: newLec._id,
                            course: courseId,
                            source: 'ai_split',
                            fullText: filteredText,
                            segments: filteredSegments,
                            durationSecs: newLec.duration
                        });

                        // Fan-out for the new lecture
                        await topicsQueue.add('generate-topics', { lectureId: newLec._id.toString(), courseId }, jobOptions);
                        await embeddingQueue.add('embed', { lectureId: newLec._id.toString(), courseId }, jobOptions);
                    }

                    return { success: true, splitInto: chapters.length };
                }
            }
        }

        // Standard fan-out if not split
        await topicsQueue.add('generate-topics', { lectureId, courseId }, jobOptions);
        await embeddingQueue.add('embed', { lectureId, courseId }, jobOptions);

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
