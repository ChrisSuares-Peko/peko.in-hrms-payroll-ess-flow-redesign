/* eslint-disable no-undef */
const { createClient } = require('redis');
const ErrorResponse = require('./error-response');
const logger = require('../utils/logger');

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
        const value = await client.get(key);
        if (!value) return null;

        return value;
    } catch (error) {
        logger.error("Failed to get value in Redis:", { error });
        throw new ErrorResponse("something went wrong");
    }
};

let setValue = async (key, expiry, value) => {
    try {
        const stringValue =
            typeof value === 'string'
                ? value
                : JSON.stringify(value);

        if (!expiry || expiry === Infinity) {
            await client.set(key, stringValue);
        } else {
            await client.set(key, stringValue, {
                EX: expiry
            });
        }
    } catch (error) {
        logger.error("Failed to set value in Redis:", { error });
        throw new ErrorResponse("something went wrong");
    }
};

let deleteValue = async (key) => {
    try {
        await client.del(key);
    } catch (error) {
        logger.error("Failed to delete value in Redis:", { error });
    }
};

let addToSet = async (key, member) => {
    try {
        await client.sAdd(key, member);
    } catch (error) {
        logger.error('Failed to add to set in Redis:', { error });
        throw new ErrorResponse('something went wrong');
    }
};

let removeFromSet = async (key, member) => {
    try {
        await client.sRem(key, member);
    } catch (error) {
        logger.error('Failed to remove from set in Redis:', { error });
    }
};

let getSetMembers = async (key) => {
    try {
        return await client.sMembers(key);
    } catch (error) {
        logger.error('Failed to get set members from Redis:', { error });
        return [];
    }
};

module.exports = {
    getValue,
    setValue,
    deleteValue,
    addToSet,
    removeFromSet,
    getSetMembers,
    client,
}
