const { Queue } = require('bullmq');
const connection = require('./redisConnection');

const courseQueue = new Queue('course-processing', { connection });

module.exports = courseQueue;
