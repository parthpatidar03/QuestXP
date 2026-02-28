require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

// Ensure BullMQ workers are loaded and running
require('./workers/courseProcessor');
require('./workers/streakWorker');

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
