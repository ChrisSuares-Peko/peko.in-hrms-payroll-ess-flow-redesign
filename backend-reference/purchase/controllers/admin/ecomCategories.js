const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const {
  listAsTree,
  createCategory,
  createSubcategory,
  updateCategory,
  deleteCategory,
  setCategoryEnabled,
  listOndcCategoryOptions,
  sanitizeKeywords,
  findSiblingWithName,
  withCategoryWriteLock,
} = require("../../models/use-cases/ondc_category");
const {
  validateCategoryName,
  validateOndcDomain,
  validateDisplayOrder,
} = require("../../utils/ondcCategoryInput");
const { scheduleCategoryCountRefresh } = require("../../services/ondcCategoryCountRefresher");
const { recomputeVisibility, SCOPES } = require("../../services/ondcProductVisibility");
const {
  detachPekoSubcategories,
  findSellerCategoryIdsMappedTo,
} = require("../../models/use-cases/ondc_seller_category");
const { uploadFile } = require("../../utils/commonUploadFile");
const { validateBase64Image } = require("../../utils/imageValidation");
const officeSupplyCategories = require("../../models/entities/ondc_category");

/** Categories tab: full tree (top-level categories + nested subcategories, each with a stored product-count snapshot). */
exports.getOndcCategoriesTree = asyncHandler(async (req, res, next) => {
  customLog(req?.LogTraceId, "info", {
    message: "ONDC categories tree requested",
    credentialId: req?.user?.id,
  });
  try {
    const data = await listAsTree();
    customLog(req?.LogTraceId, "info", {
      message: "ONDC categories tree fetched",
      parentCount: Array.isArray(data) ? data.length : 0,
      subcategoryCount: Array.isArray(data)
        ? data.reduce((n, p) => n + (p.subcategories?.length || 0), 0)
        : 0,
    });
    return res.status(200).json({
      status: true,
      data,
      message: "Categories fetched successfully",
      responseCode: "000",
    });
  } catch (err) {
    customLog(req?.LogTraceId, "error", {
      message: "ONDC categories tree failed",
      error: err?.message || err,
      sql: err?.parent?.sql || err?.sql,
      stack: err?.stack,
    });
    return next(new ErrorResponse(err?.message || "Failed to fetch categories", 500));
  }
});

/**
 * Legacy options endpoint — kept for compatibility; UI no longer consumes it.
 * Returns distinct subcategory names + domains from the DB.
 */
exports.getOndcCategoryOptions = asyncHandler(async (req, res) => {
  const data = await listOndcCategoryOptions();
  return res.status(200).json({
    status: true,
    data,
    message: "Options fetched successfully",
    responseCode: "000",
  });
});

/** The subcategory ids a category row stands for: itself, or a parent's children. */
const subcategoryIdsOf = async (row) => {
  if (row.parentId != null) return [Number(row.id)];
  const children = await officeSupplyCategories.findAll({ attributes: ["id"], where: { parentId: row.id }, raw: true });
  return children.map((c) => Number(c.id));
};

/**
 * Products carry their Peko category as names plus a hidden reason when it is
 * switched off, so a rename or enable toggle re-stamps the products under it.
 */
const restampProductsUnder = async (subIds) => {
  if (!subIds.length) return;
  const sellerCategoryIds = await findSellerCategoryIdsMappedTo(subIds);
  await recomputeVisibility(SCOPES.pekoSubcategories(subIds, sellerCategoryIds));
};

const isHttpUrl = (value) => /^https?:\/\//i.test(String(value || ""));

/**
 * Upload a new icon or keep an existing CDN URL on edit. New icons must be a
 * PNG/JPEG of at most 2 MB; the stored extension comes from the file's bytes.
 */
const resolveIconUrl = async ({ iconUrl, iconFormat, existingIconUrl }) => {
  const raw = iconUrl != null ? String(iconUrl).trim() : "";
  if (raw && iconFormat) {
    const { base64, ext } = validateBase64Image({
      base64: raw,
      format: iconFormat,
      maxKB: 2048,
      label: "Category icon",
    });
    return uploadFile(base64, "office-supply-category", ext);
  }
  if (raw && isHttpUrl(raw)) {
    // only the icon already on file may be passed back as a URL (edit without a new upload)
    if (raw === existingIconUrl) return raw;
    throw new ErrorResponse("Category icon must be uploaded as a PNG or JPEG image", 422);
  }
  return existingIconUrl || null;
};

