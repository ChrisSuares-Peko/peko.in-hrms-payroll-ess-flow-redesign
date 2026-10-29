const { client } = require('./cacheDataMethods');
const logger = require('./logger');

const IDEMPOTENCY_TTL_SECONDS = 600; // 10 minutes — long enough to cover realistic client retries

// F-OTH-09/18: no dedup mechanism existed for money-movement endpoints — a double-submitted
// or retried request could execute the same transfer twice. Redis SET...NX is atomic, so two
// concurrent requests with the same key can never both acquire the lock.
const acquireIdempotencyKey = async (scope, key) => {
    const lockKey = `idempotency:${scope}:${key}`;
    try {
        const result = await client.set(lockKey, 'processing', { NX: true, EX: IDEMPOTENCY_TTL_SECONDS });
        return result === 'OK'; // true = fresh request, false = duplicate (in flight or already done)
    } catch (err) {
        logger.error('Failed to acquire idempotency key:', { err });
        throw err;
    }
};

// Call this if the operation failed, so a legitimate retry with the same key isn't blocked
// for the full TTL by an attempt that never actually succeeded.
const releaseIdempotencyKey = async (scope, key) => {
    const lockKey = `idempotency:${scope}:${key}`;
    try {
        await client.del(lockKey);
    } catch (err) {
        logger.error('Failed to release idempotency key:', { err });
    }
};

module.exports = { acquireIdempotencyKey, releaseIdempotencyKey };
