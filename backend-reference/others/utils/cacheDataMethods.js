/* eslint-disable no-undef */
const { createClient } = require('redis');
const ErrorResponse = require('./error-response');
const logger = require('./logger');

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
        keepAlive: 5000,
        reconnectStrategy,
    },
    password: process.env.REDIS_PASSWORD,
});

client.on('error', (err) => {
    logger.error('Redis error', { error: err });
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
        logger.error('Failed to get value in Redis:', { error });
        throw new ErrorResponse('something went wrong');
    }
};

let setValue = async (key, expiry, value) => {
    try {
        if (expiry === 0 || expiry === null || expiry === Infinity) {
            await client.set(key, value);
        } else {
            await client.setEx(key, expiry, value);
        }
    } catch (err) {
        logger.error('Failed to set value in Redis:', { err });
        throw new ErrorResponse('Something went wrong');
    }
};

let deleteKey = async (key) => {
    try {
        await client.del(key);
    } catch (err) {
        console.error('Error deleting key from Redis:', err);
        throw new Error('Something went wrong');
    }
};

const incrementCount = async (key) => {
    try {
        const count = await client.incr(key);
        return count;
    } catch (error) {
        throw new Error('something went wrong');
    }
};

const storeSearch = async (userId, query) => {
    const key = `search_history:${userId}`;
    await client.lRem(key, 0, query);
    await client.lPush(key, query);
    await client.lTrim(key, 0, 9);
    await client.expire(key, 60 * 60 * 24 * 30);
};

let getRecentSearches = async (userId) => {
    try {
        const key = `search_history:${userId}`;
        const searches = await client.lRange(key, 0, 9);
        return searches;
    } catch (error) {
        logger.error('Failed to get value from Redis:', { error });
        throw new ErrorResponse('something went wrong');
    }
};

module.exports = {
    getValue,
    setValue,
    storeSearch,
    getRecentSearches,
    deleteKey,
    incrementCount,
    client,
}
