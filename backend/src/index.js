require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

// Load BullMQ workers gracefully — don't crash server if Redis is unavailable
try {
    require('./workers/courseProcessor');
    require('./workers/transcriptionWorker');
    require('./workers/notesWorker');
    require('./workers/quizWorker');
    require('./workers/topicsWorker');
    require('./workers/embeddingWorker');
    require('./workers/streakWorker');
    require('./workers/notificationWorker');
    require('./workers/notificationScheduler');
    console.log('[Workers] All BullMQ workers loaded successfully');
} catch (err) {
    console.error('[Workers] Failed to load workers (Redis may be unavailable):', err.message);
    console.warn('[Workers] Server will continue without background job processing');
}

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/questxp')
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });
