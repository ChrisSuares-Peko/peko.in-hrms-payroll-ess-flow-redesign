const { Op } = require("sequelize");
const ondcProducts = require("../models/entities/ondc_product_with_transactionId");
const officeSupplyCategories = require("../models/entities/ondc_category");
const ondcSellerCategories = require("../models/entities/ondc_seller_category");
const ondcDomains = require("../models/entities/ondc_domain");
const rulesUseCase = require("../models/use-cases/ondc_catalog_rules");
const { findDisabledSellerNpBppIds, normalizeBppId } = require("../models/use-cases/ondc_seller_np");
const { bumpListCacheForCities } = require("./ondcProductListCache");
const { scheduleCategoryCountRefresh } = require("./ondcCategoryCountRefresher");
const { matchBannedKeyword } = require("../utils/ondcKeywordMatch");
const { toDomainCode } = require("../utils/ondcDomainLabels");

/**
 * The one place that decides a product's Peko category and whether the system
 * hides it. Every product from an enabled seller NP is stored; this stamps
 * `category` / `localCategory` (names of the effective Peko subcategory) and
 * `hiddenReason` / `hiddenDetail`, first failing rule wins:
 *
 *   sellerNp    its seller NP (bpp_id) is disabled (Seller NPs)
 *   domain      the product's ONDC domain is switched off (Rules)
 *   seller      the seller is blocked (Rules)
 *   keyword     a banned word is in its name or description (Rules) — fallback
 *               only; ingest refuses these
 *   excluded    its seller category is excluded (Review)
 *   unmapped    no Peko subcategory — seller category undecided and no
 *               per-product choice (Review)
 *   categoryWord a "Hide products containing" word of its seller category (Review)
 *   categoryOff the Peko subcategory or its parent is switched off (Categories)
 *   pending     new product not reviewed yet (Review); cleared by showing/hiding
 *               it or by first mapping its seller category
 *
 * `visibleOnPeko` stays the admin's own switch and is never touched here; the
 * storefront needs both (STOREFRONT_VISIBLE).
 */

const BATCH = 500;

const PRODUCT_ATTRS = [
    "id", "name", "shortDesc", "longDesc", "bppId", "ondcVendorId", "ondcDomain",
    "sellerCategoryId", "pekoCategoryOverrideId", "category", "localCategory",
    "hiddenReason", "hiddenDetail", "listingPositionOverride", "listingRank", "pendingReview",
];

const isTrue = (v) => v === true || v === 1;

// Listing position → `listingRank`, the storefront sort key: core 1 … low 4, else useful.
const LISTING_POSITIONS = ["core", "useful", "accessory", "low"];
const listingRankOf = (position) => LISTING_POSITIONS.indexOf(position) + 1 || 2;

/**
 * Everything evaluateProduct needs, loaded once per recompute.
 * @returns {Promise<{
 *   disabledSellerNps: Set<string>, domains: Map<string, boolean>, blockedSellers: Set<string>, bannedWords: string[],
 *   sellerCategories: Map<number, {status: string, pekoCategoryId: number|null, listingPosition: string, hideKeywords: string[]}>,
 *   subcategories: Map<number, {name: string, parentName: string, enabled: boolean}>,
 * }>}
 */
const loadVisibilityContext = async () => {
    const [disabledSellerNps, domainRows, blockedSellers, bannedWords, sellerCategoryRows, categoryRows] = await Promise.all([
        findDisabledSellerNpBppIds(),
        ondcDomains.findAll({ attributes: ["code", "enabled"], raw: true }),
        rulesUseCase.findBlockedSellerKeys(),
        rulesUseCase.findBannedWords(),
        ondcSellerCategories.findAll({ attributes: ["id", "status", "pekoCategoryId", "listingPosition", "hideKeywords"], raw: true }),
        officeSupplyCategories.findAll({ attributes: ["id", "name", "parentId", "enabled"], raw: true }),
    ]);
    const byId = new Map(categoryRows.map((r) => [Number(r.id), r]));
    const subcategories = new Map();
    for (const r of categoryRows) {
        if (r.parentId == null) continue;
        const parent = byId.get(Number(r.parentId));
        if (!parent) continue;
        subcategories.set(Number(r.id), {
            name: r.name,
            parentName: parent.name,
            enabled: r.enabled !== false && r.enabled !== 0 && parent.enabled !== false && parent.enabled !== 0,
        });
    }
    return {
        disabledSellerNps,
        domains: new Map(domainRows.map((r) => [r.code, isTrue(r.enabled)])),
        blockedSellers,
        bannedWords,
        sellerCategories: new Map(sellerCategoryRows.map((r) => [
            Number(r.id),
            {
                status: r.status,
                pekoCategoryId: r.pekoCategoryId == null ? null : Number(r.pekoCategoryId),
                listingPosition: r.listingPosition,
                hideKeywords: r.hideKeywords ? r.hideKeywords.split(",") : [],
            },
        ])),
        subcategories,
    };
};

