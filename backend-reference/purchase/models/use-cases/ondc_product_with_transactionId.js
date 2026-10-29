const { Op, QueryTypes, fn, col, literal } = require("sequelize");
const asyncHandler = require('./../../middlewares/async');
const ondcProducts = require('./../entities/ondc_product_with_transactionId');
const ondcSellerNps = require('./../entities/ondc_seller_np');
const { resolveHiddenProductExclusion } = require('./ondc_category');
const { HAS_USABLE_PRODUCT_IMAGE_SQL } = require('../../utils/ondc_product_images');
const { domainAliases } = require('../../utils/ondc_helper');
const { containsLike } = require('../../utils/escapeLike');
const { getTopDealsSettings } = require('../../services/ondcTopDealsSettings');
const {
    canCacheOfficeSupplyList,
    resolvePageKey,
    readCachedPage,
    writeCachedPage,
    bumpListCacheForCities,
} = require('../../services/ondcProductListCache');

const OFFICE_SUPPLIES = "OFFICE_SUPPLIES";

const tokenizeSearch = (search) => {
    if (search == null || search === 'undefined') return []
    return String(search)
        .toLowerCase()
        .split(/[^a-z0-9]+/i)
        .map((t) => t.trim())
        .filter(Boolean)
}

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const prefixTokenRegexp = (kw) => `(^|[^a-zA-Z0-9])${escapeRegex(String(kw).trim())}[a-zA-Z0-9]*`
const exactTokenRegexp = (kw) => `(^|[^a-zA-Z0-9])${escapeRegex(String(kw).trim())}([^a-zA-Z0-9]|$)`

const textFieldClauses = (kw, includeCategory) => {
    const rx = prefixTokenRegexp(kw)
    const regexp = { [Op.regexp]: rx }
    const clauses = [
        { name: regexp },
        { shortDesc: regexp },
        { longDesc: regexp },
    ]
    if (includeCategory) clauses.unshift({ categoryId: regexp })
    return clauses
}

/** Search tokens + localCategory chip. Mutates `where` / `and`. Returns tokens. */
const applySearchAndLocalCategory = (where, and, { search, localCategory } = {}) => {
    const tokens = tokenizeSearch(search)
    if (tokens.length) {
        for (const t of tokens) {
            and.push({ [Op.or]: textFieldClauses(t, false) })
        }
    }
    if (localCategory && localCategory !== "undefined") {
        const categoryValues = String(localCategory).split(",").map((s) => s.trim()).filter(Boolean)
        if (categoryValues.length > 1) {
            where.localCategory = { [Op.in]: categoryValues }
        } else if (categoryValues.length === 1) {
            where.localCategory = categoryValues[0]
        }
    }
    return tokens
}

/** Name hits first, then shortDesc, then longDesc. */
const buildNameFirstScoreSql = (tokens, escapeSql) => {
    const parts = (tokens || []).map((t) => {
        const exact = escapeSql(exactTokenRegexp(t))
        const prefix = escapeSql(prefixTokenRegexp(t))
        return `(CASE WHEN name REGEXP ${exact} THEN 100 WHEN name REGEXP ${prefix} THEN 50 WHEN shortDesc REGEXP ${prefix} THEN 20 WHEN longDesc REGEXP ${prefix} THEN 10 ELSE 0 END)`
    })
    return parts.length ? `(${parts.join(' + ')})` : '0'
}

// Identity of a product across cities: BPP + vendor + item. Prefer bppId
// (indexed STRING) over bppUri (TEXT) so listing and unique indexes stay cheap.
const productKey = (row) => `${row.bppId || row.bppUri || ''}|${row.ondcVendorId || ''}|${row.ondcProductId || ''}`;

const cityContains = (city) => {
    const cityJson = ondcProducts.sequelize.escape(JSON.stringify(city))
    return literal(`JSON_CONTAINS(city, ${cityJson})`)
}

// hiddenReason: set by services/ondcProductVisibility.js when a Rules or
// Review decision hides the product (unmapped seller category, blocked seller…).
const STOREFRONT_VISIBLE = {
    visibleOnPeko: { [Op.ne]: false },
    category: { [Op.ne]: null },
    hiddenReason: null,
    availableQuantity: { [Op.gt]: 0 },
}

/**
 * Row-level twin of STOREFRONT_VISIBLE, minus the stock check (callers report
 * out-of-stock separately): false once the admin switch, a Rules/Review
 * decision or a disabled category hides the product. The cart and checkout use
 * it so a product hidden after it was added cannot still be ordered.
 */
