const { Worker } = require('bullmq');
const axios = require('axios');
const Course = require('../models/Course');
const connection = require('../queues/redisConnection');

console.log('[CourseProcessor] Loaded YouTube Data API playlist importer');

const courseProcessor = new Worker('course-processing', async job => {
    const { courseId, sections, isAppend = false } = job.data;

    try {
        let totalLecturesIncrement = 0;
        let totalDurationIncrement = 0;
        const processedSections = [];

        for (const section of sections) {
            let playlistItems = [];
            try {
                const isPlaylist = section.playlistUrl.includes('list=');
                const apiKey = process.env.YOUTUBE_API_KEY;
                if (!apiKey) throw new Error('YOUTUBE_API_KEY missing in .env');

                if (isPlaylist) {
                    const playlistId = section.playlistUrl.split('list=')[1].split('&')[0];
                    
                    // Paginate through ALL playlist items (YouTube API caps at 50 per page)
                    let allPlaylistItems = [];
                    let nextPageToken = null;
                    do {
                        const params = {
                            part: 'snippet,contentDetails',
                            maxResults: 50,
                            playlistId: playlistId,
                            key: apiKey
                        };
                        if (nextPageToken) params.pageToken = nextPageToken;

                        const response = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', { params });
                        allPlaylistItems.push(...response.data.items);
                        nextPageToken = response.data.nextPageToken || null;
                    } while (nextPageToken);

                    // Fetch durations in batches of 50 (videos endpoint also caps at 50 IDs)
                    const durationsMap = {};
                    for (let i = 0; i < allPlaylistItems.length; i += 50) {
                        const batch = allPlaylistItems.slice(i, i + 50);
                        const videoIds = batch.map(item => item.contentDetails.videoId).join(',');
                        const videoResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
                            params: {
                                part: 'contentDetails',
                                id: videoIds,
                                key: apiKey
                            }
                        });
                        videoResponse.data.items.forEach(v => {
                            const duration = v.contentDetails.duration;
                            const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                            const hours = parseInt(match[1] || 0);
                            const minutes = parseInt(match[2] || 0);
                            const seconds = parseInt(match[3] || 0);
                            durationsMap[v.id] = hours * 3600 + minutes * 60 + seconds;
                        });
                    }

                    // Smart split decision: playlists with >5 videos = each video is its own entity
                    const skipSplitting = allPlaylistItems.length > 5;

                    playlistItems = allPlaylistItems.map(item => ({
                        id: item.contentDetails.videoId,
                        title: item.snippet.title,
                        durationSec: durationsMap[item.contentDetails.videoId] || 0,
                        bestThumbnail: { url: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url },
                        isFromPlaylist: skipSplitting
                    }));
                } else {
                    // Single Video Logic
                    let videoId;
                    if (section.playlistUrl.includes('v=')) {
                        videoId = section.playlistUrl.split('v=')[1].split('&')[0];
                    } else if (section.playlistUrl.includes('youtu.be/')) {
                        videoId = section.playlistUrl.split('youtu.be/')[1].split('?')[0];
                    } else {
                        videoId = section.playlistUrl;
                    }

                    const videoResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
                        params: {
                            part: 'snippet,contentDetails',
                            id: videoId,
                            key: apiKey
                        }
                    });

                    if (!videoResponse.data.items.length) throw new Error('Video not found');
                    const video = videoResponse.data.items[0];
                    
                    const duration = video.contentDetails.duration;
                    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                    const totalDurationSec = parseInt(match[1] || 0) * 3600 + parseInt(match[2] || 0) * 60 + parseInt(match[3] || 0);

                    // Parse timestamps from description
                    const description = video.snippet.description;
                    const timestampRegex = /(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\s+-\s+(.+)|(.+)\s+-\s+(?:(\d{1,2}):)?(\d{1,2}):(\d{2})|(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\s+(.+)/g;
                    let matches;
                    const timestamps = [];
                    
                    // Simple timestamp parser for common formats (00:00 Intro or 00:00:00 Intro)
                    const simpleRegex = /(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\s+(.+)/g;
                    while ((matches = simpleRegex.exec(description)) !== null) {
                        const h = parseInt(matches[1] || 0);
                        const m = parseInt(matches[2] || 0);
                        const s = parseInt(matches[3] || 0);
                        const timeInSec = h * 3600 + m * 60 + s;
                        timestamps.push({ time: timeInSec, title: matches[4].trim() });
                    }

                    if (timestamps.length > 1) {
                        // Create lectures based on timestamps
                        playlistItems = timestamps.map((ts, idx) => {
                            const nextTime = timestamps[idx + 1]?.time || totalDurationSec;
                            return {
                                id: videoId,
                                title: ts.title,
                                startTime: ts.time,
                                endTime: nextTime,
                                durationSec: nextTime - ts.time,
                                bestThumbnail: { url: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url }
                            };
                        });
                    } else {
                        // Single lecture
                        playlistItems = [{
                            id: videoId,
                            title: video.snippet.title,
                            durationSec: totalDurationSec,
                            startTime: 0,
                            endTime: totalDurationSec,
                            bestThumbnail: { url: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url }
                        }];
                    }
                }

            } catch (err) {
                console.error(`YouTube API Error for ${section.playlistUrl}:`, err.response?.data || err.message);
                throw new Error(`Invalid or private playlist: ${section.playlistUrl}`);
            }

            const lectures = playlistItems.map((item, index) => {
                const durationSecs = item.durationSec || 0;
                totalLecturesIncrement += 1;
                totalDurationIncrement += durationSecs;

                return {
                    youtubeId: item.id,
                    title: item.title,
                    duration: durationSecs,
                    startTime: item.startTime || 0,
                    endTime: item.endTime || null,
                    order: index,
                    thumbnailUrl: item.bestThumbnail?.url,
                    isFromPlaylist: item.isFromPlaylist || false,
                    aiStatus: {
                        transcription: 'pending',
                        quiz: 'pending',
                        topics: 'pending',
                        embedding: 'pending'
                    }
                };
            });

            processedSections.push({
                title: section.title,
                playlistUrl: section.playlistUrl,
                order: section.order || 0,
                lectures
            });
        }

        let course;
        if (isAppend) {
            // Append mode: Push new sections and update totals
            course = await Course.findById(courseId);
            if (!course) throw new Error('Course not found');
            
            course.sections.push(...processedSections);
            course.totalLectures = (course.totalLectures || 0) + totalLecturesIncrement;
            course.totalDuration = (course.totalDuration || 0) + totalDurationIncrement;
            course.status = 'ready';
            await course.save();
        } else {
            // Replace mode (Creation)
            course = await Course.findByIdAndUpdate(courseId, {
                sections: processedSections,
                status: 'ready',
                totalLectures: totalLecturesIncrement,
                totalDuration: totalDurationIncrement
            }, { new: true });
        }

        // Fan-out to transcription queue for ONLY THE NEW LECTURES
        const transcriptionQueue = require('../queues/transcriptionQueue');
        const jobOptions = require('../queues/jobOptions');
        
        for (const section of processedSections) {
            // We need to find the actual saved lecture subdocs to get their _ids
            const savedSection = course.sections.find(s => s.playlistUrl === section.playlistUrl);
            if (!savedSection) continue;

            for (const lecture of savedSection.lectures) {
                await transcriptionQueue.add('transcribe', {
                    courseId: course._id.toString(),
                    lectureId: lecture._id.toString(),
                    youtubeId: lecture.youtubeId,
                    durationSecs: lecture.duration,
                    startTime: lecture.startTime,
                    endTime: lecture.endTime,
                    isFromPlaylist: lecture.isFromPlaylist || false
                }, jobOptions);
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
