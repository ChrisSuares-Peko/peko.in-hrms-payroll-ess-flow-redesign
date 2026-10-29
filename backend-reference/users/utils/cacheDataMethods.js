/* eslint-disable no-undef */
const { createClient } = require('redis');
const ErrorResponse = require('./error-response');
const logger = require('./logger');
const { customLog } = require('./loggerHelper');

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
logger.error('Redis config', {useTls, redisHost, redisPort:process.env.REDIS_PORT})
customLog(null, "INFO", {useTls, redisHost, redisPort:process.env.REDIS_PORT})
client = createClient({
    socket: {
        host: redisHost,
        port: Number(process.env.REDIS_PORT),
        tls: useTls,
        ...(useTls && { servername: redisHost, rejectUnauthorized: false }),
        keepAlive: 10000,
        connectTimeout: 10000,
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
    } catch (err) {
        logger.error('Failed to get value from Redis:', { err });
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
        throw new ErrorResponse('something went wrong');
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

const scanKeys = async (pattern) => {
    try {
        const keys = [];
        let cursor = '0';
        do {
            const reply = await client.scan(cursor, { MATCH: pattern, COUNT: 100 });
            cursor = String(reply?.cursor ?? '0');
            keys.push(...(reply?.keys ?? []));
        } while (cursor !== '0');
        return keys;
    } catch (err) {
        logger.error('Failed to scan keys in Redis:', { err });
        throw new ErrorResponse('something went wrong');
    }
};

const getTtl = async (key) => {
    try {
        return await client.ttl(key);
    } catch (err) {
        logger.error('Failed to read TTL from Redis:', { err });
        throw new ErrorResponse('something went wrong');
    }
};

const incrementCount = async (key) => {
    try {
        const count = await client.incr(key);
        return count;
    } catch {
        throw new Error('something went wrong');
    }
};

module.exports = {
    getValue,
    setValue,
    deleteKey,
    scanKeys,
    getTtl,
    incrementCount,
    client,
}
