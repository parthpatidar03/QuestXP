require('dotenv').config();
const connectDB = require('./utils/db');
const app = require('./app');
const { serverLogger, dbLogger, jobLogger } = require('./utils/logger');

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    serverLogger.error('Unhandled Rejection at:', { promise, reason });
});

// Catch uncaught exceptions
process.on('uncaughtException', (error) => {
    serverLogger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
    process.exit(1);
});

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
    jobLogger.info('All BullMQ workers loaded successfully');
} catch (err) {
    jobLogger.error('Failed to load workers (Redis may be unavailable):', { error: err.message });
    jobLogger.warn('Server will continue without background job processing');
}

const PORT = process.env.PORT || 5000;

// Connect to DB and start server
connectDB().then(() => {
    app.listen(PORT, () => {
        serverLogger.info(`Server running on port ${PORT}`, {
            env: process.env.NODE_ENV || 'development',
            port: PORT,
            version: process.env.npm_package_version || '1.0.0'
        });
    });
});
