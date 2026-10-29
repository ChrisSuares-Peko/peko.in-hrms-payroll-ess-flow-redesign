const puppeteer = require("puppeteer");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const {
  findAllOndcProductsForAdmin,
  findOndcProductByIdAdmin,
  setOndcProductVisibility,
  findOndcProductFilterOptions,
  parseCityArray,
} = require("../../models/use-cases/ondc_product_with_transactionId");
const { scheduleCategoryCountRefresh } = require("../../services/ondcCategoryCountRefresher");
const { mapAdminProductAttributes } = require("../../utils/ondcProductAttributes");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const { DEFAULT_ONDC_CITIES } = require("../../utils/defaultOndcCities");
const { findAllOndcEasySplitSellers } = require("../../models/use-cases/ondc_seller");
const {
  findAllOndcSellerNps,
  setOndcSellerNpEnabled,
  findOndcSellerNpById,
} = require("../../models/use-cases/ondc_seller_np");
const { recomputeVisibility, SCOPES } = require("../../services/ondcProductVisibility");
const { deleteMatchedProducts, switchSellerNpProducts } = require("../../services/ondcCatalogRules");
const {
  findStoredBySellerNp,
  countProductsBySellerNp,
  createRuleLogSafely,
} = require("../../models/use-cases/ondc_catalog_rules");
const { findSellerCategoryRow } = require("../../models/use-cases/ondc_seller_category");

const CITY_NAME_BY_CODE = new Map(
  DEFAULT_ONDC_CITIES.map((c) => [String(c.code).toLowerCase(), c.name])
);
const cityName = (code) => CITY_NAME_BY_CODE.get(String(code || "").toLowerCase()) || code;
const stripDomain = (d) => (d ? String(d).replace(/^ONDC:/i, "") : "");
const firstImage = (row) => row.symbol || (parseImages(row.images)[0] || null);
// raw MySQL rows return BOOLEAN as 0/1; null (pre-migration rows) = visible.
const isVisibleOnPeko = (v) => v == null || (v !== false && Number(v) !== 0);

function parseImages(images) {
  if (Array.isArray(images)) return images;
  if (typeof images === "string" && images.trim()) {
    try {
      const p = JSON.parse(images);
      return Array.isArray(p) ? p : [images];
    } catch (e) {
      return [images];
    }
  }
  return [];
}

/** One list-row DTO for the admin catalog table. */
const toListDto = (row) => ({
  id: row.id,
  name: row.name,
  image: firstImage(row),
  vendorName: row.vendorName,
  category: row.category,
  localCategory: row.localCategory,
  domain: stripDomain(row.ondcDomain),
  price: row.price,
  maxPrice: row.maxPrice,
  availableQuantity: row.availableQuantity,
  inStock: Number(row.availableQuantity) > 0,
  cities: parseCityArray(row.city).map(cityName),
  visibleOnPeko: isVisibleOnPeko(row.visibleOnPeko),
  lastSyncedAt: row.updatedAt,
});

const parseListParams = (query) => {
  let { category, sellerName, bppId, domain, availability, city, visibility, searchText, page, itemsPerPage } = query;
  const sort = query.sort === "ASC" ? "ASC" : "DESC";
  const sortField = query.sortField || "updatedAt";
  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 10;
  return {
    category, sellerName, bppId, domain, availability, city, visibility, searchText,
    sort, sortField, offset: (page - 1) * itemsPerPage, limit: itemsPerPage,
  };
};

exports.findAllOndcProducts = asyncHandler(async (req, res) => {
  const result = await findAllOndcProductsForAdmin(parseListParams(req.query));
  const data = result.rows.map(toListDto);
  return res.status(200).json({
    status: true,
    data: { recordsTotal: result.recordsTotal, recordsFiltered: result.recordsTotal, data },
    message: "Products fetched successfully",
    responseCode: "000",
  });
});

/** Toolbar dropdown options: categories, sellers, seller NPs ({bppId,name}), cities ({code,name}). */
exports.getOndcProductFilters = asyncHandler(async (req, res) => {
  const { categories, sellers, sellerNps, cityCodes } = await findOndcProductFilterOptions();
  const cities = cityCodes.map((code) => ({ code, name: cityName(code) }));
  return res.status(200).json({
    status: true,
    data: { categories, sellers, sellerNps, cities },
    message: "Filters fetched successfully",
    responseCode: "000",
  });
});

exports.getOndcProductByIdAdmin = asyncHandler(async (req, res, next) => {
  const row = await findOndcProductByIdAdmin(req.params.id);
  if (!row) {
    return next(new ErrorResponse("Product not found", 404));
  }
  const sc = row.sellerCategoryId ? await findSellerCategoryRow(row.sellerCategoryId) : null;
  return res.status(200).json({
    status: true,
    data: {
      ...toListDto(row),
      listingPositionOverride: row.listingPositionOverride || null,
      sellerCategory: sc && { id: Number(sc.id), label: sc.label, listingPosition: sc.listingPosition || "useful" },
      images: parseImages(row.images),
      shortDesc: row.shortDesc,
      longDesc: row.longDesc,
      bppId: row.bppId,
      networkId: row.bppId || null,
      ondcVendorId: row.ondcVendorId,
      categoryId: row.categoryId,
      minQuantity: row.minQuantity,
      maxQuantity: row.maxQuantity,
      timeToShip: row.timeToShip,
      measureValue: row.measureValue,
      uom: row.uom,
      returnable: row.returnable,
      tags: row.tags,
      statutory: row.statutory,
      attributes: mapAdminProductAttributes(row),
    },
    message: "Product fetched successfully",
    responseCode: "000",
  });
});

