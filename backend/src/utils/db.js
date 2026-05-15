const mongoose = require('mongoose');
const { dbLogger } = require('./logger');

const connectDB = async () => {
    mongoose.connection.on('connected', () => {
        dbLogger.info('MongoDB connected to the database');
    });

    mongoose.connection.on('error', (err) => {
        dbLogger.error('MongoDB connection error', { error: err.message, stack: err.stack });
    });

    mongoose.connection.on('disconnected', () => {
        dbLogger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
        dbLogger.info('MongoDB reconnected');
    });

    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/questxp';
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
    } catch (err) {
        dbLogger.error('Initial MongoDB connection failed', { error: err.message, stack: err.stack });
        process.exit(1);
    }
};

module.exports = connectDB;
