const { Op, fn, col, literal } = require("sequelize");
const ondcDomains = require("../entities/ondc_domain");
const ondcBlockedSellers = require("../entities/ondc_blocked_seller");
const ondcBannedKeywords = require("../entities/ondc_banned_keyword");
const ondcIngestSkips = require("../entities/ondc_ingest_skip");
const ondcCatalogRuleLogs = require("../entities/ondc_catalog_rule_log");
const ondcProducts = require("../entities/ondc_product_with_transactionId");
const { getDistinctOndcDomains } = require("./ondc_category");
const { domainAliases } = require("../../utils/ondc_helper");
const { toDomainCode, domainLabel } = require("../../utils/ondcDomainLabels");
const { matchBannedKeyword } = require("../../utils/ondcKeywordMatch");
const { customLog } = require("../../utils/loggerHelper");
const { containsLike } = require("../../utils/escapeLike");

/**
 * Data access for Manage > Products > Rules (domains, blocked sellers, banned
 * keywords, counts, audit log). Rule-hidden products are stored with
 * ondcProducts.hiddenReason (services/ondcProductVisibility.js); imageless
 * and banned-word items are refused at ingest and counted from ondcIngestSkips.
 */

const SKIP_WINDOW_MS = 24 * 60 * 60 * 1000;
const CHUNK = 500;
// lastSeenAt is refreshed at most this often — catalogs arrive as many callbacks.
const DOMAIN_TOUCH_MS = 5 * 60 * 1000;

const skipWindowStart = (now = new Date()) => new Date(now.getTime() - SKIP_WINDOW_MS);
const sellerKey = (bppId, providerId) => `${bppId}|${providerId}`;
const toInt = (v) => parseInt(v, 10) || 0;
const chunks = (list, size = CHUNK) => {
    const out = [];
    for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
    return out;
};

const PRODUCT_KEY_ATTRS = ["id", "name", "vendorName", "bppId", "ondcVendorId", "ondcProductId", "ondcDomain"];

// ─── Domains ────────────────────────────────────────────────────────────────

let seedPromise = null;

/**
 * Rollout seed: the first time the table is empty, every domain already in use
 * (stored products + enabled category rows) is inserted ENABLED, so turning
 * the gate on does not stop ingest. Domains only seen later arrive disabled.
 */
const seedDomainsIfEmpty = () => {
    if (!seedPromise) {
        seedPromise = (async () => {
            await ondcDomains.ready;
            if (await ondcDomains.count()) return;
            const now = new Date();
            const rows = new Map();
            const stored = await ondcProducts.findAll({
                attributes: [[fn("DISTINCT", col("ondcDomain")), "ondcDomain"]],
                where: { ondcDomain: { [Op.ne]: null } },
                raw: true,
            });
            for (const r of stored) {
                const code = toDomainCode(r.ondcDomain);
                if (code) rows.set(code, { code, name: domainLabel(code), enabled: true, firstSeenAt: now, lastSeenAt: now });
            }
            for (const d of await getDistinctOndcDomains().catch(() => [])) {
                const code = toDomainCode(d);
                if (code && !rows.has(code)) {
                    rows.set(code, { code, name: domainLabel(code), enabled: true, firstSeenAt: null, lastSeenAt: null });
                }
            }
            if (rows.size) await ondcDomains.bulkCreate([...rows.values()], { ignoreDuplicates: true });
        })().catch((error) => {
            seedPromise = null;
            throw error;
        });
    }
    return seedPromise;
};

/**
 * Record a domain seen on on_search. Unknown domains are inserted disabled.
 * @returns {Promise<{code: string, enabled: boolean}|null>}
 */
