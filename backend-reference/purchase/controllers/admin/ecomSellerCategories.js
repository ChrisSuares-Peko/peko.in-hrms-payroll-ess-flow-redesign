const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const sellerCategories = require("../../models/use-cases/ondc_seller_category");
const { createRuleLogSafely, listRuleLogs } = require("../../models/use-cases/ondc_catalog_rules");
const { recomputeVisibility, SCOPES, LISTING_POSITIONS } = require("../../services/ondcProductVisibility");
const { normalizeKeyword } = require("../../utils/ondcKeywordMatch");

/**
 * Manage > Products > Review: seller categories (the category a seller sends
 * on each item) and the admin's decision for each — show under a Peko
 * subcategory, exclude, or leave undecided — plus per-product overrides and
 * visibility. Every change is logged against the seller category so its page
 * can show its history.
 */

const TARGET = "sellerCategory";
const MAX_BULK = 500;

const ok = (res, data, message) => res.status(200).json({ status: true, data, message, responseCode: "000" });

const actorFrom = (req) => {
    const u = req.user || {};
    const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ");
    return {
        id: u.id != null ? String(u.id) : null,
        name: u.name || u.fullName || fullName || u.username || u.email || "Admin",
    };
};

const parseId = (value) => {
    const id = parseInt(value, 10);
    if (!Number.isFinite(id) || id <= 0) throw new ErrorResponse("Invalid id", 422);
    return id;
};

const parseIdList = (value, field) => {
    if (!Array.isArray(value) || !value.length) throw new ErrorResponse(`\`${field}\` (non-empty array of ids) is required`, 422);
    if (value.length > MAX_BULK) throw new ErrorResponse(`At most ${MAX_BULK} ids per request`, 422);
    const ids = [...new Set(value.map((v) => parseInt(v, 10)))];
    if (ids.some((id) => !Number.isFinite(id) || id <= 0)) throw new ErrorResponse(`\`${field}\` must contain ids`, 422);
    return ids;
};

/** A Peko SUBcategory id that exists (products sit under subcategories). */
const resolveSubcategory = async (rawId) => {
    const id = parseInt(rawId, 10);
    if (!Number.isFinite(id) || id <= 0) throw new ErrorResponse("`pekoCategoryId` must be a subcategory id", 422);
    const cats = await sellerCategories.loadPekoCategories();
    const cat = cats.get(id);
    if (!cat) throw new ErrorResponse("Peko category not found", 404);
    if (cat.parentId == null) throw new ErrorResponse("Choose a subcategory, not a top-level category", 422);
    return cat;
};

const loadSellerCategory = async (id) => {
    const row = await sellerCategories.findSellerCategoryRow(id);
    if (!row) throw new ErrorResponse("Seller category not found", 404);
    return row;
};

const log = (req, sellerCategoryId, action, detail = null) =>
    createRuleLogSafely({ section: "review", action, detail, actor: actorFrom(req), targetType: TARGET, targetId: sellerCategoryId });

// ─── List / detail ─────────────────────────────────────────────────────────

exports.getSellerCategories = asyncHandler(async (req, res, next) => {
    const status = req.query.status || "unmapped";
    if (status !== "all" && !sellerCategories.STATUSES.includes(status)) {
        return next(new ErrorResponse("`status` must be unmapped, mapped, excluded or all", 422));
    }
    const { rows, count, counts } = await sellerCategories.listSellerCategories({
        status,
        search: req.query.search || req.query.searchText,
        page: req.query.page,
        itemsPerPage: req.query.itemsPerPage,
        sortField: req.query.sortField,
        sort: req.query.sort,
    });
    return ok(res, { recordsTotal: count, recordsFiltered: count, data: rows, counts }, "Seller categories fetched");
});

exports.getSellerCategory = asyncHandler(async (req, res, next) => {
    const row = await sellerCategories.getSellerCategory(parseId(req.params.id));
    if (!row) return next(new ErrorResponse("Seller category not found", 404));
    return ok(res, row, "Seller category fetched");
});

