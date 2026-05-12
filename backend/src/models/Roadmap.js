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
        weekdayHours: { type: Number, default: 2 },
        weekendHours: { type: Number, default: 4 },
        excludedDays: [Number], // 0-6
        playlistIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
        sectionIds: [String] // IDs of specific playlists/sections
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    days: [{
        date: Date,
        dayIndex: Number,
        isRestDay: { type: Boolean, default: false },
        plannedVideos: [{
            videoId: { type: mongoose.Schema.Types.ObjectId },
            title: String,
            duration: Number,
            playlistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
            playlistName: String,
            completed: { type: Boolean, default: false }
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
