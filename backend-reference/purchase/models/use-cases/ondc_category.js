const { Op, QueryTypes } = require("sequelize");
const officeSupplyCategories = require('./../entities/ondc_category');
const { customLog } = require('../../utils/loggerHelper');
const { bumpCityListCache } = require('../../services/ondcProductListCache');

const CLASSIFICATION_CACHE_TTL_MS = 5 * 60 * 1000;
let classificationCache = null;
let cacheExpiresAt = 0;

const splitDomainCodes = (domainStr) => {
    if (!domainStr) return []
    return String(domainStr).split(',').map((d) => d.trim()).filter(Boolean)
}

const parseKeywordsList = (value) => {
    if (Array.isArray(value)) {
        return [...new Set(value.map((s) => String(s).trim()).filter(Boolean))]
    }
    const raw = String(value || '').trim()
    if (!raw) return []
    if (raw.startsWith('[')) {
        try {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) {
                return [...new Set(parsed.map((s) => String(s).trim()).filter(Boolean))]
            }
        } catch (_err) {
            // fall through to comma split
        }
    }
    return [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))]
}

/** Array of unique trimmed tags, or null when empty. */
const sanitizeKeywords = (value) => {
    const list = parseKeywordsList(value)
    return list.length ? list : null
}
exports.sanitizeKeywords = sanitizeKeywords

/**
 * Tags for a subcategory: `keywords` first, then leftover `ondcCategory`
 * (the column the admin form used to write). Tags were never deleted — the
 * model stopped SELECTing `ondcCategory`, so the Keywords column looked empty.
 */
const keywordsFromRow = (row) => {
    const fromKeywords = parseKeywordsList(row?.keywords)
    if (fromKeywords.length) return fromKeywords
    return parseKeywordsList(row?.ondcCategory)
}

const categoryTableName = () => {
    const table = officeSupplyCategories.getTableName()
    return typeof table === 'string' ? table : table.tableName
}

/** SELECT * so a leftover `ondcCategory` column is visible even though it is not on the model. */
const loadAllCategoryRows = async () => {
    const table = categoryTableName()
    return officeSupplyCategories.sequelize.query(
        `SELECT * FROM \`${table}\``,
        { type: QueryTypes.SELECT },
    )
}

const copyOndcCategoryIntoKeywords = async (rows) => {
    const jobs = []
    for (const row of rows) {
        if (row.parentId == null) continue
        if (parseKeywordsList(row.keywords).length) continue
        const copied = parseKeywordsList(row.ondcCategory)
        if (!copied.length) continue
        jobs.push(
            officeSupplyCategories.update(
                { keywords: copied },
                { where: { id: row.id }, silent: true },
            ),
        )
    }
    if (!jobs.length) return
    await Promise.all(jobs)
    exports.invalidateClassificationCache()
}

const buildDomainsFromRows = (rows) => {
    const domainSet = new Set()
    for (const row of rows) {
        if (row.enabled === false) continue
        for (const code of splitDomainCodes(row.ondcDomain)) domainSet.add(code)
    }
    return [...domainSet]
}

// Products are no longer classified by keywords (seller categories are mapped
// on Products > Review); this cache only serves the search fan-out domains.
const loadClassificationCacheFromDb = async () => {
    const rows = await loadAllCategoryRows()
    return {
        domains: buildDomainsFromRows(rows),
    }
}

const refreshClassificationCache = async () => {
    const loaded = await loadClassificationCacheFromDb()
    classificationCache = loaded
    cacheExpiresAt = Date.now() + CLASSIFICATION_CACHE_TTL_MS
    return loaded
}

exports.invalidateClassificationCache = () => {
    classificationCache = null
    cacheExpiresAt = 0
}

/** Bare ONDC domain codes (e.g. RET14) from all enabled category rows. */
exports.getDistinctOndcDomains = async () => {
    if (classificationCache && Date.now() < cacheExpiresAt) {
        return classificationCache.domains
    }
    const loaded = await refreshClassificationCache()
    return loaded.domains
}