const isOndcProductListed = (row) =>
    !!row &&
    row.visibleOnPeko !== false && row.visibleOnPeko !== 0 &&
    row.category != null &&
    row.hiddenReason == null
exports.isOndcProductListed = isOndcProductListed

const UPDATE_CHUNK = 50

/**
 * The `city` column should be a JSON array, but environments where the
 * varchar->JSON migration hasn't run yet hand back a JSON STRING (or a bare
 * code). Always normalize to an array so city merging never silently drops
 * previously-served cities.
 */
const parseCityArray = (value) => {
    if (Array.isArray(value)) return value
    if (typeof value === 'string' && value.trim()) {
        try {
            const parsed = JSON.parse(value)
            if (Array.isArray(parsed)) return parsed
        } catch (e) {
            // bare legacy value like "std:080"
            return [value]
        }
    }
    return []
}
exports.parseCityArray = parseCityArray

exports.bulkCreateProducts = asyncHandler(async (products) => {
    return await ondcProducts.bulkCreate(products)
})

// Snapshot fields refreshed in place when a product is re-ingested — sellers
// change price/stock/descriptions between catalog callbacks. category /
// localCategory / hiddenReason are NOT here: services/ondcProductVisibility.js
// stamps them from the seller category's mapping right after the upsert.
const VOLATILE_PRODUCT_FIELDS = [
    'name', 'symbol', 'vendorName', 'shortDesc', 'longDesc',
    'images', 'uom', 'measureValue', 'availableQuantity', 'maxQuantity',
    'minQuantity', 'price', 'maxPrice', 'categoryId', 'tags', 'transactionId',
    'ondcDomain', 'returnable', 'cancellable', 'returnWindow', 'timeToShip',
    'consumerCare', 'locationId', 'fulfillmentId', 'statutory',
    'sellerCategoryId',
];

/**
 * Persist a batch of on_search products for one city. A product is considered
 * the SAME when (bppUri, ondcVendorId, ondcProductId) match — in that case we
 * refresh its volatile fields (current price/stock/etc.) and append the city
 * when new, instead of inserting a duplicate. New products are inserted with
 * `city: [cityCode]`.
 */
exports.upsertProductsWithCity = asyncHandler(async (items, cityCode) => {
    if (!Array.isArray(items) || !items.length) return { inserted: 0, updated: 0 }

    // De-dupe the incoming batch by the identity key (keep first occurrence).
    const byKey = new Map()
    for (const item of items) {
        const key = productKey(item)
        if (!byKey.has(key)) byKey.set(key, item)
    }
    const batch = [...byKey.values()]

    // Look up possibly-existing rows by ondcProductId (indexed), then match the
    // full triple in JS (avoids indexing the TEXT bppUri column).
    const productIds = [...new Set(batch.map((i) => i.ondcProductId).filter(Boolean))]
    const existingRows = productIds.length
        ? await ondcProducts.findAll({ where: { ondcProductId: { [Op.in]: productIds } } })
        : []
    const existingByKey = new Map(existingRows.map((r) => [productKey(r), r]))

    const toInsert = []
    const pendingUpdates = []
    const citiesTouched = new Set()
    const rememberCities = (value) => {
        for (const code of parseCityArray(value)) {
            if (code && code !== '*') citiesTouched.add(code)
        }
    }
    if (cityCode && cityCode !== '*') citiesTouched.add(cityCode)

    for (const item of batch) {
        const existing = existingByKey.get(productKey(item))
        if (existing) {
            const changes = {}
            for (const field of VOLATILE_PRODUCT_FIELDS) {
                if (item[field] !== undefined) changes[field] = item[field]
            }
            const cities = parseCityArray(existing.city)
            if (cityCode && !cities.includes(cityCode)) {
                changes.city = [...cities, cityCode]
            }
            if (cityCode && cityCode !== '*' && item.catalogSweepId) {
                changes.catalogSweepId = item.catalogSweepId
            }
            if (Object.keys(changes).length) {
                rememberCities(existing.city)
                rememberCities(changes.city)
                pendingUpdates.push({ existing, changes })
            }
        } else {
            // new to Peko: hidden until reviewed (Products > Review)
            const row = { ...item, city: cityCode ? [cityCode] : [], pendingReview: true }
            if (!cityCode || cityCode === '*') delete row.catalogSweepId
            toInsert.push(row)
        }
    }

    // Incremental catalogs (city "*") insert with an empty city array. Copy the
    // city union from other SKUs of the same seller so a known provider's new
    // item can show in cities they already serve.
    if (!cityCode && toInsert.length) {
        const vendorIds = [...new Set(toInsert.map((i) => i.ondcVendorId).filter(Boolean))]
        const citiesByVendor = new Map()
        const addCities = (bppUri, vendorId, cityVal) => {
            const key = `${bppUri || ''}|${vendorId || ''}`
            const cities = parseCityArray(cityVal)
            if (!cities.length) return
            const acc = citiesByVendor.get(key) || new Set()
            cities.forEach((c) => acc.add(c))
            citiesByVendor.set(key, acc)
        }
        for (const row of existingRows) addCities(row.bppUri, row.ondcVendorId, row.city)
        if (vendorIds.length) {
            const siblings = await ondcProducts.findAll({
                where: { ondcVendorId: { [Op.in]: vendorIds }, source: OFFICE_SUPPLIES },
                attributes: ['bppUri', 'ondcVendorId', 'city'],
            })
            for (const row of siblings) addCities(row.bppUri, row.ondcVendorId, row.city)
        }
        for (const item of toInsert) {
            if (item.city && item.city.length) continue
            const key = `${item.bppUri || ''}|${item.ondcVendorId || ''}`
            const acc = citiesByVendor.get(key)
            if (acc && acc.size) item.city = [...acc]
        }
    }

    if (toInsert.length) await ondcProducts.bulkCreate(toInsert)
    for (const item of toInsert) rememberCities(item.city)

    let updated = 0
    for (let i = 0; i < pendingUpdates.length; i += UPDATE_CHUNK) {
        const chunk = pendingUpdates.slice(i, i + UPDATE_CHUNK)
        await Promise.all(chunk.map(({ existing, changes }) => existing.update(changes)))
        updated += chunk.length
    }

    if (toInsert.length || updated) {
        await bumpListCacheForCities([...citiesTouched])
        if (process.env.NODE_ENV !== 'test' && cityCode && cityCode !== '*') {
            const warmCity = cityCode
            setImmediate(() => { void warmCityListPage(warmCity) })
        }
    }

    return { inserted: toInsert.length, updated }
})

