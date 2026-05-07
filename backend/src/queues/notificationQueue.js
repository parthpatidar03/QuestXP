const { Queue } = require('bullmq');
const connection = require('./redisConnection');

const notificationSchedulerQueue = new Queue('notificationSchedulerQueue', { connection });
const notificationGeneratorQueue = new Queue('notificationGeneratorQueue', { connection });
const notificationDeliveryQueue = new Queue('notificationDeliveryQueue', { connection });

module.exports = {
    notificationSchedulerQueue,
    notificationGeneratorQueue,
    notificationDeliveryQueue
};