/** The Peko subcategory id a product falls under, or null. */
const effectiveSubcategoryId = (product, ctx) => {
    if (product.pekoCategoryOverrideId != null) return Number(product.pekoCategoryOverrideId);
    const sellerCategory = ctx.sellerCategories.get(Number(product.sellerCategoryId));
    return sellerCategory?.status === "mapped" ? sellerCategory.pekoCategoryId : null;
};

/**
 * Pure: the category names, hidden reason and listing rank a product should have.
 * @returns {{category: string|null, localCategory: string|null, hiddenReason: string|null, hiddenDetail: string|null, listingRank: number}}
 */
const evaluateProduct = (product, ctx) => {
    const subId = effectiveSubcategoryId(product, ctx);
    const sub = subId != null ? ctx.subcategories.get(subId) : null;
    const sellerCategory = ctx.sellerCategories.get(Number(product.sellerCategoryId));
    const out = {
        category: sub ? sub.parentName : null,
        localCategory: sub ? sub.name : null,
        hiddenReason: null,
        hiddenDetail: null,
        listingRank: listingRankOf(product.listingPositionOverride || sellerCategory?.listingPosition),
    };
    const hide = (reason, detail = null) => ({ ...out, hiddenReason: reason, hiddenDetail: detail });

    const bppId = normalizeBppId(product.bppId);
    if (ctx.disabledSellerNps?.has(bppId)) return hide("sellerNp", bppId);

    // A domain without a row (or no domain at all) is not gated.
    const domainCode = toDomainCode(product.ondcDomain);
    if (domainCode && ctx.domains.get(domainCode) === false) return hide("domain", domainCode);

    const sellerKey = `${product.bppId}|${product.ondcVendorId}`;
    if (ctx.blockedSellers.has(sellerKey)) return hide("seller", sellerKey);

    const word = matchBannedKeyword([product.name, product.shortDesc, product.longDesc], ctx.bannedWords);
    if (word) return hide("keyword", word);

    // Excluded wins over a per-product choice: "exclude from listing" means all of it.
    if (sellerCategory?.status === "excluded") return hide("excluded", String(product.sellerCategoryId));

    if (!sub) return hide("unmapped", product.sellerCategoryId == null ? null : String(product.sellerCategoryId));
    const categoryWord = matchBannedKeyword([product.name, product.shortDesc, product.longDesc], sellerCategory?.hideKeywords);
    if (categoryWord) return hide("categoryWord", categoryWord);
    if (!sub.enabled) return hide("categoryOff", String(subId));
    if (isTrue(product.pendingReview)) return hide("pending");
    return out;
};

const FIELDS = ["category", "localCategory", "hiddenReason", "hiddenDetail"];
const differs = (row, next) =>
    FIELDS.some((f) => (row[f] ?? null) !== next[f]) || Number(row.listingRank) !== next.listingRank;

/**
 * Re-evaluate every product matching `where` and write what changed. Silent
 * updates: this is not a seller refresh, so updatedAt (the stale-purge clock)
 * must not move.
 * @returns {Promise<number>} rows changed
 */
const recomputeVisibility = async (where = {}, { ctx } = {}) => {
    const context = ctx || (await loadVisibilityContext());
    let lastId = 0;
    let changed = 0;
    for (;;) {
        const rows = await ondcProducts.findAll({
            attributes: PRODUCT_ATTRS,
            where: { [Op.and]: [where, { id: { [Op.gt]: lastId } }] },
            order: [["id", "ASC"]],
            limit: BATCH,
            raw: true,
        });
        if (!rows.length) break;

        // Rows that end up identical are written with one UPDATE.
        const groups = new Map();
        for (const row of rows) {
            const next = evaluateProduct(row, context);
            if (!differs(row, next)) continue;
            const key = JSON.stringify(next);
            if (!groups.has(key)) groups.set(key, { next, ids: [] });
            groups.get(key).ids.push(row.id);
        }
        for (const { next, ids } of groups.values()) {
            await ondcProducts.update(next, { where: { id: { [Op.in]: ids } }, silent: true });
            changed += ids.length;
        }

        lastId = rows[rows.length - 1].id;
        if (rows.length < BATCH) break;
    }
    if (changed) {
        await bumpListCacheForCities([]);
        scheduleCategoryCountRefresh();
    }
    return changed;
};

/** Scope helpers for callers that changed one rule. */
const SCOPES = {
    all: () => ({}),
    sellerNp: (bppId) => ({ bppId }),
    products: (ids) => ({ id: { [Op.in]: ids } }),
    sellerCategory: (id) => ({ sellerCategoryId: id }),
    seller: ({ bppId, providerId }) => ({ bppId, ondcVendorId: providerId }),
    // products under these Peko subcategories, by override or by mapping
    pekoSubcategories: (subIds, sellerCategoryIds) => ({
        [Op.or]: [
            { pekoCategoryOverrideId: { [Op.in]: subIds } },
            ...(sellerCategoryIds.length ? [{ sellerCategoryId: { [Op.in]: sellerCategoryIds } }] : []),
        ],
    }),
};

module.exports = {
    LISTING_POSITIONS,
    loadVisibilityContext,
    evaluateProduct,
    recomputeVisibility,
    SCOPES,
};