/**
 * List office-supply products for a city. Identity is unique in the table
 * (bppId/vendor/item), so this is a single filtered page query — not a
 * GROUP BY MAX(id) pass.
 *
 * Storefront listing is scoped by `city` (JSON array on the row). Optional
 * `transactionId` remains for admin/debug callers that still pass it.
 *
 * @returns {Promise<{rows:Array, count:number}>}
 */
/**
 * ORDER BY for the storefront "Sort by" choice; null keeps the default order
 * (search relevance, else listing position, then name). Unpriced rows sort
 * last either way. Newest is
 * createdAt — a re-ingest refreshes the row in place and only bumps updatedAt,
 * so createdAt is when the product was first listed.
 */
const STOREFRONT_SORT_ORDER = {
    price_asc: () => [[literal('price IS NULL'), 'ASC'], ['price', 'ASC'], ['name', 'ASC']],
    price_desc: () => [[literal('price IS NULL'), 'ASC'], ['price', 'DESC'], ['name', 'ASC']],
    discount: () => [
        [literal('CASE WHEN maxPrice > price AND maxPrice > 0 THEN (maxPrice - price) / maxPrice ELSE 0 END'), 'DESC'],
        ['name', 'ASC'],
    ],
    newest: () => [['createdAt', 'DESC'], ['id', 'DESC']],
}