/** Admin subcategory form: distinct keywords + domain. */
exports.listOndcCategoryOptions = async () => {
    const rows = await loadAllCategoryRows()
    const byId = new Map(rows.map((r) => [r.id, r]))
    const map = new Map()

    for (const sub of rows) {
        if (sub.parentId == null) continue
        if (sub.enabled === false) continue
        const parent = byId.get(sub.parentId)
        if (!parent || parent.enabled === false) continue
        const domain = sub.ondcDomain || parent.ondcDomain || ''
        const keywords = keywordsFromRow(sub)
        const label = keywords.join(' , ') || sub.name
        const key = `${label}|${domain}`
        if (!map.has(key)) {
            map.set(key, { keywords: keywords.length ? keywords : [sub.name], domain })
        }
    }

    return [...map.values()]
        .sort((a, b) => String((a.keywords && a.keywords[0]) || '').localeCompare(String((b.keywords && b.keywords[0]) || '')))
}

/**
 * WHERE-conditions (OR'd) that identify a product as belonging to this
 * category row: stamped `category` (top-level) or `localCategory`
 * (subcategory) equal to the admin row name.
 */
const buildMatchConditions = (row, isTopLevel) => {
    const conditions = []
    if (row.name) {
        conditions.push(isTopLevel ? { category: row.name } : { localCategory: row.name })
    }
    return conditions
}

/**
 * Category tree for the Categories tab: top-level categories with their nested
 * subcategories, read straight from officeSupplyCategories in one query.
 *
 * `productCount` is a stored snapshot, not a live count — see
 * refreshCategoryProductCounts, which recomputes it off the request path;
 * `productCountUpdatedAt` says how fresh it is. Counting on read used to
 * dominate this endpoint's response time: a full-table MAX(id) dedup of
 * ondcProducts (grouped on bppUri, which is TEXT and unindexable) followed by
 * one COUNT per category and per subcategory, each inlining every product id as
 * an IN list and dozens of un-indexable REGEXP keyword predicates. Nothing here
 * touches the products table.
 *
 * Plain async (not Express asyncHandler) — the admin controller awaits this.
 */
exports.listAsTree = async () => {
    let rows = []
    try {
        rows = await loadAllCategoryRows()
        rows.sort((a, b) => {
            const parentA = a.parentId == null ? 0 : 1
            const parentB = b.parentId == null ? 0 : 1
            if (parentA !== parentB) return parentA - parentB
            const orderA = Number(a.displayOrder) || 0
            const orderB = Number(b.displayOrder) || 0
            if (orderA !== orderB) return orderA - orderB
            return String(a.name || '').localeCompare(String(b.name || ''))
        })
    } catch (err) {
        customLog(null, "error", {
            message: "listAsTree: failed loading categories",
            error: err?.message || err,
            sql: err?.parent?.sql || err?.sql,
        }, "VENDOR");
        throw err
    }

    copyOndcCategoryIntoKeywords(rows).catch((err) => {
        customLog(null, "error", {
            message: "listAsTree: failed copying ondcCategory into keywords",
            error: err?.message || err,
        }, "VENDOR");
    })

    // BIGINT ids can come back as strings, so both sides of the parent lookup
    // are cast before comparing. Strip leftover ondcCategory so the admin UI
    // only sees keywords (already merged below).
    const normalizeRow = (row) => {
        const rest = { ...row }
        delete rest.ondcCategory
        const keywords = keywordsFromRow(row)
        return {
            ...rest,
            id: Number(row.id),
            parentId: row.parentId == null ? null : Number(row.parentId),
            productCount: Number(row.productCount) || 0,
            keywords: row.parentId == null ? null : (keywords.length ? keywords : null),
        }
    }

    const childrenByParent = new Map()
    for (const row of rows) {
        if (row.parentId == null) continue
        const parentId = Number(row.parentId)
        if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, [])
        childrenByParent.get(parentId).push(normalizeRow(row))
    }

    return rows
        .filter((row) => row.parentId == null)
        .map((parent) => ({
            ...normalizeRow(parent),
            subcategories: childrenByParent.get(Number(parent.id)) || [],
        }))
}

