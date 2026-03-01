const { Queue } = require('bullmq');
const connection = require('./redisConnection');

const notesQueue = new Queue('notes', { connection });

module.exports = notesQueue;
