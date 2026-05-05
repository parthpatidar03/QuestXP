const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const axios = require('axios');

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
            let playlistItems = [];
            try {
                const playlistId = section.playlistUrl.includes('list=') 
                    ? section.playlistUrl.split('list=')[1].split('&')[0]
                    : section.playlistUrl;

                // Official YouTube API Call
                const apiKey = process.env.YOUTUBE_API_KEY;
                if (!apiKey) throw new Error('YOUTUBE_API_KEY missing in .env');

                const response = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
                    params: {
                        part: 'snippet,contentDetails',
                        maxResults: 50,
                        playlistId: playlistId,
                        key: apiKey
                    }
                });

                const videoIds = response.data.items.map(item => item.contentDetails.videoId).join(',');
                
                // Get Durations
                const videoResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
                    params: {
                        part: 'contentDetails',
                        id: videoIds,
                        key: apiKey
                    }
                });

                const durationsMap = {};
                videoResponse.data.items.forEach(v => {
                    // Simple ISO 8601 duration parser (e.g. PT1M30S)
                    const duration = v.contentDetails.duration;
                    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                    const hours = parseInt(match[1] || 0);
                    const minutes = parseInt(match[2] || 0);
                    const seconds = parseInt(match[3] || 0);
                    durationsMap[v.id] = hours * 3600 + minutes * 60 + seconds;
                });

                playlistItems = response.data.items.map(item => ({
                    id: item.contentDetails.videoId,
                    title: item.snippet.title,
                    durationSec: durationsMap[item.contentDetails.videoId] || 0,
                    bestThumbnail: { url: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url }
                }));

            } catch (err) {
                console.error(`YouTube API Error for ${section.playlistUrl}:`, err.response?.data || err.message);
                throw new Error(`Invalid or private playlist: ${section.playlistUrl}`);
            }

            const lectures = playlistItems.map((item, index) => {
                const durationSecs = item.durationSec || 0;

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
