const { Op, fn, col, literal } = require("sequelize");
const ondcSellerCategories = require("../entities/ondc_seller_category");
const ondcProducts = require("../entities/ondc_product_with_transactionId");
const officeSupplyCategories = require("../entities/ondc_category");
const ondcSellerNps = require("../entities/ondc_seller_np");
const { toDomainCode } = require("../../utils/ondcDomainLabels");
const { containsLike } = require("../../utils/escapeLike");

/**
 * Data access for Manage > Products > Review: seller categories (the category
 * a seller sends on each item) and the admin's decision for each. Visibility
 * is applied by services/ondcProductVisibility.js.
 */

const STATUSES = ["unmapped", "mapped", "excluded"];
const NONE_KEY = "__none__";
const SELLERS_SHOWN = 3;
const toInt = (v) => parseInt(v, 10) || 0;

/** `item.category_id` → the stored key; one key for items that send none. */
const normalizeCategoryKey = (raw) => {
    const key = String(raw ?? "").trim().toLowerCase().slice(0, 191);
    return key || NONE_KEY;
};

// Products the storefront shows: passes every rule, admin switch on, in stock.
const VISIBLE_SQL =
    "(hiddenReason IS NULL AND visibleOnPeko <> 0 AND category IS NOT NULL AND availableQuantity > 0)";

// Review lists only seller categories that currently hold products — one whose
// products were all purged / deleted has nothing to decide on.
const HAS_PRODUCTS_WHERE = {
    id: {
        [Op.in]: literal("(SELECT DISTINCT p.sellerCategoryId FROM ondcProducts p WHERE p.sellerCategoryId IS NOT NULL)"),
    },
};

// To review = undecided, or mapped with new products nobody has looked at yet.
const TO_REVIEW_WHERE = {
    [Op.or]: [
        { status: "unmapped" },
        {
            status: "mapped",
            id: {
                [Op.in]: literal(
                    "(SELECT DISTINCT p.sellerCategoryId FROM ondcProducts p WHERE p.pendingReview = 1 AND p.sellerCategoryId IS NOT NULL)"
                ),
            },
        },
    ],
};

// ─── Ingest ────────────────────────────────────────────────────────────────

/**
 * Upsert the seller categories seen in one on_search callback. New ones
 * arrive `unmapped` + `isNew` (To review); known ones get lastSeenAt and,
 * when the seller now sends a descriptor name, that label.
 * @param {Array<{ondcDomain: string, categoryKey: string, label: string|null}>} entries
 * @returns {Promise<Map<string, number>>} `${ondcDomain}|${categoryKey}` → id
 */
exports.upsertSellerCategories = async (entries) => {
    const unique = new Map();
    for (const e of entries) {
        const ondcDomain = toDomainCode(e.ondcDomain) || "UNKNOWN";
        const categoryKey = normalizeCategoryKey(e.categoryKey);
        const key = `${ondcDomain}|${categoryKey}`;
        const label = e.label ? String(e.label).trim().slice(0, 255) : null;
        const prev = unique.get(key);
        // prefer a descriptor name over the bare id
        if (!prev || (!prev.label && label)) unique.set(key, { ondcDomain, categoryKey, label });
    }
    if (!unique.size) return new Map();

    const wanted = [...unique.values()];
    const find = () => ondcSellerCategories.findAll({
        where: { [Op.or]: wanted.map(({ ondcDomain, categoryKey }) => ({ ondcDomain, categoryKey })) },
        raw: true,
    });
    let rows = await find();
    const known = new Set(rows.map((r) => `${r.ondcDomain}|${r.categoryKey}`));
    const now = new Date();
    const fresh = wanted.filter((w) => !known.has(`${w.ondcDomain}|${w.categoryKey}`));
    if (fresh.length) {
        await ondcSellerCategories.bulkCreate(
            fresh.map((w) => ({
                ...w,
                label: w.label || (w.categoryKey === NONE_KEY ? "No category sent" : w.categoryKey),
                status: "unmapped",
                isNew: true,
                firstSeenAt: now,
                lastSeenAt: now,
            })),
            { ignoreDuplicates: true }
        );
        rows = await find();
    }

    const existingIds = rows.filter((r) => known.has(`${r.ondcDomain}|${r.categoryKey}`)).map((r) => r.id);
    if (existingIds.length) {
        await ondcSellerCategories.update({ lastSeenAt: now }, { where: { id: { [Op.in]: existingIds } }, silent: true });
    }
    for (const r of rows) {
        const want = unique.get(`${r.ondcDomain}|${r.categoryKey}`);
        if (want?.label && want.label !== r.label) {
            await ondcSellerCategories.update({ label: want.label }, { where: { id: r.id }, silent: true });
        }
    }
    return new Map(rows.map((r) => [`${r.ondcDomain}|${r.categoryKey}`, Number(r.id)]));
};

