/**
 * Short-TTL Redis cache for storefront ONDC product list pages.
 *
 * Postgres remains the source of truth. Redis only stores `{ rows, count }` for
 * a city + filter + page hash. Catalog writes bump a per-city version so old
 * pages miss immediately without SCAN. A global `*` version is included in
 * every page key so a purge that cannot resolve cities still invalidates.
 *
 * Every Redis call is fail-open: listing must never fail because Redis is down.
 * If the client is not ready, skip cache immediately so commands are not queued
 * on a reconnecting socket.
 */
const crypto = require('crypto')
const { getValue, setValue, incrValue, client } = require('../utils/cacheDataMethods')

const LIST_TTL_SECONDS = 90
const GLOBAL_CITY = '*'

const normalizeCity = (city) => {
    if (city == null || city === 'undefined') return ''
    return String(city).trim()
}

const normalizeFilterValue = (value) => {
    if (value == null || value === 'undefined') return ''
    return String(value)
}

const versionKey = (city) => `ondc:list:ver:${city}`

const redisAvailable = () => !client || client.isReady

const filterHash = ({
    search,
    localCategory,
    categoryId,
    priceMax,
    minDiscount,
    sellers,
    sort,
    offset = 0,
    limit = 20,
} = {}) => {
    const payload = {
        search: normalizeFilterValue(search),
        localCategory: normalizeFilterValue(localCategory),
        categoryId: normalizeFilterValue(categoryId),
        priceMax: normalizeFilterValue(priceMax),
        minDiscount: normalizeFilterValue(minDiscount),
        sellers: normalizeFilterValue(sellers),
        // Only when sorted: the default order keeps exactly the key it had before,
        // so pages already cached (and the home warm path) stay valid.
        ...(sort && sort !== 'relevance' ? { sort: String(sort) } : {}),
        offset: Number(offset) || 0,
        limit: Number(limit) || 20,
    }
    return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 16)
}

const logCacheError = (action, err) => {
    console.error(`ONDC list cache ${action} failed:`, err)
}

const readVersion = async (city) => {
    const raw = await getValue(versionKey(city))
    const n = parseInt(raw, 10)
    return Number.isFinite(n) && n > 0 ? n : 0
}

const parseCachedPage = (raw) => {
    if (raw == null || raw === '') return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.rows)) return null
    return { rows: parsed.rows, count: Number(parsed.count) || 0 }
}

const resolvePageKey = async (city, filters) => {
    const code = normalizeCity(city)
    if (!code || !redisAvailable()) return null
    try {
        const [cityVer, globalVer] = await Promise.all([
            readVersion(code),
            readVersion(GLOBAL_CITY),
        ])
        return `ondc:list:${code}:v${cityVer}:g${globalVer}:${filterHash(filters)}`
    } catch (err) {
        logCacheError('key', err)
        return null
    }
}

const readCachedPage = async (key) => {
    if (!key || !redisAvailable()) return null
    try {
        return parseCachedPage(await getValue(key))
    } catch (err) {
        logCacheError('get', err)
        return null
    }
}

const writeCachedPage = async (key, page) => {
    if (!key || !page || !redisAvailable()) return
    try {
        await setValue(key, LIST_TTL_SECONDS, JSON.stringify({
            rows: page.rows || [],
            count: Number(page.count) || 0,
        }))
    } catch (err) {
        logCacheError('set', err)
    }
}

const canCacheOfficeSupplyList = ({ city, transactionId } = {}) => {
    const code = normalizeCity(city)
    if (!code || code === GLOBAL_CITY) return false
    if (!transactionId || transactionId === 'undefined') return true
    const scopeIds = String(transactionId).split(',').map((s) => s.trim()).filter(Boolean)
    return scopeIds.length === 0
}

const getCachedList = async (city, filters) => {
    const key = await resolvePageKey(city, filters)
    return readCachedPage(key)
}

const setCachedList = async (city, filters, page) => {
    const key = await resolvePageKey(city, filters)
    await writeCachedPage(key, page)
}

const bumpCityListCache = async (city) => {
    const code = normalizeCity(city)
    if (!code || !redisAvailable()) return null
    try {
        return await incrValue(versionKey(code))
    } catch (err) {
        logCacheError('bump', err)
        return null
    }
}

const bumpListCacheForCities = async (cities) => {
    const unique = [...new Set((cities || []).map(normalizeCity).filter(Boolean))]
    if (!unique.length) {
        await bumpCityListCache(GLOBAL_CITY)
        return
    }
    await Promise.all(unique.map((code) => bumpCityListCache(code)))
}

module.exports = {
    LIST_TTL_SECONDS,
    GLOBAL_CITY,
    versionKey,
    filterHash,
    canCacheOfficeSupplyList,
    resolvePageKey,
    readCachedPage,
    writeCachedPage,
    getCachedList,
    setCachedList,
    bumpCityListCache,
    bumpListCacheForCities,
}
