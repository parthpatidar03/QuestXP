const Roadmap = require('../models/Roadmap');
const Video = require('../models/Video'); // Assuming Video model exists
const Playlist = require('../models/Playlist');

/**
 * Deterministic Roadmap Generation Algorithm
 */
const generateRoadmapLogic = (videos, startDate, dailyHours, excludedDays = []) => {
    const dailyMinutes = dailyHours * 60;
    const roadmap = [];
    let currentDay = new Date(startDate);
    currentDay.setHours(0, 0, 0, 0);
    
    let videoIndex = 0;
    let dayCounter = 0;

    while (videoIndex < videos.length) {
        const dayOfWeek = currentDay.getDay();
        
        // Handle Rest Days
        if (excludedDays.includes(dayOfWeek)) {
            roadmap.push({
                date: new Date(currentDay),
                dayIndex: dayCounter,
                plannedVideos: [],
                totalMinutes: 0,
                isRestDay: true
            });
            currentDay.setDate(currentDay.getDate() + 1);
            dayCounter++;
            continue;
        }

        let minutesAllocatedToday = 0;
        const dayVideos = [];

        while (videoIndex < videos.length) {
            const video = videos[videoIndex];
            const duration = video.duration || video.durationMinutes || 0;

            // Allocation Rule:
            // 1. Add video if it fits in remaining time.
            // 2. If it's the FIRST video of the day, add it regardless (to prevent blockages).
            // 3. Otherwise, carry over to next day.
            if (dayVideos.length === 0 || (minutesAllocatedToday + duration <= dailyMinutes)) {
                dayVideos.push({
                    videoId: video._id,
                    title: video.title,
                    duration: duration,
                    playlistId: video.playlistId,
                    playlistName: video.playlistName
                });
                minutesAllocatedToday += duration;
                videoIndex++;
                
                // Break if we've reached the capacity (approx)
                if (minutesAllocatedToday >= dailyMinutes) break;
            } else {
                break;
            }
        }

        roadmap.push({
            date: new Date(currentDay),
            dayIndex: dayCounter,
            plannedVideos: dayVideos,
            totalMinutes: minutesAllocatedToday,
            isRestDay: false
        });

        currentDay.setDate(currentDay.getDate() + 1);
        dayCounter++;
        
        // Safety break
        if (dayCounter > 365) break; 
    }

    return roadmap;
};

module.exports = { generateRoadmapLogic };