const loadOfficeSupplyProductsAndCount = async ({
    city,
    search,
    localCategory,
    categoryId,
    priceMax,
    minDiscount,
    sellers,
    sort,
    transactionId,
    offset = 0,
    limit = 20,
}) => {
    const where = { ...STOREFRONT_VISIBLE }
    const and = []
    if (city && city !== "undefined") and.push(cityContains(city))
    const scopeIds = transactionId && transactionId !== "undefined"
        ? String(transactionId).split(',').map((s) => s.trim()).filter(Boolean)
        : []
    if (scopeIds.length) where.transactionId = { [Op.in]: scopeIds }

    const tokens = applySearchAndLocalCategory(where, and, { search, localCategory })
    const hasSearch = tokens.length > 0
    if (categoryId && categoryId !== "undefined") {
        const keywords = String(categoryId)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        if (keywords.length) {
            and.push({ [Op.or]: keywords.flatMap((kw) => textFieldClauses(kw, true)) })
        }
    }
    if (priceMax && priceMax !== "undefined") {
        const max = Number(priceMax)
        if (Number.isFinite(max)) {
            and.push(literal(`CAST(price AS DECIMAL(12,2)) <= ${max}`))
        }
    }
    if (minDiscount && minDiscount !== "undefined") {
        const pct = Number(minDiscount)
        if (Number.isFinite(pct) && pct > 0) {
            and.push(literal(`maxPrice > price AND ((maxPrice - price) / maxPrice) * 100 >= ${pct}`))
        }
    }
    if (sellers && sellers !== "undefined") {
        const list = String(sellers).split(",").map((s) => s.trim()).filter(Boolean)
        if (list.length) where.vendorName = { [Op.in]: list }
    }

    const hiddenWhere = await resolveHiddenProductExclusion()
    if (hiddenWhere) and.push({ [Op.not]: hiddenWhere })

    if (and.length) where[Op.and] = and

    // A chosen sort replaces the default order; a search term still filters.
    // Default order is the listing position (core first, low last), then name;
    // in a search the best name match wins and the position breaks ties.
    const sortOrder = STOREFRONT_SORT_ORDER[sort]
    let order
    if (sortOrder) order = sortOrder()
    else if (hasSearch) order = [[literal(buildNameFirstScoreSql(tokens, (s) => ondcProducts.sequelize.escape(s))), 'DESC'], ['listingRank', 'ASC'], ['name', 'ASC']]
    else order = [['listingRank', 'ASC'], ['name', 'ASC']]

    return await ondcProducts.findAndCountAll({
        where,
        offset: Number(offset) || 0,
        limit: Number(limit) || 20,
        order,
        raw: true,
        nest: true,
    })
}

const warmCityListPage = async (city) => {
    try {
        const params = { city, offset: 0, limit: 8 }
        const pageKey = await resolvePageKey(city, params)
        const result = await loadOfficeSupplyProductsAndCount(params)
        if (pageKey) await writeCachedPage(pageKey, result)
    } catch (err) {
        console.error('ONDC list cache warm failed:', err)
    }
}

exports.findAllOfficeSupplyProductsAndCount = asyncHandler(async (params) => {
    const canCache = canCacheOfficeSupplyList(params)
    // Resolve the versioned key once so a catalog bump during the Postgres
    // query cannot store this page under the new version (stale write).
    let pageKey = null
    if (canCache) {
        try {
            pageKey = await resolvePageKey(params.city, params)
            if (pageKey) {
                const cached = await readCachedPage(pageKey)
                if (cached) return cached
            }
        } catch (err) {
            console.error('ONDC list cache get failed:', err)
            pageKey = null
        }
    }

    const result = await loadOfficeSupplyProductsAndCount(params)

    if (canCache && pageKey) {
        try {
            await writeCachedPage(pageKey, result)
        } catch (err) {
            console.error('ONDC list cache set failed:', err)
        }
    }

    return result
})

// ============================================================
// Admin catalog (Manage > Products) — every product (visible AND hidden),
// not city-scoped, with the admin toolbar filters. One row per identity.
// ============================================================
const ADMIN_SORT_FIELDS = ['updatedAt', 'name', 'price', 'vendorName']

exports.findAllOndcProductsForAdmin = asyncHandler(async ({
    category, sellerName, bppId, domain, availability, city, visibility, searchText,
    sort = 'DESC', sortField = 'updatedAt', offset = 0, limit = 10,
} = {}) => {
    const where = {}
    const and = []
    if (category && category !== 'undefined') where.category = category
    if (sellerName && sellerName !== 'undefined') where.vendorName = sellerName
    // Seller NP (bpp_id); MySQL's collation makes this case-insensitive, matching
    // ondcSellerNps' lower-cased key.
    if (bppId && bppId !== 'undefined') where.bppId = String(bppId).trim()
    if (domain && domain !== 'undefined') where.ondcDomain = domain
    if (availability === 'in') where.availableQuantity = { [Op.gt]: 0 }
    else if (availability === 'out') and.push({ [Op.or]: [{ availableQuantity: { [Op.lte]: 0 } }, { availableQuantity: null }] })
    if (visibility === 'visible') where.visibleOnPeko = { [Op.ne]: false }
    else if (visibility === 'hidden') where.visibleOnPeko = false
    if (city && city !== 'undefined') and.push(cityContains(city))
    if (searchText && searchText !== 'undefined') {
        const like = { [Op.like]: containsLike(searchText) }
        and.push({ [Op.or]: [{ name: like }, { vendorName: like }, { shortDesc: like }] })
    }
    if (and.length) where[Op.and] = and

    const dir = sort === 'ASC' ? 'ASC' : 'DESC'
    const orderField = ADMIN_SORT_FIELDS.includes(sortField) ? sortField : 'updatedAt'

    const { count, rows } = await ondcProducts.findAndCountAll({
        where,
        order: [[orderField, dir]],
        offset: Number(offset) || 0,
        limit: Number(limit) || 10,
        raw: true,
    })
    return { recordsTotal: count, rows }
})