exports.getSellerCategoryProducts = asyncHandler(async (req, res, next) => {
    const id = parseId(req.params.id);
    const visibility = req.query.visibility || "all";
    if (!["all", "visible", "hidden", "new"].includes(visibility)) {
        return next(new ErrorResponse("`visibility` must be all, visible, hidden or new", 422));
    }
    await loadSellerCategory(id);
    const { rows, count } = await sellerCategories.listSellerCategoryProducts(id, {
        visibility,
        search: req.query.search || req.query.searchText,
        page: req.query.page,
        itemsPerPage: req.query.itemsPerPage,
    });
    return ok(res, { recordsTotal: count, recordsFiltered: count, data: rows }, "Products fetched");
});

exports.getSellerCategoryHistory = asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const { rows, count } = await listRuleLogs({
        targetType: TARGET,
        targetId: id,
        page: req.query.page,
        itemsPerPage: req.query.itemsPerPage || 50,
    });
    return ok(res, { recordsTotal: count, data: rows }, "History fetched");
});

// ─── Decisions ─────────────────────────────────────────────────────────────

const DECISION_ACTIONS = {
    mapped: (cat) => `Shown under ${cat.parentName} › ${cat.name}`,
    excluded: () => "Excluded from listing",
    unmapped: () => "Left undecided",
};

/**
 * Body: `{ status: mapped|excluded|unmapped, pekoCategoryId?, listingPosition?, hideKeywords? }`
 * (subcategory, required for mapped). Position / words left out stay as they are.
 */
exports.decideSellerCategory = asyncHandler(async (req, res, next) => {
    const id = parseId(req.params.id);
    const status = req.body?.status;
    if (!sellerCategories.STATUSES.includes(status)) {
        return next(new ErrorResponse("`status` must be mapped, excluded or unmapped", 422));
    }
    const { listingPosition, hideKeywords } = req.body;
    if (listingPosition !== undefined && !LISTING_POSITIONS.includes(listingPosition)) {
        return next(new ErrorResponse(`\`listingPosition\` must be ${LISTING_POSITIONS.join(", ")}`, 422));
    }
    if (hideKeywords !== undefined && !Array.isArray(hideKeywords)) {
        return next(new ErrorResponse("`hideKeywords` must be an array of words", 422));
    }
    const before = await loadSellerCategory(id);
    const cat = status === "mapped" ? await resolveSubcategory(req.body?.pekoCategoryId) : null;

    const actor = actorFrom(req);
    await sellerCategories.setSellerCategoryDecision(id, {
        status,
        pekoCategoryId: cat ? cat.id : null,
        listingPosition,
        hideKeywords: hideKeywords && [...new Set(hideKeywords.map(normalizeKeyword).filter(Boolean))].join(","),
        actorName: actor.name,
    });
    if (status === "mapped" && before.status !== "mapped") await sellerCategories.clearNewProducts(id);
    const changed = await recomputeVisibility(SCOPES.sellerCategory(id));
    await log(req, id, DECISION_ACTIONS[status](cat), {
        before: { status: before.status, pekoCategoryId: before.pekoCategoryId },
        after: { status, pekoCategoryId: cat ? cat.id : null, listingPosition, hideKeywords },
        productsChanged: changed,
    });
    return ok(res, await sellerCategories.getSellerCategory(id), "Decision saved");
});

/** Body: `{ ids? }` — clear the "New" badge on these, or on every seller category. */
exports.markSellerCategoriesReviewed = asyncHandler(async (req, res) => {
    const ids = req.body?.ids === undefined ? undefined : parseIdList(req.body.ids, "ids");
    const updated = await sellerCategories.markSellerCategoriesReviewed(ids);
    return ok(res, { updated }, "Marked as reviewed");
});

// ─── Products ──────────────────────────────────────────────────────────────

/**
 * Body: `{ mode: hide|show|only|approveNew, productIds }` — the admin switch
 * (visibleOnPeko) for products of this seller category. `only` shows the
 * selected ones and hides the rest of the category; `approveNew` shows every
 * new product (no productIds). Each one also marks the products reviewed.
 */