// ─── Peko categories ───────────────────────────────────────────────────────

/** id → { id, name, parentId, parentName, enabled } for every category row. */
const loadPekoCategories = async () => {
    const rows = await officeSupplyCategories.findAll({ attributes: ["id", "name", "parentId", "enabled"], raw: true });
    const byId = new Map(rows.map((r) => [Number(r.id), r]));
    return new Map(rows.map((r) => {
        const parent = r.parentId != null ? byId.get(Number(r.parentId)) : null;
        return [Number(r.id), {
            id: Number(r.id),
            name: r.name,
            parentId: r.parentId == null ? null : Number(r.parentId),
            parentName: parent?.name ?? null,
        }];
    }));
};
exports.loadPekoCategories = loadPekoCategories;

const pekoCategoryDto = (cats, id) => {
    const c = id != null ? cats.get(Number(id)) : null;
    return c ? { id: c.id, name: c.name, parentName: c.parentName } : null;
};

// ─── Review list / detail ──────────────────────────────────────────────────

/** Adds product counts, sellers and seller NPs to seller-category rows. */
const decorate = async (rows) => {
    if (!rows.length) return [];
    const ids = rows.map((r) => r.id);
    const [counts, sources, cats] = await Promise.all([
        ondcProducts.findAll({
            attributes: [
                "sellerCategoryId",
                [fn("COUNT", col("id")), "productCount"],
                [fn("SUM", literal(`CASE WHEN ${VISIBLE_SQL} THEN 1 ELSE 0 END`)), "visibleCount"],
                [fn("SUM", literal("CASE WHEN pendingReview = 1 THEN 1 ELSE 0 END")), "newProductCount"],
            ],
            where: { sellerCategoryId: { [Op.in]: ids } },
            group: ["sellerCategoryId"],
            raw: true,
        }),
        ondcProducts.findAll({
            attributes: ["sellerCategoryId", "vendorName", "bppId"],
            where: { sellerCategoryId: { [Op.in]: ids } },
            group: ["sellerCategoryId", "vendorName", "bppId"],
            raw: true,
        }),
        loadPekoCategories(),
    ]);
    const bppIds = [...new Set(sources.map((s) => s.bppId).filter(Boolean))];
    const nps = bppIds.length
        ? await ondcSellerNps.findAll({
            attributes: ["bppId", "npName"],
            where: { bppId: { [Op.in]: bppIds.map((b) => String(b).trim().toLowerCase()) } },
            raw: true,
        })
        : [];
    const npName = new Map(nps.map((n) => [n.bppId, n.npName || n.bppId]));

    const countBy = new Map(counts.map((c) => [Number(c.sellerCategoryId), c]));
    const sourcesBy = new Map();
    for (const s of sources) {
        const key = Number(s.sellerCategoryId);
        const acc = sourcesBy.get(key) || { sellers: new Set(), nps: new Set() };
        if (s.vendorName) acc.sellers.add(s.vendorName);
        if (s.bppId) acc.nps.add(npName.get(String(s.bppId).trim().toLowerCase()) || s.bppId);
        sourcesBy.set(key, acc);
    }

    return rows.map((r) => {
        const c = countBy.get(Number(r.id));
        const productCount = toInt(c?.productCount);
        const visibleCount = toInt(c?.visibleCount);
        const src = sourcesBy.get(Number(r.id));
        const sellers = src ? [...src.sellers] : [];
        return {
            id: Number(r.id),
            label: r.label,
            categoryKey: r.categoryKey,
            ondcDomain: r.ondcDomain,
            status: r.status,
            isNew: r.isNew === true || r.isNew === 1,
            pekoCategory: r.status === "mapped" ? pekoCategoryDto(cats, r.pekoCategoryId) : null,
            listingPosition: r.listingPosition || "useful",
            hideKeywords: r.hideKeywords ? r.hideKeywords.split(",") : [],
            productCount,
            visibleCount,
            hiddenCount: productCount - visibleCount,
            newProductCount: toInt(c?.newProductCount),
            sellers: sellers.slice(0, SELLERS_SHOWN),
            sellerCount: sellers.length,
            sellerNps: src ? [...src.nps] : [],
            firstSeenAt: r.firstSeenAt,
            lastSeenAt: r.lastSeenAt,
            decidedAt: r.decidedAt,
            decidedByName: r.decidedByName,
        };
    });
};