/** Single ONDC product by id (admin catalog detail). */
exports.findOndcProductByIdAdmin = asyncHandler(async (id) => {
    return await ondcProducts.findOne({ where: { id }, raw: true })
})

/** Toggle a product's visibility to corporates. */
exports.setOndcProductVisibility = asyncHandler(async (id, visible) => {
    const row = await ondcProducts.findOne({ where: { id }, attributes: ['city'], raw: true })
    const result = await ondcProducts.update({ visibleOnPeko: !!visible }, { where: { id } })
    const [count] = result
    if (count) {
        await bumpListCacheForCities(parseCityArray(row && row.city))
    }
    return result
})

/**
 * Product totals per (category, localCategory) pair, on the same terms the
 * corporate storefront uses, with admin-hidden rows excluded. Feeds
 * refreshCategoryProductCounts. Identity is unique so this is one GROUP BY
 * on category names — no MAX(id) self-join.
 */
exports.countProductsByCategory = async () => {
    const rows = await ondcProducts.sequelize.query(
        `SELECT p.category AS category,
                p.localCategory AS localCategory,
                COUNT(*) AS total
           FROM ondcProducts p
          WHERE COALESCE(p.visibleOnPeko, 1) = 1
            AND p.category IS NOT NULL
            AND p.hiddenReason IS NULL
            AND (
              (
                p.images IS NOT NULL
                AND JSON_TYPE(p.images) = 'ARRAY'
                AND JSON_LENGTH(p.images) > 0
                AND NULLIF(TRIM(JSON_UNQUOTE(JSON_EXTRACT(p.images, '$[0]'))), '') IS NOT NULL
                AND LOWER(JSON_UNQUOTE(JSON_EXTRACT(p.images, '$[0]'))) NOT IN ('null', 'undefined')
                AND (
                  JSON_UNQUOTE(JSON_EXTRACT(p.images, '$[0]')) LIKE 'http://%'
                  OR JSON_UNQUOTE(JSON_EXTRACT(p.images, '$[0]')) LIKE 'https://%'
                )
              )
              OR (
                p.symbol IS NOT NULL
                AND TRIM(p.symbol) <> ''
                AND LOWER(TRIM(p.symbol)) NOT IN ('null', 'undefined')
                AND (p.symbol LIKE 'http://%' OR p.symbol LIKE 'https://%')
              )
            )
          GROUP BY p.category, p.localCategory`,
        { type: QueryTypes.SELECT },
    )
    return rows.map((row) => ({
        category: row.category,
        localCategory: row.localCategory,
        total: Number(row.total) || 0,
    }))
}

/**
 * Seller NPs that have products in the catalog, as { bppId, name } sorted by
 * name. The name comes from the Seller NPs table (npName), falling back to the
 * bpp_id when the NP never sent one.
 */
const findProductSellerNpOptions = async () => {
    const rows = await ondcProducts.findAll({
        attributes: [[fn('DISTINCT', col('bppId')), 'bppId']],
        where: { bppId: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] } },
        raw: true,
    })
    const ids = [...new Set(rows.map((r) => String(r.bppId || '').trim()).filter(Boolean))]
    if (!ids.length) return []
    const nps = await ondcSellerNps.findAll({
        attributes: ['bppId', 'npName'],
        where: { bppId: { [Op.in]: ids.map((id) => id.toLowerCase()) } },
        raw: true,
    })
    const nameById = new Map(nps.map((np) => [String(np.bppId).toLowerCase(), (np.npName || '').trim()]))
    return ids
        .map((bppId) => ({ bppId, name: nameById.get(bppId.toLowerCase()) || bppId }))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
}

/** Distinct categories / sellers / seller NPs / in-use city codes for the toolbar dropdowns. */
exports.findOndcProductFilterOptions = asyncHandler(async () => {
    const [categories, sellers, sellerNps, cityRows] = await Promise.all([
        ondcProducts.findAll({ attributes: [[fn('DISTINCT', col('category')), 'category']], where: { category: { [Op.ne]: null } }, order: [['category', 'ASC']], raw: true }),
        ondcProducts.findAll({ attributes: [[fn('DISTINCT', col('vendorName')), 'vendorName']], where: { vendorName: { [Op.ne]: null } }, order: [['vendorName', 'ASC']], raw: true }),
        findProductSellerNpOptions(),
        ondcProducts.findAll({ attributes: ['city'], raw: true }),
    ])
    const citySet = new Set()
    for (const r of cityRows) parseCityArray(r.city).forEach((c) => c && citySet.add(c))
    return {
        categories: categories.map((c) => c.category).filter(Boolean),
        sellers: sellers.map((s) => s.vendorName).filter(Boolean),
        sellerNps,
        cityCodes: [...citySet],
    }
})