const requireParentIcon = async ({ iconUrl, iconFormat, existingIconUrl, next }) => {
  const resolved = await resolveIconUrl({ iconUrl, iconFormat, existingIconUrl });
  if (!resolved) {
    next(new ErrorResponse("`iconUrl` is required for categories", 422));
    return null;
  }
  return resolved;
};

/**
 * Shared name / domain / display-order checks for create and update, plus the
 * sibling-duplicate check. Returns the cleaned values, or `{ error }`.
 */
const validateCategoryFields = async ({ name, ondcDomain, displayOrder, isSubcategory, parentId, excludeId }) => {
  const nameCheck = validateCategoryName(name);
  if (nameCheck.error) return nameCheck;
  const orderCheck = validateDisplayOrder(displayOrder);
  if (orderCheck.error) return orderCheck;
  let domain = null;
  if (isSubcategory) {
    const domainCheck = validateOndcDomain(ondcDomain);
    if (domainCheck.error) return domainCheck;
    domain = domainCheck.value;
  }
  const duplicate = await findSiblingWithName({ name: nameCheck.value, parentId, excludeId });
  if (duplicate) {
    return {
      error: isSubcategory
        ? `A subcategory named "${duplicate.name}" already exists in this category`
        : `A category named "${duplicate.name}" already exists`,
    };
  }
  return { name: nameCheck.value, ondcDomain: domain, displayOrder: orderCheck.value };
};

/** Add category (no parentId) or add subcategory (parentId given). */
// Duplicate check → (icon upload) → write runs under the category write lock so
// a double-clicked Submit or two admins cannot both pass the check and insert.
exports.createOndcCategory = asyncHandler((req, res, next) =>
  withCategoryWriteLock(() => createOndcCategoryLocked(req, res, next)));

const createOndcCategoryLocked = async (req, res, next) => {
  const { name, ondcDomain, ondcCategory, keywords, displayOrder, parentId, iconUrl, iconFormat } = req.body || {};
  const fields = await validateCategoryFields({
    name,
    ondcDomain,
    displayOrder,
    isSubcategory: !!parentId,
    parentId: parentId || null,
  });
  if (fields.error) {
    return next(new ErrorResponse(fields.error, 422));
  }
  if (parentId) {
    // keywords are optional legacy data — seller categories are mapped on Products > Review
    const mapped = sanitizeKeywords(keywords) || sanitizeKeywords(ondcCategory);
    try {
      const row = await createSubcategory({
        parentId,
        name: fields.name,
        ondcDomain: fields.ondcDomain,
        keywords: mapped,
        displayOrder: fields.displayOrder,
      });
      scheduleCategoryCountRefresh();
      return res.status(200).json({
        status: true,
        data: row,
        message: "Category created successfully",
        responseCode: "000",
      });
    } catch (e) {
      return next(new ErrorResponse(e.message, 422));
    }
  }

  try {
    const resolvedIconUrl = await requireParentIcon({ iconUrl, iconFormat, existingIconUrl: null, next });
    if (!resolvedIconUrl) return;

    const row = await createCategory({
      name: fields.name,
      displayOrder: fields.displayOrder,
      iconUrl: resolvedIconUrl,
    });
    return res.status(200).json({
      status: true,
      data: row,
      message: "Category created successfully",
      responseCode: "000",
    });
  } catch (e) {
    return next(new ErrorResponse(e.message, 422));
  }
};

exports.updateOndcCategory = asyncHandler(async (req, res, next) => {
  // Only the check-and-write is locked; re-stamping products after a rename can
  // touch thousands of rows and must not hold up other category saves.
  const updated = await withCategoryWriteLock(() => updateOndcCategoryLocked(req, next));
  if (!updated) return;
  // Products carry the names — re-stamp them so a rename follows through.
  await restampProductsUnder(await subcategoryIdsOf(updated.existing));
  scheduleCategoryCountRefresh();
  return res.status(200).json({
    status: true,
    data: { id: Number(req.params.id) },
    message: "Category updated successfully",
    responseCode: "000",
  });
});