const PRODUCT_COUNT_SQL =
    "(SELECT COUNT(*) FROM ondcProducts p WHERE p.sellerCategoryId = ondcSellerCategories.id)";

exports.listSellerCategories = async ({
    status = "unmapped",
    search = "",
    page = 1,
    itemsPerPage = 10,
    sortField,
    sort = "DESC",
} = {}) => {
    const and = [HAS_PRODUCTS_WHERE];
    if (status === "unmapped") and.push(TO_REVIEW_WHERE);
    else if (STATUSES.includes(status)) and.push({ status });
    const q = String(search || "").trim();
    if (q) {
        and.push({ [Op.or]: [
            { label: { [Op.like]: containsLike(q) } },
            { categoryKey: { [Op.like]: containsLike(q.toLowerCase()) } },
            // seller or NP name: any of its products' vendors
            {
                id: {
                    [Op.in]: literal(
                        `(SELECT DISTINCT p.sellerCategoryId FROM ondcProducts p WHERE p.sellerCategoryId IS NOT NULL AND (p.vendorName LIKE ${ondcProducts.sequelize.escape(containsLike(q))} OR p.bppId LIKE ${ondcProducts.sequelize.escape(containsLike(q))}))`
                    ),
                },
            },
        ] });
    }
    const where = { [Op.and]: and };
    const dir = String(sort).toUpperCase() === "ASC" ? "ASC" : "DESC";
    let order;
    if (sortField === "productCount") order = [[literal(PRODUCT_COUNT_SQL), dir], ["id", "DESC"]];
    else if (sortField === "lastSeenAt") order = [["lastSeenAt", dir], ["id", "DESC"]];
    // default: new first, then the biggest categories
    else order = [["isNew", "DESC"], [literal(PRODUCT_COUNT_SQL), "DESC"], ["id", "DESC"]];

    const limit = Math.min(100, Math.max(1, toInt(itemsPerPage) || 10));
    const offset = Math.max(0, ((toInt(page) || 1) - 1) * limit);
    const [{ rows, count }, statusRows, toReview] = await Promise.all([
        ondcSellerCategories.findAndCountAll({ where, order, limit, offset, raw: true }),
        ondcSellerCategories.findAll({
            attributes: ["status", [fn("COUNT", col("id")), "count"]],
            where: HAS_PRODUCTS_WHERE,
            group: ["status"],
            raw: true,
        }),
        ondcSellerCategories.count({ where: { [Op.and]: [HAS_PRODUCTS_WHERE, TO_REVIEW_WHERE] } }),
    ]);
    const counts = { unmapped: 0, mapped: 0, excluded: 0, all: 0 };
    for (const r of statusRows) {
        if (r.status in counts) counts[r.status] = toInt(r.count);
        counts.all += toInt(r.count);
    }
    // the To review tab (key `unmapped`) also holds mapped categories with new products
    counts.unmapped = toInt(toReview);
    return { rows: await decorate(rows), count, counts };
};

exports.getSellerCategory = async (id) => {
    const row = await ondcSellerCategories.findByPk(id, { raw: true });
    if (!row) return null;
    const [decorated] = await decorate([row]);
    return decorated;
};

