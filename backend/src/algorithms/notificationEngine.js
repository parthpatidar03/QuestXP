const ActiveWindow = require('../models/ActiveWindow');
const User = require('../models/User');

// Calculates the mean hour of engagement using circular statistics
function getCircularMeanHour(hours) {
    if (!hours || hours.length === 0) return 18; // Default 6 PM UTC

    let sumSin = 0;
    let sumCos = 0;

    hours.forEach(hour => {
        // Convert hour to angle (0-23 hours -> 0-360 degrees in radians)
        const angle = (hour / 24) * 2 * Math.PI;
        sumSin += Math.sin(angle);
        sumCos += Math.cos(angle);
    });

    const meanAngle = Math.atan2(sumSin / hours.length, sumCos / hours.length);
    let meanHour = (meanAngle / (2 * Math.PI)) * 24;
    
    if (meanHour < 0) meanHour += 24;
    return Math.round(meanHour);
}

// Determines the notification tone based on days of inactivity
function determineTone(lastActiveDate) {
    if (!lastActiveDate) return 'friendly';
    
    const diffHours = (Date.now() - new Date(lastActiveDate).getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) return 'playful';
    if (diffHours < 72) return 'sarcastic';
    if (diffHours < 168) return 'dramatic'; // 7 days
    if (diffHours < 336) return 'passive_aggressive'; // 14 days
    return 'soft_goodbye';
}

module.exports = {
    getCircularMeanHour,
    determineTone
};
