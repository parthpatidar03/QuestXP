const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ActiveWindow = require('../models/ActiveWindow');
const { getCircularMeanHour } = require('../algorithms/notificationEngine');
const auth = require('../middleware/auth'); // Assuming there's an auth middleware that sets req.user

// Save FCM Token and Timezone
router.post('/register', auth, async (req, res) => {
    try {
        const { fcmToken, timezone } = req.body;
        
        const updates = {};
        if (fcmToken) updates.fcmToken = fcmToken;
        if (timezone) updates.timezone = timezone;

        if (Object.keys(updates).length > 0) {
            await User.findByIdAndUpdate(req.user.id, updates);
        }
        
        res.status(200).json({ success: true, message: 'Notification settings updated' });
    } catch (error) {
        console.error('Error saving FCM token:', error);
        res.status(500).json({ success: false, error: 'Failed to update settings' });
    }
});

// Log Session Start (to feed the ML timing algorithm)
router.post('/session-start', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const currentHourUtc = now.getUTCHours();
        const dayType = [0, 6].includes(now.getUTCDay()) ? 'weekend' : 'weekday';

        // 1. Update User's lastActive timestamp
        await User.findByIdAndUpdate(userId, { lastActive: now, notificationState: 'active' });

        // 2. Update ActiveWindow Prediction
        // We'll simulate getting past 30 days sessions. In a real app we'd query the Sessions table.
        // For now, we exponentially move the average towards the current hour.
        
        let window = await ActiveWindow.findOne({ userId, dayType });
        if (!window) {
            window = new ActiveWindow({ userId, dayType, bestHourUtc: currentHourUtc, confidence: 0.1 });
        } else {
            // Recalculate using circular mean. 
            // Mock: 80% weight to old average, 20% to new session
            const newMean = getCircularMeanHour([window.bestHourUtc, window.bestHourUtc, window.bestHourUtc, window.bestHourUtc, currentHourUtc]);
            window.bestHourUtc = newMean;
            window.confidence = Math.min(1.0, window.confidence + 0.05);
            window.lastUpdated = now;
        }
        await window.save();

        res.status(200).json({ success: true, predictedBestHour: window.bestHourUtc });
    } catch (error) {
        console.error('Error logging session:', error);
        res.status(500).json({ success: false, error: 'Failed to log session' });
    }
});

module.exports = router;
