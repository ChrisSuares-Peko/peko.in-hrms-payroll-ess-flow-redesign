const { internalGet, internalPost } = require('./othersClient')
const { getValue, setValue } = require('./cacheDataMethods')
const { customLog } = require('./loggerHelper')

const CORPORATE_CARDS_SERVICE = require('../constants/service')

const BATCH_CHUNK_SIZE = 200
const IDENTITY_TTL_SECONDS = 300
const SEARCH_IDS_LIMIT = 1000

const cardUserCacheKey = (id) => `cc:internal:user:${id}`
const corporateCacheKey = (id) => `cc:internal:corp:${id}`

const chunk = (items, size) => {
    const chunks = []
    for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
    return chunks
}

const readCachedRows = async (ids, cacheKey) => {
    const hits = new Map()
    const misses = []
    for (const id of ids) {
        const cached = await getValue(cacheKey(id))
        if (cached) {
            try {
                hits.set(id, JSON.parse(cached))
                continue
            } catch (error) {
                // Corrupt cache entry — refetch it.
            }
        }
        misses.push(id)
    }
    return { hits, misses }
}

const resolveByIds = async ({ ids, cacheKey, batchPath, idsField = 'ids', params, req, bypassCache = false }) => {
    const uniqueIds = [...new Set(ids.filter((id) => id !== null && id !== undefined).map(String))]
    if (!uniqueIds.length) return new Map()

    const { hits, misses } = bypassCache
        ? { hits: new Map(), misses: uniqueIds }
        : await readCachedRows(uniqueIds, cacheKey)
    if (!misses.length) return hits

    for (const idsChunk of chunk(misses, BATCH_CHUNK_SIZE)) {
        const { rows } = await internalPost(batchPath, { [idsField]: idsChunk }, { req, params })
        for (const row of rows || []) {
            const id = String(row.id)
            hits.set(id, row)
            await setValue(cacheKey(id), IDENTITY_TTL_SECONDS, JSON.stringify(row))
        }
    }
    return hits
}

// serviceLabel is REQUIRED by the directory: role and status are per-service, read out of the caller's own
// membership entry, so it cannot project a row without knowing which service is asking. Omitting it made every
// batch 400, and attachCardholders turns a failed hydration into a null cardholder — so every screen that
// names a member rendered "-" instead.
const getCardUsersByIds = (ids, req, { bypassCache = false } = {}) =>
    resolveByIds({
        ids,
        cacheKey: cardUserCacheKey,
        batchPath: '/card-users/batch',
        params: { serviceLabel: CORPORATE_CARDS_SERVICE },
        req,
        bypassCache,
    })

const findCardholderById = async (userId, req, options) => {
    if (userId === null || userId === undefined) return null
    const rows = await getCardUsersByIds([userId], req, options)
    return rows.get(String(userId)) || null
}

const getCardholdersByIdentities = async (identities, req) => {
    const ids = (identities || []).filter(Boolean).map((i) => i.userId).filter((id) => id !== null && id !== undefined)
    return ids.length ? getCardUsersByIds(ids, req) : new Map()
}

const findCardholderByIdentity = async (identity, req) =>
    (identity?.userId ? findCardholderById(identity.userId, req) : null)

const searchCardUserIds = async ({ searchText, fields, limit = SEARCH_IDS_LIMIT, req }) => {
    const { ids, capped } = await internalGet('/card-users/search-ids', {
        params: { searchText, fields: fields.join(','), limit },
        req,
    })
    if (capped) {
        customLog(req?.LogTraceId, 'error', {
            message: '[Internal] cardholder search id list was capped — results may undercount',
            searchText,
            limit,
        }, 'CONSOLE')
    }
    return { ids: ids || [], capped: !!capped }
}

const findAndCountCardUsers = async ({ status, searchText, ids, excludeIds, includeOwner = false, pinUserId, limit, offset, req }) => {
    const { count, rows } = await internalGet('/card-users', {
        params: {
            serviceLabel: CORPORATE_CARDS_SERVICE,
            ...(status ? { status } : {}),
            ...(searchText ? { searchText } : {}),
            ...(Array.isArray(ids) && ids.length ? { ids: ids.join(',') } : {}),
            ...(Array.isArray(excludeIds) && excludeIds.length ? { excludeIds: excludeIds.join(',') } : {}),
            ...(includeOwner ? { includeOwner: 'true' } : {}),
            ...(pinUserId ? { pinUserId } : {}),
            limit,
            offset,
        },
        req,
    })
    return { count: count || 0, rows: rows || [] }
}

const listCardUserIds = async ({ includeOwner = false, req }) => {
    const { ids } = await internalGet('/card-users/ids', {
        params: {
            serviceLabel: CORPORATE_CARDS_SERVICE,
            ...(includeOwner ? { includeOwner: 'true' } : {}),
        },
        req,
    })
    return ids || []
}

/**
 * The same members, each with the mobile their KYC is filed under.
 *
 * Falls back to id-only entries when the directory answers without `members`, so the summary still counts the
 * right number of people and merely loses the mobile key.
 */
