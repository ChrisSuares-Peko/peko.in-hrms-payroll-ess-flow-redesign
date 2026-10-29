/* eslint-disable no-undef */
const { createClient } = require('redis');
const ErrorResponse = require('./error-response');

let client;

const reconnectStrategy = (retries) => {
    const retryAttempts = Number(process.env.RETRY_ATTEMPTS) || 20;
    if (retries > retryAttempts) {
        console.error('Too many retry attempts');
        return new Error('Too many retry attempts');
    }
    console.log(`ATTEMPTS : ${retries}`);
    return Math.min(retries * 100, 3000);
};

const redisHost = process.env.REDIS_HOSTNAME;
const isLocalRedisHost = ['localhost', '127.0.0.1'].includes(redisHost);

const useTls = !isLocalRedisHost;

client = createClient({
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
    password: process.env.REDIS_PASSWORD,
    username:"default"
});
console.log(isLocalRedisHost,"isLocalRedisHost")
client.on('error', (err) => {
    console.error('Redis error:', err);
});

client.on('ready', () => {
    console.log('Redis client connected and ready');
});

client.on('end', () => {
    console.log('Redis client connection ended');
});

client.on('reconnecting', () => {
    console.log('Redis client reconnecting');
});

client.connect().catch((err) => console.error('Redis connect error:', err));

let getValue = async (key) => {
    try {
        return await client.get(key);
    } catch (error) {
        throw new ErrorResponse('something went wrong');
    }
};

let setValue = async (key, expiry, value) => {
    try {
        if (!expiry || expiry === Infinity) {
            await client.set(key, value);
        } else {
            await client.set(key, value, { EX: expiry });
        }
    } catch (error) {
        throw new ErrorResponse('something went wrong');
    }
};

const trackBatchProgress = async (batchId, totalExpected, ttl = 300) => {
    try {
        const redisKey = `batch:progress:${batchId}`;
        const currentCount = await client.incr(redisKey);
        if (currentCount === 1) {
            await client.expire(redisKey, ttl);
        }
        return currentCount === Number(totalExpected);
    } catch (err) {
        console.error('Error tracking batch progress:', err);
        return false;
    }
};

const trackCounterProgress = async (key, total, ttl = 600) => {
    try {
        const currentCount = await client.incr(key);
        if (currentCount === 1) {
            await client.expire(key, ttl);
        }
        return currentCount === Number(total);
    } catch (err) {
        console.error('Error tracking counter progress:', err);
        return false;
    }
};

const pushToList = async (key, value, ttl = 600) => {
    try {
        const len = await client.rPush(key, value);
        if (len === 1) {
            await client.expire(key, ttl);
        }
        return len;
    } catch (err) {
        console.error('Error pushing to list:', err);
        return null;
    }
};

const getList = async (key) => {
    try {
        return await client.lRange(key, 0, -1);
    } catch (err) {
        console.error('Error getting list:', err);
        return [];
    }
};

module.exports = {
    getValue,
    setValue,
    trackBatchProgress,
    trackCounterProgress,
    pushToList,
    getList,
    client,
}