exports.listSellerCategoryProducts = async (id, { visibility = "all", search = "", page = 1, itemsPerPage = 20 } = {}) => {
    const and = [{ sellerCategoryId: id }];
    if (visibility === "visible") and.push(literal(VISIBLE_SQL));
    if (visibility === "hidden") and.push(literal(`NOT ${VISIBLE_SQL}`));
    if (visibility === "new") and.push({ pendingReview: true });
    const q = String(search || "").trim();
    if (q) and.push({ [Op.or]: [{ name: { [Op.like]: containsLike(q) } }, { vendorName: { [Op.like]: containsLike(q) } }] });

    const limit = Math.min(100, Math.max(1, toInt(itemsPerPage) || 20));
    const offset = Math.max(0, ((toInt(page) || 1) - 1) * limit);
    const [{ rows, count }, cats] = await Promise.all([
        ondcProducts.findAndCountAll({
            attributes: [
                "id", "name", "vendorName", "price", "maxPrice", "images", "symbol", "availableQuantity",
                "visibleOnPeko", "hiddenReason", "hiddenDetail", "pekoCategoryOverrideId", "category", "localCategory", "listingPositionOverride",
                "pendingReview",
            ],
            where: { [Op.and]: and },
            order: [["name", "ASC"], ["id", "ASC"]],
            limit,
            offset,
            raw: true,
        }),
        loadPekoCategories(),
    ]);
    return {
        count,
        rows: rows.map((r) => {
            let images = r.images;
            if (typeof images === "string") {
                try { images = JSON.parse(images); } catch (e) { images = []; }
            }
            const overridden = r.pekoCategoryOverrideId != null;
            return {
                id: Number(r.id),
                name: r.name,
                vendorName: r.vendorName,
                price: r.price == null ? null : Number(r.price),
                maxPrice: r.maxPrice == null ? null : Number(r.maxPrice),
                image: (Array.isArray(images) && images[0]) || r.symbol || null,
                inStock: Number(r.availableQuantity) > 0,
                visibleOnPeko: r.visibleOnPeko !== false && r.visibleOnPeko !== 0,
                isNew: r.pendingReview === true || r.pendingReview === 1,
                hiddenReason: r.hiddenReason,
                hiddenDetail: r.hiddenDetail,
                overridden,
                pekoCategory: overridden
                    ? pekoCategoryDto(cats, r.pekoCategoryOverrideId)
                    : (r.localCategory ? { id: null, name: r.localCategory, parentName: r.category } : null),
                listingPosition: r.listingPositionOverride || null,
            };
        }),
    };
};

// ─── Decisions ─────────────────────────────────────────────────────────────

exports.findSellerCategoryRow = async (id) => ondcSellerCategories.findByPk(id, { raw: true });

// listingPosition / hideKeywords are only written when given
exports.setSellerCategoryDecision = async (id, { status, pekoCategoryId, listingPosition, hideKeywords, actorName }) =>
    ondcSellerCategories.update(
        {
            status,
            pekoCategoryId: status === "mapped" ? pekoCategoryId : null,
            ...(listingPosition !== undefined && { listingPosition }),
            ...(hideKeywords !== undefined && { hideKeywords }),
            isNew: false,
            decidedAt: new Date(),
            decidedByName: actorName || null,
        },
        { where: { id } }
    );

/** Clears the "New" badge on `ids`, or on every seller category. @returns rows updated */
exports.markSellerCategoriesReviewed = async (ids) => {
    const where = { isNew: true };
    if (Array.isArray(ids) && ids.length) where.id = { [Op.in]: ids };
    const [n] = await ondcSellerCategories.update({ isNew: false }, { where, silent: true });
    return n;
};

// Showing or hiding a product is the admin's review of it, so it stops being new.
exports.setProductsVisibility = async ({ sellerCategoryId, productIds, visible }) => {
    const [n] = await ondcProducts.update(
        { visibleOnPeko: !!visible, pendingReview: false },
        { where: { sellerCategoryId, id: { [Op.in]: productIds } } }
    );
    return n;
};

/** Hide every product of the seller category except `productIds`, which are shown. */
exports.showOnlyProducts = async ({ sellerCategoryId, productIds }) => {
    const [shown] = await ondcProducts.update(
        { visibleOnPeko: true, pendingReview: false },
        { where: { sellerCategoryId, id: { [Op.in]: productIds } } }
    );
    const [hidden] = await ondcProducts.update(
        { visibleOnPeko: false, pendingReview: false },
        { where: { sellerCategoryId, id: { [Op.notIn]: productIds } } }
    );
    return { shown, hidden };
};

/** Show every new product of the seller category. @returns rows approved */
exports.approveNewProducts = async (sellerCategoryId) => {
    const [n] = await ondcProducts.update(
        { visibleOnPeko: true, pendingReview: false },
        { where: { sellerCategoryId, pendingReview: true } }
    );
    return n;
};

/**
 * First mapping of a seller category approves what is already in it — the
 * admin just decided where all of it goes. @returns rows cleared
 */
exports.clearNewProducts = async (sellerCategoryId) => {
    const [n] = await ondcProducts.update(
        { pendingReview: false },
        { where: { sellerCategoryId, pendingReview: true }, silent: true }
    );
    return n;
};

exports.findProduct = async (id) =>
    ondcProducts.findByPk(id, { attributes: ["id", "name", "sellerCategoryId", "pekoCategoryOverrideId"], raw: true });

// choosing a product's own Peko category reviews it too
exports.setProductOverride = async (id, pekoCategoryId) =>
    ondcProducts.update(
        { pekoCategoryOverrideId: pekoCategoryId, ...(pekoCategoryId != null && { pendingReview: false }) },
        { where: { id }, silent: true }
    );

