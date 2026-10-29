const Queue = require('bull');
const { createCredentialsClient } = require('./redisConnection');

const QUEUE_NAME = process.env.VENDOR_CREDS_QUEUE_NAME || 'payroll-vendor-credentials';

const credentialsQueue = new Queue(QUEUE_NAME, {
    createClient: createCredentialsClient,
});

credentialsQueue.on('error', err => console.error('[BULL QUEUE ERROR] Credentials Queue:', err));
credentialsQueue.on('ready', () => console.log(`[BULL QUEUE] Credentials Queue ready — producing to "${QUEUE_NAME}"`));

module.exports = credentialsQueue;
