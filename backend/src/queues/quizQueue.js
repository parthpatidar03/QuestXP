const { Queue } = require('bullmq');
const connection = require('./redisConnection');

const quizQueue = new Queue('quiz', { connection });

module.exports = quizQueue;