exports.updateOndcProductVisibility = asyncHandler(async (req, res, next) => {
  const visible = req.body?.visible;
  if (typeof visible !== "boolean") {
    return next(new ErrorResponse("`visible` (boolean) is required", 422));
  }
  const result = await setOndcProductVisibility(req.params.id, visible);
  if (!result || !result[0]) {
    return next(new ErrorResponse("Product not found", 404));
  }
  // Hidden products are excluded from the stored category counts.
  scheduleCategoryCountRefresh();
  return res.status(200).json({
    status: true,
    data: { id: Number(req.params.id), visibleOnPeko: visible },
    message: "Product visibility updated",
    responseCode: "000",
  });
});

const EXPORT_MAX_ROWS = 10000;
// Chromium's print step stops scaling past a few thousand table rows (10,000
// never finished locally, which surfaced as Puppeteer's 30 s timeout) and every
// 1,000 rows adds ~9 MB of JSON once the buffer is serialised, so the PDF
// carries the first PDF_EXPORT_MAX_ROWS rows; Excel/CSV export the full list.
const PDF_EXPORT_MAX_ROWS = 1000;
const PDF_TIMEOUT_MS = 60000;

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** @returns {Promise<{ rows: object[], total: number }>} */
const fetchAllOndcProductsForExport = async (req, limit = EXPORT_MAX_ROWS) => {
  const params = { ...parseListParams(req.query), offset: 0, limit };
  const result = await findAllOndcProductsForAdmin(params);
  const rows = result.rows.map((row) => {
    const dto = toListDto(row);
    return {
      Product: dto.name,
      Seller: dto.vendorName,
      Category: [dto.category, dto.localCategory].filter(Boolean).join(" > "),
      Domain: dto.domain,
      Price: dto.price,
      Availability: dto.inStock ? "In stock" : "Out of stock",
      Cities: dto.cities.join(", "),
      "Visible on Peko": dto.visibleOnPeko ? "Yes" : "No",
    };
  });
  return { rows, total: Number(result.recordsTotal) || rows.length };
};

exports.ondcProductsExcelCSV = asyncHandler(async (req, res, next) => {
  const { type } = req.params;
  const { rows: data, total } = await fetchAllOndcProductsForExport(req);
  if (!data.length) {
    return next(new ErrorResponse(`No data is available for export`, 400));
  }
  const { buffer, fileType } = await generateExcelBufferAndType(data, type);
  return res.status(200).json({
    status: true,
    // exportedCount < totalCount means the file was cut at EXPORT_MAX_ROWS; the UI warns
    data: { buffer, fileType, exportedCount: data.length, totalCount: total },
    message: "Fetched excel/csv datas successfully",
    responseCode: "000",
  });
});

exports.ondcProductsPDF = asyncHandler(async (req, res, next) => {
  const { rows, total } = await fetchAllOndcProductsForExport(req, PDF_EXPORT_MAX_ROWS);
  if (!rows.length) {
    return next(new ErrorResponse(`No data is available for export`, 400));
  }
  // Product and seller names come from ONDC sellers — escape them so they
  // render as text instead of running as markup inside the headless browser.
  const data = rows.map((row) =>
    Object.fromEntries(Object.entries(row).map(([k, v]) => [k, escapeHtml(v)])));
  const subtitle = total > rows.length
    ? `Showing the first ${rows.length.toLocaleString("en-IN")} of ${total.toLocaleString("en-IN")} products. Use Excel or CSV to export the full list.`
    : undefined;
  const reportHtmlWithStyle = reportPdfTemplate(data, { title: "Products", subtitle });

  let buffer;
  let browser;
  try {
    browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.setContent(reportHtmlWithStyle, { waitUntil: "domcontentloaded", timeout: PDF_TIMEOUT_MS });
    const pdf = await page.pdf({ scale: 0.6, format: "A4", preferCSSPageSize: true, timeout: PDF_TIMEOUT_MS });
    // page.pdf resolves a Uint8Array; Buffer keeps the { type, data } JSON shape the UI reads
    buffer = Buffer.from(pdf);
  } catch (err) {
    console.error("ondcProductsPDF: PDF generation failed:", err?.message || err);
    return next(new ErrorResponse("Could not generate the PDF. Please try again, or use Excel or CSV.", 500));
  } finally {
    // a failed render must not leave a Chromium process behind
    if (browser) await browser.close().catch(() => {});
  }
  return res.status(200).json({
    status: true,
    message: "report generated successfully.",
    data: { buffer, fileType: "application/pdf", exportedCount: rows.length, totalCount: total },
    responseCode: "000",
  });
});