exports.recordSeenDomain = async (rawCode) => {
    const code = toDomainCode(rawCode);
    if (!code) return null;
    await seedDomainsIfEmpty();
    const now = new Date();

    const existing = await ondcDomains.findOne({ where: { code } });
    if (existing) {
        const last = existing.lastSeenAt ? new Date(existing.lastSeenAt).getTime() : 0;
        if (now.getTime() - last > DOMAIN_TOUCH_MS) {
            await existing.update({ lastSeenAt: now, ...(existing.firstSeenAt ? {} : { firstSeenAt: now }) });
        }
        return { code, enabled: !!existing.enabled };
    }
    try {
        await ondcDomains.create({ code, name: domainLabel(code), enabled: false, firstSeenAt: now, lastSeenAt: now });
        return { code, enabled: false };
    } catch (error) {
        const raced = await ondcDomains.findOne({ where: { code } });
        if (raced) return { code, enabled: !!raced.enabled };
        throw error;
    }
};

/** Enabled domain codes, or null while the table has no rows (gate not active yet). */
exports.findEnabledDomainCodes = async () => {
    await seedDomainsIfEmpty();
    const rows = await ondcDomains.findAll({ attributes: ["code", "enabled"], raw: true });
    if (!rows.length) return null;
    return new Set(rows.filter((r) => r.enabled === true || r.enabled === 1).map((r) => r.code));
};

exports.listDomains = async () => {
    await seedDomainsIfEmpty();
    const [rows, storedRows] = await Promise.all([
        ondcDomains.findAll({ order: [["code", "ASC"]], raw: true }),
        ondcProducts.findAll({
            attributes: [
                "ondcDomain",
                [fn("COUNT", col("id")), "count"],
                [fn("SUM", literal("CASE WHEN hiddenReason = 'domain' THEN 1 ELSE 0 END")), "hidden"],
            ],
            where: { ondcDomain: { [Op.ne]: null } },
            group: ["ondcDomain"],
            raw: true,
        }),
    ]);
    const stored = new Map();
    const hidden = new Map();
    for (const r of storedRows) {
        const code = toDomainCode(r.ondcDomain);
        stored.set(code, (stored.get(code) || 0) + toInt(r.count));
        hidden.set(code, (hidden.get(code) || 0) + toInt(r.hidden));
    }
    return rows.map((r) => ({
        id: Number(r.id),
        code: r.code,
        name: r.name || domainLabel(r.code),
        enabled: r.enabled === true || r.enabled === 1,
        lastSeenAt: r.lastSeenAt,
        storedCount: stored.get(r.code) || 0,
        // products this domain being off hides (first failing rule)
        hiddenCount: hidden.get(r.code) || 0,
    }));
};

/** @returns {Promise<Array<{code, name, enabled}>>} rows whose flag actually changed */
exports.setDomainsEnabled = async (changes) => {
    const codes = changes.map((c) => toDomainCode(c.code)).filter(Boolean);
    const rows = await ondcDomains.findAll({ where: { code: { [Op.in]: codes } } });
    const byCode = new Map(rows.map((r) => [r.code, r]));
    const changed = [];
    for (const c of changes) {
        const row = byCode.get(toDomainCode(c.code));
        if (!row || !!row.enabled === !!c.enabled) continue;
        await row.update({ enabled: !!c.enabled });
        changed.push({ code: row.code, name: row.name || domainLabel(row.code), enabled: !!c.enabled });
    }
    return changed;
};

exports.findDomainsByCodes = async (codes) =>
    ondcDomains.findAll({ where: { code: { [Op.in]: codes.map(toDomainCode).filter(Boolean) } }, raw: true });

// ─── Blocked sellers ────────────────────────────────────────────────────────

exports.findBlockedSellerKeys = async () => {
    const rows = await ondcBlockedSellers.findAll({ attributes: ["bppId", "providerId"], raw: true });
    return new Set(rows.map((r) => sellerKey(r.bppId, r.providerId)));
};

