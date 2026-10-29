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
        keepAlive: 5000,
        reconnectStrategy,
    },
    password: process.env.REDIS_PASSWORD,
});

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

let deleteValue = async (key) => {
    try {
        await client.del(key);
    } catch (error) {
        throw new ErrorResponse('something went wrong');
    }
};

module.exports = {
    getValue,
    setValue,
    deleteValue,
    client,
}
