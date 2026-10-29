const { createClient } = require('redis');

const reconnectStrategy = (retries) => {
    const retryAttempts = Number(process.env.RETRY_ATTEMPTS) || 20;
    if (retries > retryAttempts) {
        console.error('[Redis] Too many retry attempts');
        return new Error('Too many retry attempts');
    }
    return Math.min(retries * 100, 3000);
};

const redisHost = process.env.REDIS_HOSTNAME;
const isLocal = ['localhost', '127.0.0.1'].includes(redisHost);
const useTls = !isLocal;

const client = createClient({
    socket: {
        host: redisHost,
        port: Number(process.env.REDIS_PORT),
        tls: useTls,
        ...(useTls && { servername: redisHost, rejectUnauthorized: false }),
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        enableOfflineQueue: true,
        // Forces the client to use IPv4 - common fix for VPC connectivity
        family: 4,
        keepAlive: 30000,
        noDelay: true,
        connectTimeout: 10000,
        reconnectStrategy,
    },
    ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
    username:"default"
});

client.on('error', (err) => console.error('[Redis] error:', err));
client.on('ready', () => console.log('[Redis] client connected and ready'));
client.on('end', () => console.log('[Redis] client connection ended'));
client.on('reconnecting', () => console.log('[Redis] client reconnecting'));
client.connect().catch((err) => console.error('[Redis] connect error:', err));

module.exports = { client };
