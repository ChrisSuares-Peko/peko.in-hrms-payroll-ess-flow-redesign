/* eslint-disable no-undef */
const { createClient } = require('redis');

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

// Handle Redis client errors to prevent app from crashing
client.on('error', (err) => {
    console.log(err);
});

client.on('ready', () => {
    console.log('Redis client connected and ready');
});

client.on('end', () => {
    console.log('Redis client connection ended');
});

client.on('reconnecting', () => {
    console.log("Redis client reconnecting");
});

client.connect().catch((err) => console.error('Redis connect error:', err));

let getValue = async (key) => {
    try {
        return await client.get(key);
    } catch (error) {
        console.log(error);
        return null;
    }
};

let setValue = async (key, expiry, value) => {
    try {
        if (expiry === 0 || expiry === null || expiry === Infinity) {
            await client.set(key, value);
        } else {
            await client.setEx(key, expiry, value);
        }
    } catch (error) {
        console.log(error)
        return null;
    }
    
};
module.exports = {
    getValue,
    setValue,
    client
}