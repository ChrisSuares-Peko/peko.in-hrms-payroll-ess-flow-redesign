const { customLog } = require('../utils/loggerHelper')
const { findByName, seedIfAbsent, save } = require('../models/use-cases/settings')
const {
    DOCUMENTS_BY_NAME,
    DEFAULT_MAX_SIZE_KB,
    MAX_TOTAL_UPLOAD_KB,
    MAX_VENDOR_PACK_KB,
} = require('../constants/kybDocuments')

const SETTING_NAME = 'kybDocumentMaxSizeKb'

const CACHE_TTL_MS = 60 * 1000

const localLimits = () =>
    Object.values(DOCUMENTS_BY_NAME).reduce(
        (limits, doc) => ({ ...limits, [doc.documentName]: doc.maxSizeKb || DEFAULT_MAX_SIZE_KB }),
        {}
    )

let cached = null
let cachedAt = 0
let inFlight = null

const isUsableKb = (value) => Number.isFinite(Number(value)) && Number(value) > 0

const sanitize = (details) => {
    if (!details || typeof details !== 'object' || Array.isArray(details)) return null
    const cleaned = Object.entries(details).reduce((limits, [documentName, kb]) => {
        if (!DOCUMENTS_BY_NAME[documentName] || !isUsableKb(kb)) return limits
        return { ...limits, [documentName]: Number(kb) }
    }, {})
    return Object.keys(cleaned).length ? cleaned : null
}

const read = async (logTraceId) => {
    const fallback = localLimits()
    try {
        const row = await findByName(SETTING_NAME)
        if (!row) {
            await seedIfAbsent(SETTING_NAME, fallback)
            customLog(logTraceId, 'info', {
                action: 'corporateCard:documentLimits:seeded',
                message: '[DocumentSizeLimits] Seeded the KYB document size limits from the local defaults',
                settingName: SETTING_NAME,
                limits: fallback,
            }, 'CONSOLE')
            return fallback
        }

        const details = typeof row.details === 'string' ? JSON.parse(row.details) : row.details
        const stored = sanitize(details)
        if (!stored) {
            customLog(logTraceId, 'error', {
                action: 'corporateCard:documentLimits:unusable',
                message: '[DocumentSizeLimits] Stored limits were unusable; falling back to the local defaults',
                settingName: SETTING_NAME,
            }, 'CONSOLE')
            return fallback
        }
        return { ...fallback, ...stored }
    } catch (error) {
        customLog(logTraceId, 'error', {
            action: 'corporateCard:documentLimits:readFailed',
            message: '[DocumentSizeLimits] Could not read the limits; falling back to the local defaults',
            settingName: SETTING_NAME,
            error: error?.message,
        }, 'CONSOLE')
        return fallback
    }
}

const getMaxSizeKbMap = async (logTraceId = null) => {
    if (cached && Date.now() - cachedAt < CACHE_TTL_MS) return cached
    if (inFlight) return inFlight

    inFlight = read(logTraceId)
        .then((limits) => {
            cached = limits
            cachedAt = Date.now()
            return limits
        })
        .finally(() => {
            inFlight = null
        })

    return inFlight
}

const maxSizeKbFor = async (documentName, logTraceId = null) => {
    const limits = await getMaxSizeKbMap(logTraceId)
    return limits[documentName] || DEFAULT_MAX_SIZE_KB
}

const TOTALS_SETTING_NAME = 'kybTotalLimitsKb'

const localTotals = () => ({
    totalUploadKb: MAX_TOTAL_UPLOAD_KB,
    vendorPackKb: MAX_VENDOR_PACK_KB,
})

let cachedTotals = null
let cachedTotalsAt = 0
let totalsInFlight = null

const sanitizeTotals = (details) => {
    if (!details || typeof details !== 'object' || Array.isArray(details)) return null
    const cleaned = {}
    for (const key of Object.keys(localTotals())) {
        const kb = Number(details[key])
        if (Number.isInteger(kb) && kb > 0) cleaned[key] = kb
    }
    return Object.keys(cleaned).length ? cleaned : null
}

const readTotals = async (logTraceId) => {
    const fallback = localTotals()
    try {
        const row = await findByName(TOTALS_SETTING_NAME)
        if (!row) {
            await seedIfAbsent(TOTALS_SETTING_NAME, fallback)
            return fallback
        }
        const details = typeof row.details === 'string' ? JSON.parse(row.details) : row.details
        return { ...fallback, ...(sanitizeTotals(details) || {}) }
    } catch (error) {
        customLog(logTraceId, 'error', {
            action: 'corporateCard:documentLimits:totalsReadFailed',
            message: '[DocumentSizeLimits] Could not read the total limits; using the local defaults',
            settingName: TOTALS_SETTING_NAME,
            error: error?.message,
        }, 'CONSOLE')
        return fallback
    }
}

