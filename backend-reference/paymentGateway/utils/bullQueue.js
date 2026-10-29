/**
 * Bull Queue Configuration
 * Separate queues for Bondio and Tunz eSIM vendors.
 * Uses shared IORedis connections (see redisConnection.js) instead of letting
 * Bull spawn its own — required by Bull docs and avoids duplicate connections.
 */

const Queue = require('bull');
const { createBondioClient, createTunzClient } = require('./redisConnection');

const bondioQueue = new Queue('esim-bondio-payments', {
  createClient: createBondioClient,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: true,
  },
});

const tunzQueue = new Queue('esim-tunz-payments', {
  createClient: createTunzClient,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: true,
  },
});

// Connection event handlers for Bondio
bondioQueue.on('error', err => {
  console.error('[BULL QUEUE ERROR] Bondio Queue:', err);
});

bondioQueue.on('connect', () => {
  console.log('[BULL QUEUE] Bondio Queue connected to Redis');
});

bondioQueue.on('disconnect', () => {
  console.warn('[BULL QUEUE] Bondio Queue disconnected from Redis - reconnecting...');
});

bondioQueue.on('ready', () => {
  console.log('[BULL QUEUE] Bondio Queue ready');
});

// Connection event handlers for Tunz
tunzQueue.on('error', err => {
  console.error('[BULL QUEUE ERROR] Tunz Queue:', err);
});

tunzQueue.on('connect', () => {
  console.log('[BULL QUEUE] Tunz Queue connected to Redis');
});

tunzQueue.on('disconnect', () => {
  console.warn('[BULL QUEUE] Tunz Queue disconnected from Redis - reconnecting...');
});

tunzQueue.on('ready', () => {
  console.log('[BULL QUEUE] Tunz Queue ready');
});

module.exports = {
  bondioQueue,
  tunzQueue,
};
