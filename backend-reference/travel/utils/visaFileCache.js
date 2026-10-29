const { getValue, setValue } = require('./cacheDataMethods');

async function getVisaCache(key) {
    try {
        const cached = await getValue(key);
        return cached ? JSON.parse(cached) : null;
    } catch {
        return null;
    }
}

async function setVisaCache(key, ttlSeconds, data) {
    try {
        await setValue(key, ttlSeconds, JSON.stringify(data));
    } catch {
        // non-fatal: proceed without caching
    }
}

module.exports = { getVisaCache, setVisaCache };