exports.setSellerCategoryProductsVisibility = asyncHandler(async (req, res, next) => {
    const id = parseId(req.params.id);
    const mode = req.body?.mode;
    if (!["hide", "show", "only", "approveNew"].includes(mode)) {
        return next(new ErrorResponse("`mode` must be hide, show, only or approveNew", 422));
    }
    const productIds = mode === "approveNew" ? [] : parseIdList(req.body?.productIds, "productIds");
    await loadSellerCategory(id);

    let result;
    let action;
    if (mode === "approveNew") {
        const n = await sellerCategories.approveNewProducts(id);
        result = { shown: n, hidden: 0 };
        action = `Approved ${n} new ${n === 1 ? "product" : "products"}`;
    } else if (mode === "only") {
        result = await sellerCategories.showOnlyProducts({ sellerCategoryId: id, productIds });
        action = `Showed only ${productIds.length} selected ${productIds.length === 1 ? "product" : "products"}`;
    } else {
        const n = await sellerCategories.setProductsVisibility({ sellerCategoryId: id, productIds, visible: mode === "show" });
        result = mode === "show" ? { shown: n, hidden: 0 } : { shown: 0, hidden: n };
        action = `${mode === "show" ? "Showed" : "Hid"} ${n} ${n === 1 ? "product" : "products"}`;
    }
    // reviewed products drop their `pending` hide
    await recomputeVisibility(
        mode === "show" || mode === "hide"
            ? { [Op.and]: [SCOPES.sellerCategory(id), SCOPES.products(productIds)] }
            : SCOPES.sellerCategory(id)
    );
    await log(req, id, action, { mode, productIds, ...result });
    return ok(res, result, "Products updated");
});

/** Body: `{ pekoCategoryId }` (a subcategory), or `null` to follow the seller category's mapping. */
exports.setProductPekoCategory = asyncHandler(async (req, res, next) => {
    const productId = parseId(req.params.id);
    if (!req.body || !("pekoCategoryId" in req.body)) {
        return next(new ErrorResponse("`pekoCategoryId` (subcategory id or null) is required", 422));
    }
    const product = await sellerCategories.findProduct(productId);
    if (!product) return next(new ErrorResponse("Product not found", 404));
    const cat = req.body.pekoCategoryId === null ? null : await resolveSubcategory(req.body.pekoCategoryId);

    await sellerCategories.setProductOverride(productId, cat ? cat.id : null);
    await recomputeVisibility(SCOPES.products([productId]));
    if (product.sellerCategoryId != null) {
        await log(
            req,
            Number(product.sellerCategoryId),
            cat ? `"${product.name}" moved to ${cat.parentName} › ${cat.name}` : `"${product.name}" follows the mapping again`,
            { productId, before: product.pekoCategoryOverrideId, after: cat ? cat.id : null }
        );
    }
    return ok(res, { id: productId, pekoCategoryId: cat ? cat.id : null }, "Product category updated");
});

/** Body: `{ listingPosition }` (core|useful|accessory|low), or `null` to follow the seller category. */
exports.setProductListingPosition = asyncHandler(async (req, res, next) => {
    const productId = parseId(req.params.id);
    const listingPosition = req.body?.listingPosition;
    if (listingPosition !== null && !LISTING_POSITIONS.includes(listingPosition)) {
        return next(new ErrorResponse(`\`listingPosition\` must be ${LISTING_POSITIONS.join(", ")} or null`, 422));
    }
    const product = await sellerCategories.findProduct(productId);
    if (!product) return next(new ErrorResponse("Product not found", 404));

    await sellerCategories.setProductListingPosition(productId, listingPosition);
    await recomputeVisibility(SCOPES.products([productId]));
    if (product.sellerCategoryId != null) {
        await log(req, Number(product.sellerCategoryId), `"${product.name}" listed as ${listingPosition || "its seller category"}`, { productId, listingPosition });
    }
    return ok(res, { id: productId, listingPosition }, "Product position updated");
});