/** @returns {Promise<{existing: object}|undefined>} undefined once `next` has been called with an error */
const updateOndcCategoryLocked = async (req, next) => {
  const { name, ondcDomain, ondcCategory, keywords, displayOrder, iconUrl, iconFormat } = req.body || {};

  const existing = await officeSupplyCategories.findOne({
    where: { id: req.params.id },
    raw: true,
  });
  if (!existing) {
    return next(new ErrorResponse("Category not found", 404));
  }

  const isSubcategory = existing.parentId != null;
  const fields = await validateCategoryFields({
    name,
    ondcDomain,
    // an edit that leaves displayOrder out keeps the current one rather than resetting to 0
    displayOrder: displayOrder === undefined ? existing.displayOrder : displayOrder,
    isSubcategory,
    parentId: existing.parentId,
    excludeId: existing.id,
  });
  if (fields.error) {
    return next(new ErrorResponse(fields.error, 422));
  }
  // keywords are optional legacy data; only overwritten when the request sends them
  let mappedKeywords;
  if (isSubcategory && (keywords !== undefined || ondcCategory !== undefined)) {
    mappedKeywords = sanitizeKeywords(keywords) || sanitizeKeywords(ondcCategory);
  }

  let resolvedIconUrl = null;
  if (!isSubcategory) {
    resolvedIconUrl = await requireParentIcon({
      iconUrl,
      iconFormat,
      existingIconUrl: existing.iconUrl,
      next,
    });
    if (!resolvedIconUrl) return;
  }

  const result = await updateCategory({
    id: req.params.id,
    name: fields.name,
    ondcDomain: isSubcategory ? fields.ondcDomain : null,
    keywords: isSubcategory ? mappedKeywords : null,
    displayOrder: fields.displayOrder,
    iconUrl: isSubcategory ? null : resolvedIconUrl,
  });
  if (!result || !result[0]) {
    return next(new ErrorResponse("Category not found", 404));
  }
  return { existing };
};

/** Hard delete. Deleting a top-level category takes its subcategories with it. */
exports.deleteOndcCategory = asyncHandler(async (req, res, next) => {
  const existing = await officeSupplyCategories.findOne({ where: { id: req.params.id }, raw: true });
  const subIds = existing ? await subcategoryIdsOf(existing) : [];
  const result = await deleteCategory({ id: req.params.id });
  if (!result) {
    return next(new ErrorResponse("Category not found", 404));
  }
  // Seller categories mapped here go back to To review; their products hide.
  const detached = await detachPekoSubcategories(subIds);
  if (detached.sellerCategoryIds.length || detached.productIds.length) {
    await recomputeVisibility({
      [Op.or]: [
        ...(detached.sellerCategoryIds.length ? [{ sellerCategoryId: { [Op.in]: detached.sellerCategoryIds } }] : []),
        ...(detached.productIds.length ? [{ id: { [Op.in]: detached.productIds } }] : []),
      ],
    });
  }
  customLog(req?.LogTraceId, "info", {
    message: "ONDC category deleted",
    credentialId: req?.user?.id,
    ...result,
  });
  scheduleCategoryCountRefresh();
  return res.status(200).json({
    status: true,
    data: result,
    message: "Category deleted successfully",
    responseCode: "000",
  });
});

exports.updateOndcCategoryEnabled = asyncHandler(async (req, res, next) => {
  const enabled = req.body?.enabled;
  if (typeof enabled !== "boolean") {
    return next(new ErrorResponse("`enabled` (boolean) is required", 422));
  }
  const result = await setCategoryEnabled({ id: req.params.id, enabled });
  if (!result || !result[0]) {
    return next(new ErrorResponse("Category not found", 404));
  }
  const row = await officeSupplyCategories.findOne({ where: { id: req.params.id }, raw: true });
  if (row) await restampProductsUnder(await subcategoryIdsOf(row));
  return res.status(200).json({
    status: true,
    data: { id: Number(req.params.id), enabled },
    message: "Category visibility updated",
    responseCode: "000",
  });
});
