const { Queue } = require('bullmq');
const connection = require('./redisConnection');

const topicsQueue = new Queue('topics', { connection });

module.exports = topicsQueue;
