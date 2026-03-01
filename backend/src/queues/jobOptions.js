// T012 — Shared BullMQ job options for all AI pipeline queues
module.exports = {
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 5000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
};