/**
 * Easy Split vendors registered for ONDC office supplies — pending settle totals
 * from held SPLIT orders (Products catalog → Vendors tab).
 */
exports.findAllOndcEasySplitSellersAdmin = asyncHandler(async (req, res) => {
  const searchText = req.query.searchText || req.query.search || "";
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const itemsPerPage = req.query.itemsPerPage ? parseInt(req.query.itemsPerPage, 10) : 10;
  const sort = req.query.sort === "ASC" ? "ASC" : "DESC";
  const sortField = req.query.sortField || "vendorSyncedAt";

  const result = await findAllOndcEasySplitSellers({
    searchText,
    page,
    itemsPerPage,
    sort,
    sortField,
  });

  return res.status(200).json({
    status: true,
    data: {
      recordsTotal: result.count,
      recordsFiltered: result.count,
      data: result.rows,
    },
    message: "Easy Split vendors fetched successfully",
    responseCode: "000",
  });
});

/**
 * Seller NPs recorded from on_search (Manage > Products > Seller NPs).
 * Enable/disable gates catalog ingest for that bpp_id.
 */
exports.findAllOndcSellerNpsAdmin = asyncHandler(async (req, res) => {
  const searchText = req.query.searchText || req.query.search || "";
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const itemsPerPage = req.query.itemsPerPage ? parseInt(req.query.itemsPerPage, 10) : 10;
  const sort = req.query.sort === "ASC" ? "ASC" : "DESC";
  const sortField = req.query.sortField || "lastSeenAt";

  const result = await findAllOndcSellerNps({
    searchText,
    page,
    itemsPerPage,
    sort,
    sortField,
  });
  const productCounts = await countProductsBySellerNp(result.rows.map((r) => r.bppId));

  return res.status(200).json({
    status: true,
    data: {
      recordsTotal: result.count,
      recordsFiltered: result.count,
      data: result.rows.map((r) => ({ ...r, productCount: productCounts.get(r.bppId) || 0 })),
    },
    message: "Seller NPs fetched successfully",
    responseCode: "000",
  });
});

const SELLER_NP_PRODUCT_ACTIONS = ["delete", "disable"];

const actorFrom = (req) => {
  const u = req.user || {};
  const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return {
    id: u.id != null ? String(u.id) : null,
    name: u.name || u.fullName || fullName || u.username || u.email || "Admin",
  };
};

const productsText = (n) => `${n} ${n === 1 ? "product" : "products"}`;

/**
 * Body: `{ enabled, productAction? }`. Disabling asks what happens to the NP's
 * stored products: `delete` removes them from the DB, `disable` (default)
 * switches them off (visibleOnPeko). Enabling switches them all back on.
 * Either way the `sellerNp` hide rule is recomputed for the NP.
 */
exports.updateOndcSellerNpEnabled = asyncHandler(async (req, res, next) => {
  const enabled = req.body?.enabled;
  if (typeof enabled !== "boolean") {
    return next(new ErrorResponse("`enabled` (boolean) is required", 422));
  }
  const productAction = req.body?.productAction ?? "disable";
  if (!SELLER_NP_PRODUCT_ACTIONS.includes(productAction)) {
    return next(new ErrorResponse("`productAction` must be delete or disable", 422));
  }
  const result = await setOndcSellerNpEnabled({ id: req.params.id, enabled });
  if (!result || !result[0]) {
    return next(new ErrorResponse("Seller NP not found", 404));
  }
  const sellerNp = await findOndcSellerNpById(req.params.id);
  const bppId = sellerNp?.bppId;

  let deletedCount = 0;
  let switchedOff = 0;
  let switchedOn = 0;
  if (bppId) {
    if (enabled) {
      switchedOn = await switchSellerNpProducts(bppId, true);
    } else if (productAction === "delete") {
      deletedCount = await deleteMatchedProducts(await findStoredBySellerNp(bppId));
    } else {
      switchedOff = await switchSellerNpProducts(bppId, false);
    }
    await recomputeVisibility(SCOPES.sellerNp(bppId));

    const name = sellerNp.npName || bppId;
    let action = `Enabled ${name} — switched on ${productsText(switchedOn)}`;
    if (!enabled) {
      action = productAction === "delete"
        ? `Disabled ${name} — deleted ${productsText(deletedCount)}`
        : `Disabled ${name} — switched off ${productsText(switchedOff)}`;
    }
    await createRuleLogSafely({
      section: "sellerNps",
      action,
      detail: { bppId, enabled, productAction: enabled ? null : productAction, deletedCount, switchedOff, switchedOn },
      actor: actorFrom(req),
    });
  }

  return res.status(200).json({
    status: true,
    data: {
      id: Number(req.params.id),
      enabled,
      productAction: enabled ? null : productAction,
      deletedCount,
      switchedOff,
      switchedOn,
    },
    message: "Seller NP updated",
    responseCode: "000",
  });
});