/**
 * Enabled category tree for the corporate storefront category bar.
 *
 * Unlike listAsTree (admin), this drops disabled rows, omits admin-only fields
 * (productCount, mapping columns), and skips top-level
 * categories with no enabled subcategories — a parent alone is not browsable.
 * Subcategory names become localCategory filters on the products API.
 */
exports.listEnabledTreeForStorefront = async () => {
    let rows = []
    try {
        rows = await officeSupplyCategories.findAll({
            where: { enabled: true },
            order: [['parentId', 'ASC'], ['displayOrder', 'ASC'], ['name', 'ASC']],
            raw: true,
        })
    } catch (err) {
        customLog(null, "error", {
            message: "listEnabledTreeForStorefront: failed loading categories",
            error: err?.message || err,
            sql: err?.parent?.sql || err?.sql,
        }, "VENDOR");
        throw err
    }

    const childrenByParent = new Map()
    for (const row of rows) {
        if (row.parentId == null) continue
        const parentId = Number(row.parentId)
        if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, [])
        childrenByParent.get(parentId).push({
            id: Number(row.id),
            name: row.name,
            displayOrder: Number(row.displayOrder) || 0,
        })
    }

    return rows
        .filter((row) => row.parentId == null)
        .map((parent) => ({
            id: Number(parent.id),
            name: parent.name,
            displayOrder: Number(parent.displayOrder) || 0,
            iconUrl: parent.iconUrl || null,
            subcategories: childrenByParent.get(Number(parent.id)) || [],
        }))
        .filter((parent) => parent.subcategories.length > 0)
}

/**
 * The WHERE-fragment (to be negated with Op.not) identifying every product
 * that must be hidden from the corporate storefront: any row belonging to a
 * disabled category/subcategory, INCLUDING a subcategory whose PARENT is
 * disabled (cascaded at read time, without mutating the child's own
 * `enabled` column — preserves each child's independent state if the parent
 * is later re-enabled). Returns null when nothing is currently disabled.
 */
exports.resolveHiddenProductExclusion = async () => {
    const rows = await officeSupplyCategories.findAll({ raw: true })
    const byId = new Map(rows.map((r) => [r.id, r]))
    const hiddenConditions = []

    for (const r of rows) {
        const parent = r.parentId != null ? byId.get(r.parentId) : null
        const isHidden = r.enabled === false || (parent && parent.enabled === false)
        if (!isHidden) continue
        hiddenConditions.push(...buildMatchConditions(r, r.parentId == null))
    }

    return hiddenConditions.length ? { [Op.or]: hiddenConditions } : null
}

const CATEGORY_WRITE_LOCK = 'officeSupplyCategories:write'
const CATEGORY_WRITE_LOCK_TIMEOUT_S = 15

/**
 * Run `fn` holding a MySQL named lock, so category creates/renames run one at a
 * time across every instance of this service. The duplicate-name check reads
 * then writes (with an icon upload in between), so two concurrent saves — a
 * double-clicked Submit, two admins — would otherwise both pass the check and
 * both insert. There is no unique index to fall back on: MySQL lets a unique
 * (parentId, name) hold any number of NULL-parent rows, and names compare
 * case-insensitively after whitespace collapsing.
 *
 * The lock lives on a connection pinned by a transaction; `fn`'s own queries
 * run on other pooled connections in autocommit, so its writes are committed
 * before the lock is released.
 */
