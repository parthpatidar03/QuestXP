const Roadmap = require('../models/Roadmap');
const Course = require('../models/Course');

/**
 * Deterministic Roadmap Generation Algorithm
 * Supports separate capacities for Weekdays and Weekends
 */
/**
 * Deterministic Roadmap Generation Algorithm
 * Supports separate capacities for Weekdays and Weekends
 * Implements 75% efficiency rule (e.g. 4h goal -> 3h content)
 * Each video is a separate entry to allow granular shifting
 */
const generateRoadmapLogic = (videos, startDate, weekdayHours = 2, weekendHours = 4, excludedDays = []) => {
    // 75% efficiency target: 1 hour of goal = 45 mins of raw content
    const EFFICIENCY = 0.75;
    const weekdayMinutes = weekdayHours * 60 * EFFICIENCY;
    const weekendMinutes = weekendHours * 60 * EFFICIENCY;
    
    const roadmap = [];
    let currentDay = new Date(startDate);
    currentDay.setHours(0, 0, 0, 0);
    
    let videoIndex = 0;
    let dayCounter = 0;

    while (videoIndex < videos.length) {
        const dayOfWeek = currentDay.getDay(); // 0 = Sunday, 6 = Saturday
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        const dailyMinutes = isWeekend ? weekendMinutes : weekdayMinutes;
        
        // Handle Rest Days
        if (excludedDays.includes(dayOfWeek)) {
            roadmap.push({
                date: new Date(currentDay),
                dayIndex: dayCounter++,
                plannedVideos: [],
                totalMinutes: 0,
                isRestDay: true
            });
            currentDay.setDate(currentDay.getDate() + 1);
            continue;
        }

        let minutesAllocatedToday = 0;
        let dayHasVideos = false;

        while (videoIndex < videos.length) {
            const video = videos[videoIndex];
            // duration is stored in seconds in DB
            const durationSeconds = video.duration || video.durationMinutes || 0;
            const durationMinutes = durationSeconds / 60;

            // Allocation Rule:
            // 1. Add video if it fits in remaining capacity.
            // 2. If it's the FIRST video of the day, add it regardless.
            // 3. Each video gets its OWN entry in roadmap array to support granular +/- shifting
            if (!dayHasVideos || (minutesAllocatedToday + durationMinutes <= dailyMinutes)) {
                roadmap.push({
                    date: new Date(currentDay),
                    dayIndex: dayCounter++,
                    plannedVideos: [{
                        videoId: video._id,
                        title: video.title,
                        duration: durationSeconds,
                        playlistId: video.playlistId,
                        playlistName: video.playlistName,
                        sectionId: video.sectionId
                    }],
                    totalMinutes: durationSeconds,
                    isRestDay: false
                });
                
                minutesAllocatedToday += durationMinutes;
                videoIndex++;
                dayHasVideos = true;
                
                // Break if we've reached the capacity
                if (minutesAllocatedToday >= dailyMinutes) break;
            } else {
                // Doesn't fit, move to next calendar day
                break;
            }
        }

        currentDay.setDate(currentDay.getDate() + 1);
        
        // Safety break (approx 3 years)
        if (dayCounter > 1000) break; 
    }

    return roadmap;
};

module.exports = { generateRoadmapLogic };
