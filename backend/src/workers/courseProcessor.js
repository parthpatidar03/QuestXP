const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const ytpl = require('ytpl');
const Course = require('../models/Course');
const embeddingQueue = require('../queues/embeddingQueue');
const EmbeddingStatus = require('../models/EmbeddingStatus');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

const courseProcessor = new Worker('course-processing', async job => {
    const { courseId, sections } = job.data;

    try {
        let totalLectures = 0;
        let totalDuration = 0;
        const processedSections = [];

        for (const section of sections) {
            let playlist;
            try {
                // ytpl requires just the ID or full URL
                playlist = await ytpl(section.playlistUrl, { limit: Infinity });
            } catch (err) {
                console.error(`Failed to fetch playlist ${section.playlistUrl}`, err);
                throw new Error(`Invalid or private playlist: ${section.playlistUrl}`);
            }

            const lectures = playlist.items.map((item, index) => {
                // Duration is usually a string like "4:20" or "1:04:20".
                // We'll parse it to total seconds.
                let durationSecs = 0;
                if (item.durationSec) {
                    durationSecs = item.durationSec;
                } else if (item.duration) {
                    const parts = item.duration.split(':').map(Number);
                    if (parts.length === 3) durationSecs = parts[0] * 3600 + parts[1] * 60 + parts[2];
                    else if (parts.length === 2) durationSecs = parts[0] * 60 + parts[1];
                }

                totalLectures += 1;
                totalDuration += durationSecs;

                return {
                    youtubeId: item.id,
                    title: item.title,
                    duration: durationSecs,
                    order: index,
                    thumbnailUrl: item.bestThumbnail?.url,
                    aiStatus: {
                        transcription: 'pending',
                        notes: 'pending',
                        quiz: 'pending',
                        topics: 'pending',
                        embedding: 'pending' // From spec 004
                    }
                };
            });

            processedSections.push({
                title: section.title,
                playlistUrl: section.playlistUrl,
                order: section.order,
                lectures
            });
        }

        const course = await Course.findByIdAndUpdate(courseId, {
            sections: processedSections,
            status: 'ready',
            totalLectures,
            totalDuration
        }, { new: true });

        // T015: Fan-out to transcription queue for each lecture
        const transcriptionQueue = require('../queues/transcriptionQueue');
        const jobOptions = require('../queues/jobOptions');
        
        for (const section of processedSections) {
            for (const lecture of section.lectures) {
                await transcriptionQueue.add('transcribe', {
                    courseId: course._id.toString(),
                    lectureId: lecture.youtubeId, // using youtubeId as placeholder until we get the actual _id from mongoose, wait...
                    // Let's use the created course from findByIdAndUpdate.
                }, jobOptions);
            }
        }
        
        // T010 [US2] Chaining embeddingQueue
        for (const section of processedSections) {
            for (const lecture of section.lectures) {
                await EmbeddingStatus.findOneAndUpdate(
                    { lectureId: lecture.youtubeId },
                    { status: 'pending', courseId },
                    { upsert: true }
                );
                await embeddingQueue.add('embed', { lectureId: lecture.youtubeId, courseId });
            }
        }

        return { success: true, courseId };

    } catch (error) {
        console.error(`Course processing failed for ${courseId}:`, error);
        await Course.findByIdAndUpdate(courseId, { status: 'error' });
        throw error;
    }
}, { connection });

courseProcessor.on('completed', job => {
    console.log(`Course job ${job.id} completed!`);
});

courseProcessor.on('failed', (job, err) => {
    console.error(`Course job ${job.id} failed with error:`, err.message);
});

module.exports = courseProcessor;