exports.listBlockedSellers = async () => {
    const rows = await ondcBlockedSellers.findAll({ order: [["createdAt", "DESC"]], raw: true });
    if (!rows.length) return [];
    const productRows = await ondcProducts.findAll({
        attributes: ["bppId", "ondcVendorId", "hiddenReason", [fn("COUNT", col("id")), "count"]],
        where: { [Op.or]: rows.map((r) => ({ bppId: r.bppId, ondcVendorId: r.providerId })) },
        group: ["bppId", "ondcVendorId", "hiddenReason"],
        raw: true,
    });
    const counts = new Map();
    for (const r of productRows) {
        const key = sellerKey(r.bppId, r.ondcVendorId);
        const entry = counts.get(key) || { seller: 0, earlier: 0, total: 0 };
        const n = toInt(r.count);
        if (r.hiddenReason === "seller") entry.seller += n;
        // the seller-NP and domain rules run first, so they claim these before the block does
        if (r.hiddenReason === "sellerNp" || r.hiddenReason === "domain") entry.earlier += n;
        entry.total += n;
        counts.set(key, entry);
    }
    return rows.map((r) => {
        const c = counts.get(sellerKey(r.bppId, r.providerId)) || { seller: 0, earlier: 0, total: 0 };
        return {
            id: Number(r.id),
            bppId: r.bppId,
            providerId: r.providerId,
            sellerName: r.sellerName,
            reason: r.reason,
            blockedByName: r.blockedByName,
            createdAt: r.createdAt,
            hiding: c.seller,
            hiddenByEarlierRule: c.earlier,
            total: c.total,
        };
    });
};

/** Sellers with stored products, for the "Block a seller" picker. */
exports.findSellerOptions = async ({ search = "", limit = 20 } = {}) => {
    const where = { bppId: { [Op.ne]: null }, ondcVendorId: { [Op.ne]: null } };
    const q = String(search || "").trim();
    if (q) {
        where[Op.or] = [
            { vendorName: { [Op.like]: containsLike(q) } },
            { ondcVendorId: { [Op.like]: containsLike(q) } },
            { bppId: { [Op.like]: containsLike(q) } },
        ];
    }
    const [rows, blocked] = await Promise.all([
        ondcProducts.findAll({
            attributes: ["bppId", "ondcVendorId", [fn("MAX", col("vendorName")), "vendorName"], [fn("COUNT", col("id")), "count"]],
            where,
            group: ["bppId", "ondcVendorId"],
            order: [[fn("COUNT", col("id")), "DESC"]],
            limit: Math.min(50, Math.max(1, toInt(limit) || 20)),
            raw: true,
        }),
        exports.findBlockedSellerKeys(),
    ]);
    return rows
        .filter((r) => !blocked.has(sellerKey(r.bppId, r.ondcVendorId)))
        .map((r) => ({
            bppId: r.bppId,
            providerId: r.ondcVendorId,
            sellerName: r.vendorName,
            productCount: toInt(r.count),
        }));
};

exports.findBlockedSeller = async ({ bppId, providerId }) =>
    ondcBlockedSellers.findOne({ where: { bppId, providerId }, raw: true });

exports.createBlockedSeller = async ({ bppId, providerId, sellerName, reason, actor }) => {
    const row = await ondcBlockedSellers.create({
        bppId,
        providerId,
        sellerName: sellerName || null,
        reason: reason || null,
        blockedById: actor?.id ?? null,
        blockedByName: actor?.name ?? null,
    });
    return row.get({ plain: true });
};

/** @returns {Promise<object|null>} the removed row */
exports.deleteBlockedSeller = async (id) => {
    const row = await ondcBlockedSellers.findByPk(id);
    if (!row) return null;
    const plain = row.get({ plain: true });
    await row.destroy();
    return plain;
};

// ─── Banned keywords ────────────────────────────────────────────────────────

exports.findBannedWords = async () => {
    const rows = await ondcBannedKeywords.findAll({ attributes: ["word"], order: [["id", "ASC"]], raw: true });
    return rows.map((r) => r.word);
};