exports.setProductListingPosition = async (id, listingPosition) =>
    ondcProducts.update({ listingPositionOverride: listingPosition }, { where: { id }, silent: true });

/**
 * Peko subcategories were deleted: seller categories mapped to them go back
 * to To review, and per-product choices of them are dropped.
 * @returns {Promise<{sellerCategoryIds: number[], productIds: number[]}>} what to recompute
 */
exports.detachPekoSubcategories = async (subIds) => {
    if (!subIds.length) return { sellerCategoryIds: [], productIds: [] };
    const [mapped, overridden] = await Promise.all([
        ondcSellerCategories.findAll({ attributes: ["id"], where: { pekoCategoryId: { [Op.in]: subIds } }, raw: true }),
        ondcProducts.findAll({ attributes: ["id"], where: { pekoCategoryOverrideId: { [Op.in]: subIds } }, raw: true }),
    ]);
    await ondcSellerCategories.update(
        { status: "unmapped", pekoCategoryId: null, isNew: true },
        { where: { pekoCategoryId: { [Op.in]: subIds } } }
    );
    await ondcProducts.update(
        { pekoCategoryOverrideId: null },
        { where: { pekoCategoryOverrideId: { [Op.in]: subIds } }, silent: true }
    );
    return {
        sellerCategoryIds: mapped.map((r) => Number(r.id)),
        productIds: overridden.map((r) => Number(r.id)),
    };
};

/** Seller categories currently mapped to any of `subIds`. */
exports.findSellerCategoryIdsMappedTo = async (subIds) => {
    if (!subIds.length) return [];
    const rows = await ondcSellerCategories.findAll({
        attributes: ["id"],
        where: { status: "mapped", pekoCategoryId: { [Op.in]: subIds } },
        raw: true,
    });
    return rows.map((r) => Number(r.id));
};

// ─── Rollout seed ──────────────────────────────────────────────────────────

/**
 * One-time, on an empty table: every (domain, categoryId) already stored
 * becomes an UNMAPPED seller category (To review, marked New) and its
 * products get their sellerCategoryId. Nothing is pre-mapped — every seller
 * category waits for an admin's decision, so existing products are hidden
 * until then.
 * @returns {Promise<{seeded: number}|null>} null when the table already had rows
 */
exports.seedSellerCategoriesFromProducts = async () => {
    await Promise.all([ondcSellerCategories.ready, ondcProducts.ready]);
    if (await ondcSellerCategories.count()) return null;

    // raw (domain, categoryId) pairs as stored — several can fold into one key
    const stored = await ondcProducts.findAll({
        attributes: ["ondcDomain", "categoryId"],
        group: ["ondcDomain", "categoryId"],
        raw: true,
    });
    const keyOf = (r) => `${toDomainCode(r.ondcDomain) || "UNKNOWN"}|${normalizeCategoryKey(r.categoryId)}`;
    const seeds = new Map();
    for (const r of stored) {
        const key = keyOf(r);
        if (seeds.has(key)) continue;
        const categoryKey = normalizeCategoryKey(r.categoryId);
        seeds.set(key, {
            ondcDomain: toDomainCode(r.ondcDomain) || "UNKNOWN",
            categoryKey,
            label: categoryKey === NONE_KEY ? "No category sent" : String(r.categoryId).trim().slice(0, 255),
        });
    }
    if (!seeds.size) return { seeded: 0 };

    const now = new Date();
    await ondcSellerCategories.bulkCreate(
        [...seeds.values()].map((e) => ({
            ...e,
            status: "unmapped",
            pekoCategoryId: null,
            isNew: true,
            firstSeenAt: now,
            lastSeenAt: now,
        })),
        { ignoreDuplicates: true }
    );

    // stamp products: one UPDATE per stored (domain, categoryId) pair
    const rows = await ondcSellerCategories.findAll({ attributes: ["id", "ondcDomain", "categoryKey"], raw: true });
    const idByKey = new Map(rows.map((r) => [`${r.ondcDomain}|${r.categoryKey}`, Number(r.id)]));
    for (const r of stored) {
        const id = idByKey.get(keyOf(r));
        if (!id) continue;
        await ondcProducts.update(
            { sellerCategoryId: id },
            {
                where: {
                    ondcDomain: r.ondcDomain == null ? null : r.ondcDomain,
                    categoryId: r.categoryId == null ? null : r.categoryId,
                },
                silent: true,
            }
        );
    }
    return { seeded: seeds.size };
};

exports.STATUSES = STATUSES;
exports.normalizeCategoryKey = normalizeCategoryKey;
exports.VISIBLE_SQL = VISIBLE_SQL;