/**
 * Distinct seller (vendorName) list for the products the storefront would show
 * for this city (+ optional search / localCategory). Same visibility rules as
 * the listing — unclassified and admin-hidden rows are excluded — so Seller
 * checkboxes match the current grid. Price / discount / seller are NOT applied
 * so the option list stays stable while those filters are toggled.
 * @returns {Promise<string[]>}
 */
exports.findSellersByCity = asyncHandler(async ({ city, search, localCategory } = {}) => {
    const where = { ...STOREFRONT_VISIBLE }
    const and = []
    if (city && city !== "undefined") and.push(cityContains(city))
    applySearchAndLocalCategory(where, and, { search, localCategory })
    const hiddenWhere = await resolveHiddenProductExclusion()
    if (hiddenWhere) and.push({ [Op.not]: hiddenWhere })
    if (and.length) where[Op.and] = and

    const rows = await ondcProducts.findAll({
        attributes: ['vendorName'],
        where,
        group: ['vendorName'],
        raw: true,
    })
    const set = new Set(rows.map((r) => (r.vendorName || '').trim()).filter(Boolean))
    return [...set].sort((a, b) => a.localeCompare(b))
})

/**
 * Rules-tab filters for Top deals only (ONDC_TOP_DEALS setting): a minimum
 * price, and price sanity — a discount above the cap usually means an
 * inflated MRP. Unset values add nothing.
 */
const topDealsRuleClauses = async () => {
    const { minPrice, maxDiscountPct } = await getTopDealsSettings()
    const clauses = []
    if (minPrice != null) clauses.push({ price: { [Op.gte]: minPrice } })
    if (maxDiscountPct != null) {
        clauses.push(literal(`((maxPrice - price) / maxPrice) * 100 <= ${Number(maxDiscountPct)}`))
    }
    return clauses
}

/**
 * Products kept out of Top deals by each Rules-tab filter (attributed to the
 * min price first), across all cities — for the Rules tab.
 */
exports.countTopDealsRuleExclusions = async () => {
    const { minPrice, maxDiscountPct } = await getTopDealsSettings()
    const base = [literal('maxPrice > price'), literal(HAS_USABLE_PRODUCT_IMAGE_SQL)]
    const hiddenWhere = await resolveHiddenProductExclusion()
    if (hiddenWhere) base.push({ [Op.not]: hiddenWhere })
    const [belowMinPrice, overDiscountCap] = await Promise.all([
        minPrice != null
            ? ondcProducts.count({ where: { ...STOREFRONT_VISIBLE, [Op.and]: [...base, { price: { [Op.lt]: minPrice } }] } })
            : 0,
        maxDiscountPct != null
            ? ondcProducts.count({
                where: {
                    ...STOREFRONT_VISIBLE,
                    [Op.and]: [
                        ...base,
                        ...(minPrice != null ? [{ price: { [Op.gte]: minPrice } }] : []),
                        literal(`((maxPrice - price) / maxPrice) * 100 > ${Number(maxDiscountPct)}`),
                    ],
                },
            })
            : 0,
    ])
    return { belowMinPrice, overDiscountCap }
}

/**
 * Top deals for a city: listing position first (core … low), then highest
 * *percent* off (same math as the card
 * badge: (maxPrice - price) / maxPrice). Absolute rupee-off used to rank a
 * 35% expensive item above a 44% cheaper one. Same city-array dedup as the
 * listing; only rows with a real list price and a usable image.
 *
 * @returns {Promise<Array>} up to `limit` product rows (no count needed).
 */
exports.findTopDealsByCity = asyncHandler(async ({ city, limit = 12 }) => {
    const where = {
        ...STOREFRONT_VISIBLE,
        [Op.and]: [
            literal('maxPrice > price'),
            literal(HAS_USABLE_PRODUCT_IMAGE_SQL),
            ...(await topDealsRuleClauses()),
        ],
    }
    if (city && city !== "undefined") {
        where[Op.and] = [cityContains(city), ...where[Op.and]]
    }

    return await ondcProducts.findAll({
        where,
        order: [
            ['listingRank', 'ASC'],
            [literal('((maxPrice - price) / maxPrice)'), 'DESC'],
            [literal('(maxPrice - price)'), 'DESC'],
        ],
        limit: Number(limit) || 12,
        raw: true,
        nest: true,
    })
})