exports.listBannedKeywords = async () => {
    // hits = items refused in the last 24 h + stored rows still hidden by the word
    const [rows, skipRows, hitRows] = await Promise.all([
        ondcBannedKeywords.findAll({ order: [["createdAt", "DESC"], ["id", "DESC"]], raw: true }),
        ondcIngestSkips.findAll({
            attributes: [["ruleKey", "hiddenDetail"], [fn("COUNT", col("id")), "count"]],
            where: { reason: "keyword", lastSeenAt: { [Op.gte]: skipWindowStart() } },
            group: ["ruleKey"],
            raw: true,
        }),
        ondcProducts.findAll({
            attributes: ["hiddenDetail", [fn("COUNT", col("id")), "count"]],
            where: { hiddenReason: "keyword" },
            group: ["hiddenDetail"],
            raw: true,
        }),
    ]);
    const hits = new Map();
    for (const r of [...skipRows, ...hitRows]) hits.set(r.hiddenDetail, (hits.get(r.hiddenDetail) || 0) + toInt(r.count));
    return rows.map((r) => ({
        id: Number(r.id),
        word: r.word,
        hits: hits.get(r.word) || 0,
        addedByName: r.addedByName,
        createdAt: r.createdAt,
    }));
};

/** Inserts the words not already banned; returns those. */
exports.addBannedKeywords = async (words, actor) => {
    const existing = new Set(await exports.findBannedWords());
    const fresh = words.filter((w) => !existing.has(w));
    if (fresh.length) {
        await ondcBannedKeywords.bulkCreate(
            fresh.map((word) => ({ word, addedById: actor?.id ?? null, addedByName: actor?.name ?? null })),
            { ignoreDuplicates: true }
        );
    }
    return fresh;
};

exports.deleteBannedKeyword = async (id) => {
    const row = await ondcBannedKeywords.findByPk(id);
    if (!row) return null;
    const plain = row.get({ plain: true });
    await row.destroy();
    return plain;
};

// ─── Ingest skips ───────────────────────────────────────────────────────────

exports.upsertIngestSkips = async (rows) => {
    for (const part of chunks(rows)) {
        await ondcIngestSkips.bulkCreate(part, {
            updateOnDuplicate: ["productName", "sellerName", "ondcDomain", "reason", "ruleKey", "lastSeenAt"],
        });
    }
};

exports.pruneIngestSkips = async (now = new Date()) =>
    ondcIngestSkips.destroy({ where: { lastSeenAt: { [Op.lt]: skipWindowStart(now) } } });

exports.deleteKeywordSkips = async (word) =>
    ondcIngestSkips.destroy({ where: { reason: "keyword", ruleKey: word } });

// ─── Stored products matching a rule ───────────────────────────────────────

exports.findStoredByDomains = async (codes) => {
    const aliases = codes.flatMap((c) => domainAliases(c));
    if (!aliases.length) return [];
    return ondcProducts.findAll({ attributes: PRODUCT_KEY_ATTRS, where: { ondcDomain: { [Op.in]: aliases } }, raw: true });
};

exports.findStoredBySeller = async ({ bppId, providerId }) =>
    ondcProducts.findAll({ attributes: PRODUCT_KEY_ATTRS, where: { bppId, ondcVendorId: providerId }, raw: true });

// ─── Seller NPs (Manage > Products > Seller NPs) ────────────────────────────

/** Every stored product of one seller app (bpp_id). */
exports.findStoredBySellerNp = async (bppId) =>
    ondcProducts.findAll({ attributes: PRODUCT_KEY_ATTRS, where: { bppId }, raw: true });

/**
 * The admin switch (visibleOnPeko) for every product of one seller app.
 * Silent: not a seller refresh, so the stale-purge clock (updatedAt) stays put.
 * @returns {Promise<number>} rows updated
 */
exports.setSellerNpProductsVisible = async (bppId, visible) => {
    const [n] = await ondcProducts.update({ visibleOnPeko: !!visible }, { where: { bppId }, silent: true });
    return toInt(n);
};

