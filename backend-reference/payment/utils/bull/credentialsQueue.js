const Queue = require('bull');
const { createCredentialsClient } = require('./redisConnection');

const QUEUE_NAME = process.env.VENDOR_CREDS_QUEUE_NAME || 'payroll-vendor-credentials';

const credentialsQueue = new Queue(QUEUE_NAME, {
    createClient: createCredentialsClient,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: true,
    },
});

credentialsQueue.on('error', err => console.error('[BULL QUEUE ERROR] Credentials Queue:', err));
credentialsQueue.on('connect', () => console.log('[BULL QUEUE] Credentials Queue connected to Redis'));
credentialsQueue.on('ready', () => console.log(`[BULL QUEUE] Credentials Queue ready — listening on "${QUEUE_NAME}"`));

module.exports = credentialsQueue;