/**
 * STUB — Top-rated products for a city.
 *
 * Returns [] for now: the `ondcProducts` table has no rating/review data. To
 * implement, add `rating` (DECIMAL) + `reviewCount` (INT) columns (populated
 * from ONDC catalog tags or our own reviews) and order by them here.
 */
exports.findTopRatedByCity = asyncHandler(async () => {
    return []
})

/**
 * STUB — Frequently-bought products for a city.
 *
 * Returns [] for now: there is no table linking a purchase to an
 * `ondcProductId`. To implement, add an `ondc_order_items` table (or a
 * `purchaseCount` column) and order by purchase volume here.
 */
exports.findFrequentlyBoughtByCity = asyncHandler(async () => {
    return []
})

/**
 * Single ONDC product row by its (per-refresh) numeric primary key — used by
 * add-to-cart, which receives the listing row id and snapshots that row.
 */
exports.findOndcProductById = asyncHandler(async ({ id }) => {
    return await ondcProducts.findOne({ where: { id }, raw: true })
})

/**
 * The live catalog row for a cart item: the row id the cart stored, else the same
 * product by ONDC identity (seller app + provider + item — productKey above).
 *
 * The id alone is not durable. The midnight purge
 * (scheduler/services/ondcProductPurge.js) hard-deletes rows not refreshed in 24 h,
 * and the next ingest of that seller's catalog inserts the product under a NEW id —
 * so an id-only lookup reported "No longer available" for an item the seller still
 * lists. Null when the product has no row at all (not re-ingested since the purge,
 * or genuinely delisted), or when the item carries too little seller data to match
 * safely.
 */
exports.findOndcProductForCartItem = asyncHandler(async (item = {}) => {
    if (item.productId) {
        const byId = await ondcProducts.findOne({ where: { id: item.productId }, raw: true })
        if (byId) return byId
    }
    const seller = item.bppId || item.bppUri
    if (!item.ondcProductId || !seller || !item.ondcVendorId) return null

    const candidates = await ondcProducts.findAll({
        where: { ondcProductId: String(item.ondcProductId) },
        order: [['id', 'DESC']],
        raw: true,
    })
    return candidates.find((row) =>
        String(row.ondcVendorId || '') === String(item.ondcVendorId) &&
        (item.bppId ? row.bppId === item.bppId : row.bppUri === item.bppUri)
    ) || null
})

/**
 * Newest office-supply row for a single ONDC product.
 */
exports.findOndcProductDetail = asyncHandler(async ({ ondcProductId }) => {
    return await ondcProducts.findOne({
        where: {
            ondcProductId,
            category: { [Op.ne]: null },
        },
        order: [['id', 'DESC']],
        raw: true,
    })
})

const stillInStock = {
    [Op.or]: [
        { availableQuantity: { [Op.gt]: 0 } },
        { availableQuantity: null },
    ],
}

const markOfficeSupplyUnavailable = async (extraWhere) => {
    const where = {
        source: OFFICE_SUPPLIES,
        ...extraWhere,
        ...stillInStock,
    }
    const staleRows = await ondcProducts.findAll({
        where,
        attributes: ['city'],
        raw: true,
    })
    const [count] = await ondcProducts.update(
        { availableQuantity: 0 },
        { where, silent: true },
    )
    if (count) {
        await bumpListCacheForCities(staleRows.flatMap((row) => parseCityArray(row.city)))
    }
    return count || 0
}

exports.deleteOfficeSupplyProductsByTransactionIds = asyncHandler(async ({ transactionIds } = {}) => {
    const ids = Array.isArray(transactionIds)
        ? transactionIds.map((id) => String(id || "").trim()).filter(Boolean)
        : []
    if (!ids.length) return 0
    return await markOfficeSupplyUnavailable({ transactionId: { [Op.in]: ids } })
})

/**
 * Mark office-supply rows not refreshed since `before` (a Date) as out of
 * stock. Keyed on updatedAt, not createdAt — upsertProductsWithCity refreshes
 * a still-active product's row in place on every re-ingestion (bumping
 * updatedAt only), so a createdAt cutoff would OOS products the seller keeps
 * confirming, purely because they were first seen a while ago. Does not bump
 * updatedAt (silent), so city freshness still means last seller ingest.
 * Production window was 12 hours when the hourly scheduler job existed;
 * that job is gone — snapshot reconcile after catalog_full is the path now.
 */
exports.deleteOldOfficeSupplyProducts = asyncHandler(async ({ before }) => {
    return await markOfficeSupplyUnavailable({ updatedAt: { [Op.lt]: before } })
})

