const mongoose = require('mongoose');
const { dbLogger } = require('./logger');

const connectDB = async () => {
    // CRITICAL: when Mongo is unreachable, fail queries immediately instead of
    // buffering them. With buffering on (default), every DB call hangs for
    // up to ~30s, which freezes the UI and burns axios timeouts. With
    // buffering off, queries reject with `MongooseError: Operation buffering
    // disabled` within milliseconds and the API returns a clean 5xx fast.
    mongoose.set('bufferCommands', false);

    mongoose.connection.on('connected',     () => dbLogger.info('MongoDB connected'));
    mongoose.connection.on('error',         (err) => dbLogger.error('MongoDB error', { error: err.message }));
    mongoose.connection.on('disconnected',  () => dbLogger.warn('MongoDB disconnected'));
    mongoose.connection.on('reconnected',   () => dbLogger.info('MongoDB reconnected'));

    try {
        // Accept either MONGO_URI or MONGODB_URI (historic naming inconsistency).
        const uri = process.env.MONGO_URI
            || process.env.MONGODB_URI
            || 'mongodb://localhost:27017/questxp';
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            // Don't deadlock the startup sequence — fail loudly and let the
            // operator decide what to do.
            connectTimeoutMS: 8000,
            // Azure load balancers silently drop idle TCP connections after 4 minutes.
            // Send keep-alive packets every 3 minutes to keep the connection alive.
            keepAliveInitialDelay: 180000,
        });
    } catch (err) {
        dbLogger.error('Initial MongoDB connection failed', { error: err.message });
        // Keep the process alive in dev so the developer can read the error
        // and start Mongo without a restart. In production we exit so the
        // platform restarts us.
        if (process.env.NODE_ENV === 'production') process.exit(1);
    }
};

module.exports = connectDB;
