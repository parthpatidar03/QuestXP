const mongoose = require('mongoose');

const RoadmapSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    config: {
        startDate: { type: Date, default: Date.now },
        targetDate: Date,
        dailyHours: { type: Number, default: 2 },
        excludedDays: [Number], // 0-6
        playlistIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
    },
    days: [{
        date: Date,
        dayIndex: Number,
        isRestDay: { type: Boolean, default: false },
        plannedVideos: [{
            videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
            title: String,
            duration: Number,
            playlistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
            playlistName: String
        }],
        totalMinutes: Number
    }],
    status: {
        type: String,
        enum: ['active', 'completed', 'archived'],
        default: 'active'
    }
}, { timestamps: true });

module.exports = mongoose.model('Roadmap', RoadmapSchema);
