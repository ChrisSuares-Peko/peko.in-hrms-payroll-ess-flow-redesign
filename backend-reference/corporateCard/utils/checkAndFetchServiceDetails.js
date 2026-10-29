const { internalGet, internalPost } = require('./othersClient')
const { getValue, setValue, deleteValue } = require('./cacheDataMethods')
const { encrypt, decrypt } = require('./cardCrypto')
const { customLog } = require('./loggerHelper')
const asyncHandler = require('../middlewares/async')

const OPERATOR_TTL_SECONDS = 300
const ENTITLEMENT_TTL_SECONDS = 90
const STALE_TTL_SECONDS = 3600
const STALE_REPRIME_TTL_SECONDS = 20

const operatorCacheKey = (accessKey) => `cc:internal:so:${accessKey}`
const entitlementCacheKey = (credentialId, accessKey) => `cc:internal:ent:${credentialId}:${accessKey}`
const staleKey = (key) => `${key}:stale`

const readCache = async (key) => {
    const cached = await getValue(key)
    if (!cached) return null
    try {
        return JSON.parse(decrypt(cached))
    } catch (error) {
        return null
    }
}

const writeCache = (key, ttlSeconds, result) => setValue(key, ttlSeconds, encrypt(JSON.stringify(result)))

const isErrorResult = (result) => Object.prototype.hasOwnProperty.call(result || {}, 'error')

const cacheResult = async (key, ttlSeconds, result) => {
    await writeCache(key, ttlSeconds, result)
    if (isErrorResult(result)) {
        await deleteValue(staleKey(key))
    } else {
        await writeCache(staleKey(key), STALE_TTL_SECONDS, result)
    }
}

const serveStaleOrThrow = async (key, error, logContext) => {
    const stale = await readCache(staleKey(key))
    if (stale) {
        customLog(logContext.logTraceId, 'error', {
            message: '[Internal] others unreachable — serving stale cached value (degraded)',
            ...logContext,
        }, 'CONSOLE')
        await writeCache(key, STALE_REPRIME_TTL_SECONDS, stale)
        return stale
    }
    throw error
}

exports.findServiceOperatorByAccessKey = asyncHandler(async (accessKey, req) => {
    const key = operatorCacheKey(accessKey)
    const cached = await readCache(key)
    if (cached) return cached

    let serviceOperator
    try {
        ({ serviceOperator } = await internalGet(`/service-operators/by-access-key/${encodeURIComponent(accessKey)}`, { req }))
    } catch (error) {
        return serveStaleOrThrow(key, error, { accessKey, lookup: 'serviceOperator', logTraceId: req?.LogTraceId })
    }

    const result = serviceOperator || { error: 'Service not available' }
    await cacheResult(key, OPERATOR_TTL_SECONDS, result)
    return result
})

exports.fetchServiceDetails = asyncHandler(async (details) => {
    const { credentialId, accessKey, corporateUserId, req } = details
    if (!credentialId || !accessKey || !corporateUserId) {
        return { error: 'Unable to process your request' }
    }

    const key = entitlementCacheKey(credentialId, accessKey)
    const cached = await readCache(key)
    if (cached) return cached

    let resolved
    try {
        ({ details: resolved } = await internalPost('/entitlements/resolve', { accessKey }, { req }))
    } catch (error) {
        return serveStaleOrThrow(key, error, { credentialId, accessKey, lookup: 'entitlement', logTraceId: req?.LogTraceId })
    }

    const result = resolved || { error: 'Unable to process your request' }
    await cacheResult(key, ENTITLEMENT_TTL_SECONDS, result)
    return result
})
