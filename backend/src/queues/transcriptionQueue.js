const { Queue } = require('bullmq');
const connection = require('./redisConnection'); // Assuming we'll extract redis connection

const transcriptionQueue = new Queue('transcription', { connection });

module.exports = transcriptionQueue;
