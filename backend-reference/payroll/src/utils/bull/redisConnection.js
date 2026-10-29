/**
 * Shared IORedis connections for Bull queues.
 * Mirrors the pattern in paymentGateway/utils/redisConnection.js — Bull requires
 * ioredis (not node-redis). We create named connections here so the credentials
 * queue shares one client + one subscriber instead of letting Bull spawn its own.
 *
 * Connection breakdown:
 *   sharedClient            – 1 connection (regular queue commands)
 *   credentialsSubscriber   – 1 connection (queue pub/sub)
 *   bclient                 – 1 per blocking BRPOPLPUSH call (must be unique)
 */

const IORedis = require('ioredis');

const isLocal =
    process.env.REDIS_HOSTNAME === '127.0.0.1' ||
    process.env.REDIS_HOSTNAME === 'localhost';

const redisOpts = {
    host: process.env.REDIS_HOSTNAME,
    port: Number(process.env.REDIS_PORT),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    enableOfflineQueue: true,
    // Forces the client to use IPv4 - common fix for VPC connectivity
    family: 4,
    keepAlive: 30000,
    noDelay: true,
    connectTimeout: 10000,
    retryStrategy: times => Math.min(times * 50, 2000),
    ...(isLocal
        ? {}
        : {
            password: process.env.REDIS_PASSWORD,
            tls: {
                rejectUnauthorized: false,
                // SNI is often required by VPC connectors to route traffic
                servername: process.env.REDIS_HOSTNAME,
            },
        }),
};

// One shared client for normal queue commands
const sharedClient = new IORedis({ ...redisOpts, lazyConnect: false });

// Separate subscriber for the credentials queue's pub/sub events
const credentialsSubscriber = new IORedis({ ...redisOpts, lazyConnect: false });

sharedClient.on('error', err => console.error('[REDIS] sharedClient error:', err.message));
credentialsSubscriber.on('error', err => console.error('[REDIS] credentialsSubscriber error:', err.message));

/**
 * createClient factory for the credentials Bull queue.
 * Bull calls this once per connection type during queue init.
 */
function createCredentialsClient(type) {
    switch (type) {
        case 'client':
            return sharedClient;
        case 'subscriber':
            return credentialsSubscriber;
        case 'bclient':
            // Blocking client must be a dedicated connection — never shared.
            return new IORedis({ ...redisOpts, lazyConnect: false });
        default:
            throw new Error(`[REDIS] Unexpected Bull connection type: ${type}`);
    }
}

module.exports = { createCredentialsClient };
