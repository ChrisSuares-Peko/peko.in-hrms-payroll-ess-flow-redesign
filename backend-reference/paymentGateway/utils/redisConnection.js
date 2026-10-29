/**
 * Shared IORedis connections for Bull queues.
 * Bull requires ioredis (not node-redis). We create named connections here
 * so both queues share one client + one subscriber instead of spawning 3
 * connections each (6 total).
 *
 * Connection breakdown with this approach:
 *   sharedClient     – 1 connection (shared by both queues for regular commands)
 *   bondioSubscriber – 1 connection (bondio queue pub/sub)
 *   tunzSubscriber   – 1 connection (tunz queue pub/sub)
 *   bclient          – 1 per queue, created fresh (blocking BRPOPLPUSH, must be unique)
 * Total: 5 vs previous 6.
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
    ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
    ...(isLocal
        ? {}
        : {
            tls: { rejectUnauthorized: false,
            // SNI is often required by VPC connectors to route traffic
            servername: process.env.REDIS_HOSTNAME
            },
        }),
};

// One shared client for normal queue commands (both queues reuse this)
const sharedClient = new IORedis({ ...redisOpts, lazyConnect: false });

// Separate subscriber per queue — Bull subscribes to different keyspace channels
// per queue name, so mixing them on one connection risks missed events.
const bondioSubscriber = new IORedis({ ...redisOpts, lazyConnect: false });
const tunzSubscriber = new IORedis({ ...redisOpts, lazyConnect: false });

sharedClient.on('error', err => console.error('[REDIS] sharedClient error:', err.message));
bondioSubscriber.on('error', err => console.error('[REDIS] bondioSubscriber error:', err.message));
tunzSubscriber.on('error', err => console.error('[REDIS] tunzSubscriber error:', err.message));

/**
 * createClient factory for the Bondio Bull queue.
 * Bull calls this once per connection type during queue init.
 */
function createBondioClient(type) {
    switch (type) {
        case 'client':
            return sharedClient;
        case 'subscriber':
            return bondioSubscriber;
        case 'bclient':
            // Blocking client must be a dedicated connection — never shared.
            return new IORedis({ ...redisOpts, lazyConnect: false });
        default:
            throw new Error(`[REDIS] Unexpected Bull connection type: ${type}`);
    }
}

/**
 * createClient factory for the Tunz Bull queue.
 */
function createTunzClient(type) {
    switch (type) {
        case 'client':
            return sharedClient;
        case 'subscriber':
            return tunzSubscriber;
        case 'bclient':
            return new IORedis({ ...redisOpts, lazyConnect: false });
        default:
            throw new Error(`[REDIS] Unexpected Bull connection type: ${type}`);
    }
}

module.exports = { createBondioClient, createTunzClient };