/** @returns {Promise<Map<string, number>>} lower-cased bpp_id → stored products */
exports.countProductsBySellerNp = async (bppIds) => {
    if (!bppIds.length) return new Map();
    const rows = await ondcProducts.findAll({
        attributes: ["bppId", [fn("COUNT", col("id")), "count"]],
        where: { bppId: { [Op.in]: bppIds } },
        group: ["bppId"],
        raw: true,
    });
    const counts = new Map();
    for (const r of rows) {
        const key = String(r.bppId || "").trim().toLowerCase();
        counts.set(key, (counts.get(key) || 0) + toInt(r.count));
    }
    return counts;
};

/**
 * Stored products hit by `words`, each attributed to the first word that
 * matches it. A LIKE prefilter narrows the scan; the shared whole-word matcher
 * decides (so "acid" does not take "acidity").
 * @returns {Promise<Map<string, object[]>>} word → products
 */
exports.findStoredByWords = async (words) => {
    const result = new Map(words.map((w) => [w, []]));
    if (!words.length) return result;
    // Every word's tokens must appear; the first token is enough to prefilter.
    const likeClauses = words.flatMap((w) => {
        const token = containsLike(w.split(" ")[0]);
        return [{ name: { [Op.like]: token } }, { shortDesc: { [Op.like]: token } }, { longDesc: { [Op.like]: token } }];
    });
    const candidates = await ondcProducts.findAll({
        attributes: [...PRODUCT_KEY_ATTRS, "shortDesc", "longDesc"],
        where: { [Op.or]: likeClauses },
        raw: true,
    });
    for (const p of candidates) {
        const word = matchBannedKeyword([p.name, p.shortDesc, p.longDesc], words);
        if (!word) continue;
        // descriptions were only needed for matching — return the key fields
        result.get(word).push(Object.fromEntries(PRODUCT_KEY_ATTRS.map((a) => [a, p[a]])));
    }
    return result;
};

exports.destroyProductsByIds = async (ids) => {
    let deleted = 0;
    for (const part of chunks(ids)) {
        deleted += toInt(await ondcProducts.destroy({ where: { id: { [Op.in]: part } } }));
    }
    return deleted;
};

/** Delete stored rows of one seller app by product key ({ providerId, ondcProductId }). */
exports.destroyProductsByKeys = async (bppId, keys) => {
    let deleted = 0;
    for (const part of chunks(keys)) {
        const or = part.map((k) => ({ ondcVendorId: k.providerId, ondcProductId: k.ondcProductId }));
        deleted += toInt(await ondcProducts.destroy({ where: { bppId, [Op.or]: or } }));
    }
    return deleted;
};

// ─── Audit log ─────────────────────────────────────────────────────────────

exports.createRuleLog = async ({ section, action, detail = null, actor, targetType = null, targetId = null }) =>
    ondcCatalogRuleLogs.create({
        section,
        action: String(action).slice(0, 255),
        detail,
        targetType,
        targetId,
        actorId: actor?.id ?? null,
        actorName: actor?.name ?? null,
    });

/**
 * createRuleLog for callers whose change is already saved: a history write
 * that fails is logged, never turned into a failed request.
 * @returns {Promise<object|null>} the log row, or null when it could not be written
 */
exports.createRuleLogSafely = async (entry) => {
    try {
        return await exports.createRuleLog(entry);
    } catch (error) {
        customLog(null, "error", {
            scope: "ondcCatalogRuleLogs",
            step: "write-failed",
            message: "Could not write rule history; the change itself was saved",
            section: entry?.section,
            action: entry?.action,
            error: error?.message || String(error),
        }, "VENDOR");
        return null;
    }
};

exports.listRuleLogs =async ({ section, targetType, targetId, page = 1, itemsPerPage = 20 } = {}) => {
    const limit = Math.min(100, Math.max(1, toInt(itemsPerPage) || 20));
    const offset = Math.max(0, ((toInt(page) || 1) - 1) * limit);
    const where = {};
    if (section) where.section = section;
    if (targetType) Object.assign(where, { targetType, targetId });
    const { rows, count } = await ondcCatalogRuleLogs.findAndCountAll({
        where,
        order: [["createdAt", "DESC"], ["id", "DESC"]],
        limit,
        offset,
        raw: true,
    });
    return { rows, count };
};