const getTotalLimitsKb = async (logTraceId = null) => {
    if (cachedTotals && Date.now() - cachedTotalsAt < CACHE_TTL_MS) return cachedTotals
    if (totalsInFlight) return totalsInFlight

    totalsInFlight = readTotals(logTraceId)
        .then((totals) => {
            cachedTotals = totals
            cachedTotalsAt = Date.now()
            return totals
        })
        .finally(() => {
            totalsInFlight = null
        })

    return totalsInFlight
}

const MIN_TOTAL_KB = 1024

const MAX_TOTAL_KB = 100 * 1024

const saveTotalLimitsKb = async (incoming, logTraceId = null) => {
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
        return { error: 'Provide the totals as an object of sizes in KB.' }
    }
    const allowed = Object.keys(localTotals())
    const cleaned = {}
    for (const [key, raw] of Object.entries(incoming)) {
        if (!allowed.includes(key)) return { error: `${key} is not a total limit.` }
        const kb = Number(raw)
        if (!Number.isInteger(kb)) return { error: `${key} must be a whole number of KB.` }
        if (kb < MIN_TOTAL_KB || kb > MAX_TOTAL_KB) {
            return { error: `${key} must be between ${MIN_TOTAL_KB / 1024} MB and ${MAX_TOTAL_KB / 1024} MB.` }
        }
        cleaned[key] = kb
    }
    if (!Object.keys(cleaned).length) return { error: 'Provide at least one total limit.' }

    const merged = { ...(await getTotalLimitsKb(logTraceId)), ...cleaned }
    if (merged.vendorPackKb < merged.totalUploadKb) {
        return {
            error: 'The vendor pack limit cannot be smaller than the corporate upload limit — the pack also carries the signed agreement.',
        }
    }

    await save(TOTALS_SETTING_NAME, merged)
    cachedTotals = null
    cachedTotalsAt = 0

    customLog(logTraceId, 'info', {
        action: 'corporateCard:documentLimits:totalsUpdated',
        message: '[DocumentSizeLimits] KYB total size limits updated',
        settingName: TOTALS_SETTING_NAME,
        changed: cleaned,
    }, 'CONSOLE')

    return { totals: merged }
}

const MIN_SIZE_KB = 100

const MAX_SIZE_KB = 20 * 1024

const validate = (limits) => {
    if (!limits || typeof limits !== 'object' || Array.isArray(limits)) {
        return { error: 'Provide the limits as an object of documentName to size in KB.' }
    }
    const entries = Object.entries(limits)
    if (!entries.length) return { error: 'Provide at least one document limit.' }

    const cleaned = {}
    for (const [documentName, raw] of entries) {
        const doc = DOCUMENTS_BY_NAME[documentName]
        if (!doc) return { error: `${documentName} is not a KYB document.` }
        const kb = Number(raw)
        if (!Number.isInteger(kb)) return { error: `${doc.label} must be a whole number of KB.` }
        if (kb < MIN_SIZE_KB || kb > MAX_SIZE_KB) {
            return { error: `${doc.label} must be between ${MIN_SIZE_KB} KB and ${MAX_SIZE_KB / 1024} MB.` }
        }
        cleaned[documentName] = kb
    }
    return { limits: cleaned }
}

const saveMaxSizeKbMap = async (incoming, logTraceId = null) => {
    const { error, limits } = validate(incoming)
    if (error) return { error }

    const current = await getMaxSizeKbMap(logTraceId)
    const merged = { ...current, ...limits }
    await save(SETTING_NAME, merged)
    resetCache()

    customLog(logTraceId, 'info', {
        action: 'corporateCard:documentLimits:updated',
        message: '[DocumentSizeLimits] KYB document size limits updated',
        settingName: SETTING_NAME,
        changed: limits,
    }, 'CONSOLE')

    return { limits: merged }
}

const resetCache = () => {
    cached = null
    cachedAt = 0
    inFlight = null
    cachedTotals = null
    cachedTotalsAt = 0
    totalsInFlight = null
}

module.exports = {
    SETTING_NAME,
    TOTALS_SETTING_NAME,
    MIN_TOTAL_KB,
    MAX_TOTAL_KB,
    getTotalLimitsKb,
    saveTotalLimitsKb,
    localTotals,
    MIN_SIZE_KB,
    MAX_SIZE_KB,
    getMaxSizeKbMap,
    maxSizeKbFor,
    saveMaxSizeKbMap,
    resetCache,
    localLimits,
}