const listCardUserIdentities = async ({ includeOwner = false, req }) => {
    const { members, ids } = await internalGet('/card-users/ids', {
        params: {
            serviceLabel: CORPORATE_CARDS_SERVICE,
            ...(includeOwner ? { includeOwner: 'true' } : {}),
        },
        req,
    })
    if (Array.isArray(members)) {
        return members.map((m) => ({ id: String(m.id), mobileNo: m.mobileNo ?? null }))
    }
    return (ids || []).map((id) => ({ id: String(id), mobileNo: null }))
}

const findCardUserScoped = async ({ userId, cardholder, req }) => {
    const id = cardholder?.userId ?? userId ?? null
    if (!id) return null

    const { row } = await internalGet(`/card-users/${encodeURIComponent(String(id))}`, {
        params: { serviceLabel: CORPORATE_CARDS_SERVICE },
        req,
    })
    return row || null
}

const findOwnerCardholder = async (req) => {
    const { row } = await internalGet('/card-users/owner-profile', {
        params: { serviceLabel: CORPORATE_CARDS_SERVICE },
        req,
    })
    return row || null
}

// ---- Admin (system_user) reads of ONE named corporate's members — the admin session carries no corporate,
// so these pass it explicitly. The others MS only serves them on its SYSTEM_USER-gated tree.

const findAndCountCorporateCardUsers = async ({ corporateId, includeOwner = false, limit, offset, req }) => {
    const { count, rows } = await internalGet('/card-users', {
        params: {
            serviceLabel: CORPORATE_CARDS_SERVICE,
            corporateId,
            ...(includeOwner ? { includeOwner: 'true' } : {}),
            limit,
            offset,
        },
        req,
    })
    return { count: count || 0, rows: rows || [] }
}

const getCorporateCardUsersByIds = (ids, corporateId, req) =>
    resolveByIds({
        ids,
        cacheKey: cardUserCacheKey,
        batchPath: '/card-users/batch',
        params: { serviceLabel: CORPORATE_CARDS_SERVICE, corporateId },
        req,
    })

const getCorporatesByIds = (ids, req, { bypassCache = false } = {}) =>
    resolveByIds({ ids, cacheKey: corporateCacheKey, batchPath: '/corporates/batch', req, bypassCache })

// The session's own corporate record (including its login credential's username). Unlike
// getCorporatesByIds — which hits a SYSTEM_USER-only endpoint — this works from a plain
// corporate/employee session, since it can only ever resolve the caller's own corporate.
/**
 * Grants Corporate Cards to an employee, on approval of their membership request.
 *
 * The membership lives on `users.userAccessService` in the shared database, which this service has no SQL
 * access to — `others` scopes the write to the approving admin's own corporate and fixes the role to
 * Employee, so this cannot be used to mint an Admin.
 */
const grantCardMembership = async ({ userId, req }) => {
    const { userId: grantedUserId, alreadyHeld } = await internalPost('/card-members/grant', { userId: String(userId) }, { req })
    return { userId: grantedUserId, alreadyHeld: !!alreadyHeld }
}

const getSelfCorporate = async (req) => {
    const { row } = await internalGet('/corporates/self', { req })
    return row || null
}

const searchCorporateIdsByCompanyName = async ({ searchText, limit = SEARCH_IDS_LIMIT, req }) => {
    const { ids, capped } = await internalGet('/corporates/search-ids', {
        params: { companyName: searchText, limit },
        req,
    })
    if (capped) {
        customLog(req?.LogTraceId, 'error', {
            message: '[Internal] corporate companyName search id list was capped — results may undercount',
            searchText,
            limit,
        }, 'CONSOLE')
    }
    return { ids: ids || [], capped: !!capped }
}

const PICKABLE_TIMEOUT_MS = 15000

const searchPickableCorporates = async ({ searchText, limit = 20, offset = 0, req }) => {
    const { rows } = await internalPost('/corporates/pickable-search', {
        ...(searchText ? { searchText } : {}),
        limit,
        offset,
    }, { req, timeout: PICKABLE_TIMEOUT_MS })
    return rows || []
}

const countPickableCorporates = async (req) => {
    const { count } = await internalGet('/corporates/pickable-count', { req, timeout: PICKABLE_TIMEOUT_MS })
    return Number(count) || 0
}

module.exports = {
    CORPORATE_CARDS_SERVICE,
    getCardUsersByIds,
    getCardholdersByIdentities,
    findCardholderById,
    findCardholderByIdentity,
    searchCardUserIds,
    findAndCountCardUsers,
    listCardUserIds,
    listCardUserIdentities,
    findCardUserScoped,
    findOwnerCardholder,
    getCorporatesByIds,
    findAndCountCorporateCardUsers,
    getCorporateCardUsersByIds,
    grantCardMembership,
    getSelfCorporate,
    searchCorporateIdsByCompanyName,
    searchPickableCorporates,
    countPickableCorporates,
}