/** Latest log row per section: `{ [section]: { actorName, createdAt } }`. */
exports.findLatestRuleLogs = async () => {
    const latestIds = await ondcCatalogRuleLogs.findAll({
        attributes: [[fn("MAX", col("id")), "id"]],
        group: ["section"],
        raw: true,
    });
    const ids = latestIds.map((r) => r.id).filter(Boolean);
    if (!ids.length) return {};
    const rows = await ondcCatalogRuleLogs.findAll({ where: { id: { [Op.in]: ids } }, raw: true });
    return Object.fromEntries(rows.map((r) => [r.section, { actorName: r.actorName, createdAt: r.createdAt }]));
};

// ─── Summary ────────────────────────────────────────────────────────────────

/**
 * Counts for the Rules tab header. Every product is in exactly one bucket:
 * not stored (no usable image or banned word, last 24 h), hidden by the first rule it fails
 * (hiddenReason), switched off by an admin, out of stock, or visible.
 */
exports.getCatalogSummary = async () => {
    const passes = { hiddenReason: null };
    const recentSkips = (reason) => ondcIngestSkips.count({ where: { reason, lastSeenAt: { [Op.gte]: skipWindowStart() } } });
    const [noImage, keywordSkips, reasonRows, unmappedCategories, storedTotal, manual, visible] = await Promise.all([
        recentSkips("noImage"),
        recentSkips("keyword"),
        ondcProducts.findAll({
            attributes: ["hiddenReason", [fn("COUNT", col("id")), "count"]],
            where: { hiddenReason: { [Op.ne]: null } },
            group: ["hiddenReason"],
            raw: true,
        }),
        ondcProducts.count({ distinct: true, col: "sellerCategoryId", where: { hiddenReason: "unmapped" } }),
        ondcProducts.count(),
        ondcProducts.count({ where: { ...passes, visibleOnPeko: false } }),
        ondcProducts.count({
            where: { ...passes, visibleOnPeko: { [Op.ne]: false }, category: { [Op.ne]: null }, availableQuantity: { [Op.gt]: 0 } },
        }),
    ]);
    const reasons = Object.fromEntries(reasonRows.map((r) => [r.hiddenReason, toInt(r.count)]));
    const ruleHidden = Object.values(reasons).reduce((a, b) => a + b, 0);
    const outOfStock = Math.max(0, storedTotal - ruleHidden - manual - visible);

    const hiddenBy = [
        { key: "sellerNp", label: "Seller NP disabled", count: reasons.sellerNp || 0 },
        { key: "domain", label: "Domain not allowed", count: reasons.domain || 0 },
        { key: "seller", label: "Seller blocked", count: reasons.seller || 0 },
        { key: "keyword", label: "Banned keyword", count: keywordSkips + (reasons.keyword || 0) },
        { key: "excluded", label: "Seller category excluded", count: reasons.excluded || 0 },
        { key: "unmapped", label: "Category not mapped", count: reasons.unmapped || 0 },
        { key: "categoryWord", label: "Seller category word", count: reasons.categoryWord || 0 },
        { key: "categoryOff", label: "Peko category off", count: reasons.categoryOff || 0 },
        { key: "pending", label: "New, waiting for review", count: reasons.pending || 0 },
        { key: "noImage", label: "No usable image", count: noImage },
        { key: "manual", label: "Hidden manually", count: toInt(manual) },
        { key: "outOfStock", label: "Out of stock", count: outOfStock },
    ];
    const synced = storedTotal + noImage + keywordSkips;
    return {
        synced,
        visible,
        hidden: synced - visible,
        hiddenBy,
        unmapped: {
            products: reasons.unmapped || 0,
            sellerCategories: toInt(unmappedCategories),
            excludedProducts: reasons.excluded || 0,
        },
    };
};

exports.sellerKey = sellerKey;
exports.seedDomainsIfEmpty = seedDomainsIfEmpty;