const CITY_CATALOG_TTL_MS = 12 * 60 * 60 * 1000

/**
 * Category-tab domains that have no in-stock, visible, classified product
 * in this city. Used to log gap-fill vs 12h refresh. Match ondcDomain as
 * both `ONDC:RET14` and `RET14`.
 */
exports.findMissingCatalogDomainsForCity = asyncHandler(async ({ city, domains } = {}) => {
    const searchDomains = (domains || []).filter(Boolean)
    if (!searchDomains.length || !city || city === "undefined" || city === "*") {
        return searchDomains
    }
    const rows = await ondcProducts.findAll({
        attributes: [[fn('DISTINCT', col('ondcDomain')), 'ondcDomain']],
        where: {
            source: OFFICE_SUPPLIES,
            ...STOREFRONT_VISIBLE,
            ondcDomain: { [Op.ne]: null },
            [Op.and]: [cityContains(city)],
        },
        raw: true,
    })
    const present = new Set()
    for (const row of rows || []) {
        for (const alias of domainAliases(row.ondcDomain)) {
            present.add(alias)
        }
        const code = String(row.ondcDomain || '').trim().replace(/^ONDC:/i, '').toUpperCase()
        if (code) present.add(code)
    }
    return searchDomains.filter((domain) => {
        const aliases = domainAliases(domain)
        return !aliases.some((alias) => present.has(alias))
    })
})

/**
 * After a catalog_full sweep has gone quiet: SKUs in this city+domain that
 * were not stamped with `sweepId` lose the city (row deleted if no cities left).
 */
exports.reconcileCatalogSweep = asyncHandler(async ({ city, domain, sweepId } = {}) => {
    if (!city || city === "undefined" || city === "*" || !domain || !sweepId) {
        return { skipped: true, uncity: 0, deleted: 0 }
    }
    const aliases = domainAliases(domain)
    if (!aliases.length) return { skipped: true, uncity: 0, deleted: 0 }

    const rows = await ondcProducts.findAll({
        where: {
            source: OFFICE_SUPPLIES,
            ondcDomain: { [Op.in]: aliases },
            catalogSweepId: { [Op.or]: [{ [Op.ne]: sweepId }, { [Op.is]: null }] },
            [Op.and]: [cityContains(city)],
        },
    })

    let uncity = 0
    let deleted = 0
    for (const row of rows || []) {
        const next = parseCityArray(row.city).filter((code) => code !== city)
        if (!next.length) {
            await row.destroy()
            deleted += 1
        } else {
            await row.update({ city: next })
            uncity += 1
        }
    }
    if (uncity || deleted) {
        await bumpListCacheForCities([city])
    }
    return { skipped: false, uncity, deleted }
})

/**
 * True when this city already has at least one *in-stock* office-supply row
 * refreshed within `maxAgeMs` (default 12 hours). Storefront search no longer
 * uses this as an all-domain skip — see hasRecentCityDomainFullSearch.
 */
exports.hasFreshOfficeSupplyCatalogForCity = asyncHandler(async ({
    city,
    maxAgeMs = CITY_CATALOG_TTL_MS,
} = {}) => {
    if (!city || city === "undefined") return false
    const cityJson = ondcProducts.sequelize.escape(JSON.stringify(city))
    const since = new Date(Date.now() - (Number(maxAgeMs) || CITY_CATALOG_TTL_MS))
    const row = await ondcProducts.findOne({
        attributes: ["id"],
        where: {
            source: OFFICE_SUPPLIES,
            category: { [Op.ne]: null },
            visibleOnPeko: { [Op.ne]: false },
            availableQuantity: { [Op.gt]: 0 },
            updatedAt: { [Op.gte]: since },
            [Op.and]: [literal(`JSON_CONTAINS(city, ${cityJson})`)],
        },
        raw: true,
    })
    return Boolean(row)
})

/**
 * True when this city has any office-supply row, regardless of age.
 * Distinguishes "never seeded" (needs catalog_full) from "seeded but stale"
 * (catch-up with catalog_inc pull).
 */
exports.hasOfficeSupplyCatalogForCity = asyncHandler(async ({ city } = {}) => {
    if (!city || city === "undefined" || city === "*") return false
    const cityJson = ondcProducts.sequelize.escape(JSON.stringify(city))
    const row = await ondcProducts.findOne({
        attributes: ["id"],
        where: {
            source: OFFICE_SUPPLIES,
            category: { [Op.ne]: null },
            [Op.and]: [literal(`JSON_CONTAINS(city, ${cityJson})`)],
        },
        raw: true,
    })
    return Boolean(row)
})