exports.withCategoryWriteLock = async (fn) => {
    const { sequelize } = officeSupplyCategories
    return sequelize.transaction(async (transaction) => {
        const [lock] = await sequelize.query('SELECT GET_LOCK(?, ?) AS acquired', {
            replacements: [CATEGORY_WRITE_LOCK, CATEGORY_WRITE_LOCK_TIMEOUT_S],
            type: QueryTypes.SELECT,
            transaction,
        })
        if (Number(lock?.acquired) !== 1) {
            const err = new Error('Another category change is being saved. Please try again.')
            err.status_code = 409
            throw err
        }
        try {
            return await fn()
        } finally {
            await sequelize.query('SELECT RELEASE_LOCK(?)', {
                replacements: [CATEGORY_WRITE_LOCK],
                type: QueryTypes.SELECT,
                transaction,
            })
        }
    })
}

/**
 * A category with the same name (case- and whitespace-insensitive) under the
 * same parent — top-level categories are siblings of each other. Products and
 * counts resolve categories by name, so two siblings sharing one would be
 * indistinguishable. `excludeId` skips the row being edited.
 */
exports.findSiblingWithName = async ({ name, parentId, excludeId }) => {
    const siblings = await officeSupplyCategories.findAll({
        attributes: ['id', 'name'],
        where: { parentId: parentId == null ? null : parentId },
        raw: true,
    })
    const wanted = normalizeName(String(name ?? '').replace(/\s+/g, ' '))
    return siblings.find((row) =>
        (excludeId == null || Number(row.id) !== Number(excludeId))
        && normalizeName(String(row.name ?? '').replace(/\s+/g, ' ')) === wanted,
    ) || null
}

const invalidateAfter = async (promise) => {
    const result = await promise
    exports.invalidateClassificationCache()
    return result
}

exports.createCategory = async ({ name, displayOrder, iconUrl }) => {
    return await invalidateAfter(officeSupplyCategories.create({
        name,
        iconUrl: iconUrl || null,
        ondcDomain: null,
        keywords: null,
        displayOrder: displayOrder || 0,
        parentId: null,
    }))
}

exports.createSubcategory = async ({
    parentId, name, ondcDomain, keywords, displayOrder,
}) => {
    const parent = await officeSupplyCategories.findOne({ where: { id: parentId }, raw: true })
    if (!parent) throw new Error('Parent category not found')
    if (parent.parentId != null) throw new Error('Cannot nest a subcategory under another subcategory')
    return await invalidateAfter(officeSupplyCategories.create({
        name,
        ondcDomain: ondcDomain || null,
        keywords: sanitizeKeywords(keywords),
        displayOrder: displayOrder || 0,
        parentId,
    }))
}

exports.updateCategory = async ({
    id, name, ondcDomain, keywords, displayOrder, iconUrl,
}) => {
    const existing = await officeSupplyCategories.findOne({ where: { id }, raw: true })
    const isSubcategory = !!existing?.parentId
    const result = await officeSupplyCategories.update(
        {
            name,
            displayOrder,
            ...(isSubcategory
                ? {
                    ondcDomain: ondcDomain || null,
                    // keywords no longer drive matching (seller categories are
                    // mapped on Products > Review); keep stored ones unless sent
                    ...(keywords !== undefined ? { keywords: sanitizeKeywords(keywords) } : {}),
                    iconUrl: null,
                }
                : {
                    ondcDomain: null,
                    keywords: null,
                    iconUrl: iconUrl || null,
                }),
        },
        { where: { id } },
    )
    exports.invalidateClassificationCache()
    return result
}

/**
 * Permanently remove a category, and — for a top-level one — its subcategories
 * with it, since the self-FK would otherwise leave them orphaned and invisible
 * in the tree. Both deletes share a transaction so a parent can never survive
 * without its children or vice versa.
 *
 * Products already ingested under the removed names are left alone: they carry
 * category names as plain strings, not an FK, and the 1-day purge clears them
 * once the seller stops re-confirming. They simply stop matching on ingestion,
 * which is the point of deleting the category.
 *
 * Prefer `setCategoryEnabled(false)` for anything reversible — disabling hides
 * a category while keeping its mapping, this throws them away.
 *
 * @returns {Promise<null|{id:number, wasSubcategory:boolean, subcategoriesDeleted:number}>}
 *          null when no such category exists.
 */
