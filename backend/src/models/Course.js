const mongoose = require('mongoose');
const { Schema } = mongoose;

const courseSchema = new Schema({
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    status: { type: String, enum: ['processing', 'ready', 'error'], default: 'processing' },
    sections: [{
        title: { type: String, required: true },
        playlistUrl: { type: String, required: true },
        order: { type: Number, required: true },
        lectures: [{
            youtubeId: { type: String, required: true },
            title: { type: String, required: true },
            duration: { type: Number, required: true },
            order: { type: Number, required: true },
            thumbnailUrl: { type: String },
            aiStatus: {
                transcription: { type: String, enum: ['pending', 'in_progress', 'complete', 'failed'], default: 'pending' },
                notes: { type: String, enum: ['pending', 'in_progress', 'complete', 'failed'], default: 'pending' },
                quiz: { type: String, enum: ['pending', 'in_progress', 'complete', 'failed'], default: 'pending' },
                topics: { type: String, enum: ['pending', 'in_progress', 'complete', 'failed'], default: 'pending' },
                embedding: { type: String, enum: ['pending', 'in_progress', 'complete', 'failed'], default: 'pending' },
                errorReason: { type: String, default: null },
            },
            topics: [{
                title: { type: String },
                startTime: { type: Number },
            }],
        }],
    }],
    totalLectures: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

courseSchema.index({ owner: 1 });
courseSchema.index({ owner: 1, status: 1 });

module.exports = mongoose.model('Course', courseSchema);
