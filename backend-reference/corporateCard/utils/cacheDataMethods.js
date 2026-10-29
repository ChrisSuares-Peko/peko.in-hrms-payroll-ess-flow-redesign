const { createClient } = require('redis');
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

client = createClient({
    socket: {
        host: redisHost,
        port: Number(process.env.REDIS_PORT),
        tls: useTls,
        ...(useTls && { servername: redisHost, rejectUnauthorized: false }),
        keepAlive: 5000,
        reconnectStrategy,
    },
    disableOfflineQueue: true,
    ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
});

client.on('error', (err) => {
    customLog(null, 'error', { message: '🚀 ~ client.on ~ err:', err });
});

client.connect().catch((err) => console.error('Redis connect error:', err));

let getValue = async (key) => {
    try {
        return await client.get(key);
    } catch (error) {
        customLog(null, 'error', { message: 'Failed to get value from Redis:', error });
        return null;
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
        customLog(null, 'error', { message: 'Failed to set value in Redis:', error });
        return null;
    }
};

let deleteValue = async (key) => {
    try {
        await client.del(key);
    } catch (error) {
        customLog(null, 'error', { message: 'Failed to delete value from Redis:', error });
        return null;
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
        customLog(null, 'error', { message: 'Error pushing to list:', err });
        return null;
    }
};

module.exports = {
    getValue,
    setValue,
    deleteValue,
    pushToList,
    client,
}