exports.deleteCategory = async ({ id }) => {
    const row = await officeSupplyCategories.findOne({ where: { id }, raw: true })
    if (!row) return null

    const isSubcategory = row.parentId != null
    const subcategoriesDeleted = await officeSupplyCategories.sequelize.transaction(
        async (transaction) => {
            const children = isSubcategory
                ? 0
                : await officeSupplyCategories.destroy({ where: { parentId: id }, transaction })
            await officeSupplyCategories.destroy({ where: { id }, transaction })
            return children
        },
    )

    exports.invalidateClassificationCache()
    await bumpCityListCache('*')
    return { id: Number(id), wasSubcategory: isSubcategory, subcategoriesDeleted }
}

exports.setCategoryEnabled = async ({ id, enabled }) => {
    const result = await officeSupplyCategories.update({ enabled: !!enabled }, { where: { id } })
    exports.invalidateClassificationCache()
    await bumpCityListCache('*')
    return result
}

const normalizeName = (value) => String(value ?? '').trim().toLowerCase()

/**
 * Recompute the denormalized productCount on every category row from a single
 * aggregate over ondcProducts.
 *
 * A subcategory counts the products stamped with its name as localCategory
 * under its parent's category; a parent sums its subcategories, so a product is
 * counted once. Names are compared case-insensitively, matching how ingestion
 * stamps them.
 *
 * Not for the request path — call it through
 * services/ondcCategoryCountRefresher.js, which debounces and serialises runs.
 *
 * @returns {Promise<{categories:number, updated:number, products:number}>}
 */
exports.refreshCategoryProductCounts = async () => {
    // Lazy require: ondc_product_with_transactionId requires THIS module at load
    // time, so a top-level require here would be a cycle and would destructure a
    // still-empty partial exports object. By call time both are fully loaded.
    // eslint-disable-next-line global-require
    const { countProductsByCategory } = require('./ondc_product_with_transactionId')

    const [rows, counts] = await Promise.all([
        officeSupplyCategories.findAll({ raw: true }),
        countProductsByCategory(),
    ])
    if (!rows.length) return { categories: 0, updated: 0, products: 0 }

    const totalByCategory = new Map()
    const totalBySubcategory = new Map()
    let products = 0
    for (const { category, localCategory, total } of counts) {
        const categoryKey = normalizeName(category)
        totalByCategory.set(categoryKey, (totalByCategory.get(categoryKey) || 0) + total)
        if (localCategory) {
            const subKey = `${categoryKey}|${normalizeName(localCategory)}`
            totalBySubcategory.set(subKey, (totalBySubcategory.get(subKey) || 0) + total)
        }
        products += total
    }

    const parentNameById = new Map()
    for (const row of rows) {
        if (row.parentId == null) parentNameById.set(Number(row.id), normalizeName(row.name))
    }

    const resolveTotal = (row) => {
        if (row.parentId == null) return totalByCategory.get(normalizeName(row.name)) || 0
        const parentKey = parentNameById.get(Number(row.parentId))
        if (!parentKey) return 0 // orphaned subcategory
        return totalBySubcategory.get(`${parentKey}|${normalizeName(row.name)}`) || 0
    }

    let updated = 0
    for (const row of rows) {
        const total = resolveTotal(row)
        if (Number(row.productCount) === total) continue
        // silent: these are derived columns, so writing them should not disturb
        // updatedAt, which reads as "when an admin last edited this category".
        // eslint-disable-next-line no-await-in-loop
        await officeSupplyCategories.update(
            { productCount: total },
            { where: { id: row.id }, silent: true },
        )
        updated += 1
    }

    // Stamp every row, not just the changed ones: the timestamp means "counts
    // last verified", so the admin UI does not report a correct-but-unchanged
    // count as stale.
    await officeSupplyCategories.update(
        { productCountUpdatedAt: new Date() },
        { where: {}, silent: true },
    )

    return { categories: rows.length, updated, products }
}
