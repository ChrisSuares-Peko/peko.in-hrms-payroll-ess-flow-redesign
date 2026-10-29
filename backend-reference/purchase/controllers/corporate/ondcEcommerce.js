const { v4: uuidv4 } = require("uuid");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { default: axios } = require("axios");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const {
  findAllOfficeSupplyProductsAndCount,
  findOndcProductDetail,
  findOndcProductById,
  findOndcProductForCartItem,
  isOndcProductListed,
  findTopDealsByCity,
  findFrequentlyBoughtByCity,
  findSellersByCity,
  parseCityArray,
  deleteOfficeSupplyProductsByTransactionIds,
} = require("../../models/use-cases/ondc_product_with_transactionId");
const {
  addOndcProductInCart,
  getOndcProductsInMyCart,
  updateOndcProductInCart,
  deleteOndcProductInCart,
  clearUnavailableOndcProductsInCart,
  healOndcCartProductIds,
  removeOndcProductsFromCart,
} = require("../../models/use-cases/cart");
const { isDefaultOndcCity } = require("../../utils/defaultOndcCities");
const { resolveIndianPincode } = require("../../utils/indianPincodeLookup");
const { findServiceOperatorByAccessKey, fetchServiceDetails, calculateSurchargeWithTax } = require("../../utils/checkAndFetchServiceDetails");
const { getDistinctOndcDomains, listEnabledTreeForStorefront } = require("../../models/use-cases/ondc_category");
const ondc = require("../../services/ondc");
const { uploadFile } = require("../../utils/commonUploadFile");
const { waitForProducts, cancelWait } = require("../../services/ondcSearchWaiter");
const { runOndcCityCatalogSearch } = require("../../services/ondcCityCatalogSearch");
const { waitForOnSelect, cancelSelectWait } = require("../../services/ondcSelectWaiter");
const { waitForOnInit, cancelInitWait } = require("../../services/ondcInitWaiter");
const { waitForOnConfirm, cancelConfirmWait } = require("../../services/ondcConfirmWaiter");
const { waitForOnStatus, cancelStatusWait } = require("../../services/ondcStatusWaiter");
const { waitForOnTrack, cancelTrackWait } = require("../../services/ondcTrackWaiter");
const { waitForOnCancel, describeCancelOutcome } = require("../../services/ondcCancelWaiter");
const { waitForOnUpdate } = require("../../services/ondcUpdateWaiter");
const { waitForOnIssue, cancelIssueWait } = require("../../services/ondcIssueWaiter");
const { saveInitSession, getInitSession, clearInitSession } = require("../../services/ondcOrderSession");
const { createOndcOrder, findAllOndcOrdersAndCount, findOneOndcOrderById, updateOndcOrderCancellation, updateOndcOrderPaymentTotals, findOndcOrdersByPaymentRef, findOndcOrdersByTransactionIds, findOrphanOndcOrdersByPaymentRef, healOndcOrderBuyer, updateOndcOrderReturnLifecycle } = require("../../models/use-cases/ondc_order");
// const { findByName } = require("../../models/use-cases/setting");
const { createOndcIssue, findOndcIssuesForOrder, findOneOndcIssueById, deleteOndcIssue, updateOndcIssueFromCallback } = require("../../models/use-cases/ondc_issue");
const { recordOndcIssueEvent, findEventsByIssueId } = require("../../models/use-cases/ondc_issue_event");
const { createUserSearch } = require("../../models/use-cases/user_search_ondc");
const { findOne: findCorporateUser } = require("../../models/use-cases/corporateUser");
const { createEcommerceAddress, findAllEcommerceAddresses, findEcommerceAddressByFields } = require("../../models/use-cases/ecommerceAddressDetails");
const emailer = require("../../utils/emailer");
const { ondcOrderFailedTemplate } = require("../../utils/emailTemplate/ecommerce");
const { buildOrderConfirmedMail } = require("../../services/ondcCheckoutNotify");
const { partnerLogos } = require("../../utils/partnerLogos");
const { findOneOrder } = require("../../models/use-cases/order");
const paymentGatewayOrders = require("../../models/entities/paymentGatewayOrders");
const { findCheckoutConfirmSummary } = require("../../models/use-cases/ondc_checkout_confirm");
const { buildCheckoutResultFromAttempts, ownsCheckout } = require("../../utils/ondcCheckoutResult");
const { cancelPGTransaction } = require("../../utils/pgRefund");
const { publishJournalEvent } = require("../../utils/bull/queue/accountingEventsQueue");
const { assertOndcOrderCancellable } = require("../../utils/ondcCancelEligibility");
const { assertOndcOrderReturnable } = require("../../utils/ondcReturnEligibility");
const { getInvoiceUrl } = require("../../utils/ondcDocuments");
const { appendStatusHistory, dedupeStatusHistory } = require("../../utils/ondcStatusHistory");
const { resolveReturnReason, RETURN_REASONS } = require("../../utils/ondcReturnReasons");
const { refundOndcOrderAfterCancel } = require("../../services/ondcOrderRefund");
const {
  sendOndcOrderCancelledEmail,
  sendOndcReturnInitiatedEmail,
} = require("../../services/ondcRefundCancelNotify");
const { applyOndcReturnOnUpdate } = require("../../services/ondcReturnLifecycle");
const igm2 = require("../../services/ondcIgm2");
const { getEasySplitSettings } = require("../../utils/easySplit");
const {
  upsertOndcSeller,
} = require("../../models/use-cases/ondc_seller");
const { buildSellerRecord } = require("../../utils/ondcSeller");
const {
  parseIsoDurationMs,
  parseOndcAmount,
  resolveBuyerPayment,
  stampBuyerFinderFee,
  sumQuoteItemsTotal,
  assignGroupTransactionIds,
  scopeCartItems,
  normalizeOndcGps,
  indianPincode,
  pickDefaultAddressPincode,
} = require("../../utils/ondc_helper");
const { ondcQuantityBounds } = require("../../utils/ondcQuantityBounds");
const {
  registerCheckout,
  finalizeEasySplit,
} = require("../../services/ondcEasySplitAfterConfirm");

const SEARCH_TIMEOUT_MS = 30000;
// ServiceOperator row holding the Google Places credentials (apiUrl + api key).
const GOOGLE_ACCESS_KEY = "google_service";

const asTransactionIds = (value) => {
  if (Array.isArray(value)) return value.map((id) => String(id || "").trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((id) => id.trim()).filter(Boolean);
  }
  return [];
};

/**
 * Kick a shared city catalog /search without delaying the listing response.
 * `runOndcCityCatalogSearch` fires catalog_full per domain that is empty or
 * whose last full search is older than 12 hours.
 */
const startOndcCityCatalogSearch = (city, logTraceId) => {
  if (!city || city === "undefined") return;
  runOndcCityCatalogSearch({ city, logTraceId }).catch((error) => {
    customLog(logTraceId, "error", {
      message: "ONDC city catalog search from listing failed",
      city,
      error: error?.message || error,
    });
  });
};

/**
 * List ONDC products for a corporate user, scoped to a city. Deduped to the
 * newest row per product by the use-case. Supports `city`, `search`,
 * `localCategory`, `offset` and `limit` query params.
 */
exports.findAllOndcOfficeSupplies = asyncHandler(async (req, res, next) => {
  const city = req.query.city;
  const search = req.query.search;
  const localCategory = req.query.localCategory;
  const categoryId = req.query.categoryId;
  const priceMax = req.query.priceMax;
  const minDiscount = req.query.minDiscount;
  const sellers = req.query.sellers;
  // relevance (default) | price_asc | price_desc | discount | newest
  const sort = req.query.sort;
  // Optional. Storefront listing is city-scoped and does not send this.
  // Admin/debug callers may still narrow to specific search transaction ids.
  const transactionId = req.query.transactionId;
  const offset = parseInt(req.query.offset) || 0;
  const limit = Math.min(parseInt(req.query.limit) || 8, 100); // the UI page-size picker tops out at 100

  customLog(req?.LogTraceId, "info", {
    message: "ONDC product list requested",
    credentialId: req?.user?.id,
    query: { city, search, localCategory, categoryId, priceMax, minDiscount, sellers, sort, transactionId, offset, limit },
  });

  // Debug/admin scoped lists must not fan out a city-wide gateway search.
  if (!transactionId) startOndcCityCatalogSearch(city, req?.LogTraceId);

  try {
    const productsData = await findAllOfficeSupplyProductsAndCount({
      city,
      search,
      localCategory,
      categoryId,
      priceMax,
      minDiscount,
      sellers,
      sort,
      transactionId,
      offset,
      limit,
    });

    if (!productsData) {
      customLog(req?.LogTraceId, "error", {
        message: "ONDC product list: use-case returned no result object",
        query: { city, search, localCategory, offset, limit },
      });
      return next(
        new ErrorResponse(`Something went wrong while fetching ONDC products`, 500)
      );
    }

    customLog(req?.LogTraceId, "info", {
      message: "ONDC product list fetched",
      city,
      count: productsData.count,
      returned: Array.isArray(productsData.rows) ? productsData.rows.length : 0,
    });

    return res.status(200).json({
      status: true,
      message: "Successfully retrieved ONDC product data",
      data: productsData,
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ONDC product list failed",
      query: { city, search, localCategory, offset, limit },
      error: error?.message || error,
      sql: error?.parent?.sql || error?.sql,
      stack: error?.stack,
    });
    return next(error);
  }
});

/**
 * Combined storefront endpoint: returns the curated landing sections for a city
 * in a single response. `topRated` is unused (always []). `frequentlyBought` is
 * a stub ([]) until order-items data exists. `allProducts` is the first page
 * of the full deduped listing.
 */
exports.getOfficeSupplySections = asyncHandler(async (req, res, next) => {
  const city = req.query.city;
  const search = req.query.search;
  const localCategory = req.query.localCategory;
  const sectionLimit = parseInt(req.query.limit) || 12;
  const offset = parseInt(req.query.offset) || 0;

  customLog(req?.LogTraceId, "info", {
    message: "ONDC office-supply sections requested",
    credentialId: req?.user?.id,
    query: { city, search, localCategory, sectionLimit, offset },
  });

  if (!city) {
    return next(new ErrorResponse("city is required", 400));
  }

  startOndcCityCatalogSearch(city, req?.LogTraceId);

  // Curated sections are only maintained for the scheduler's default cities;
  // any other city gets an empty Top Deals (the FE hides empty sections).
  const curatedCity = isDefaultOndcCity(city);

  try {
    const [topDeals, frequentlyBought, allProducts] = await Promise.all([
      curatedCity ? findTopDealsByCity({ city, limit: sectionLimit }) : Promise.resolve([]),
      findFrequentlyBoughtByCity({ city, limit: sectionLimit }),
      findAllOfficeSupplyProductsAndCount({ city, search, localCategory, offset, limit: sectionLimit }),
    ]);

    customLog(req?.LogTraceId, "info", {
      message: "ONDC office-supply sections fetched",
      city,
      curatedCity,
      topDeals: topDeals?.length || 0,
      allProducts: allProducts?.count || 0,
    });

    return res.status(200).json({
      status: true,
      message: "Successfully retrieved office supplies sections",
      data: {
        topDeals: topDeals || [],
        topRated: [],
        frequentlyBought: frequentlyBought || [],
        allProducts: allProducts || { rows: [], count: 0 },
      },
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ONDC office-supply sections failed",
      query: { city, search, localCategory, sectionLimit, offset },
      error: error?.message || error,
      sql: error?.parent?.sql || error?.sql,
      stack: error?.stack,
    });
    return next(error);
  }
});

/**
 * Trigger an ONDC /search for a city on demand, once per enabled subcategory
 * domain on the Categories tab (`officeSupplyCategories.ondcDomain`). Vendor
 * optional5 is not the catalog domain list.
 *
 * Workbench (`forceTransactionId`) still fires a single search — a multi-domain
 * fan-out against one seller URL is refused. Production gateway search fans out.
 *
 * Per domain: catalog_full when the city has no in-stock SKUs for that domain
 * or the last full search is older than 12 hours. Incremental push (mode=start)
 * is armed once per domain. Workbench still fires a single city full search only.
 */
exports.triggerOndcCitySearch = asyncHandler(async (req, res, next) => {
  const city = req.body?.city;

  customLog(req?.LogTraceId, "info", {
    message: "ONDC city search trigger requested",
    credentialId: req?.user?.id,
    city,
  });

  if (!city) {
    return next(new ErrorResponse("city is required", 400));
  }

  const result = await runOndcCityCatalogSearch({ city, logTraceId: req?.LogTraceId });
  return res.status(200).json(result);
});

/**
 * Mark a storefront session catalog unavailable (user left Office Supplies, or
 * the FE is replacing a previous city's search). Sets availableQuantity to 0
 * by transactionId only — rows are kept so a later ingest can restore stock.
 */
exports.deleteOndcSearchCatalog = asyncHandler(async (req, res, next) => {
  const transactionIds = asTransactionIds(req.body?.transactionIds);
  if (!transactionIds.length) {
    return next(new ErrorResponse("transactionIds is required", 400));
  }
  const unavailable = await deleteOfficeSupplyProductsByTransactionIds({ transactionIds });
  customLog(req?.LogTraceId, "info", {
    message: "ONDC search catalog marked unavailable",
    transactionIds,
    unavailable,
  });
  return res.status(200).json({
    status: true,
    message: "catalog marked unavailable",
    responseCode: "000",
    data: { unavailable, deleted: unavailable },
  });
});

/**
 * Fetch a single ONDC office-supply product (newest row) by ondcProductId.
 */
exports.fetchOndcProductDetail = asyncHandler(async (req, res, next) => {
  const ondcProductId = req.query.ondcProductId;

  customLog(req?.LogTraceId, "info", {
    message: "ONDC product detail requested",
    credentialId: req?.user?.id,
    ondcProductId,
  });

  if (!ondcProductId) {
    customLog(req?.LogTraceId, "error", {
      message: "ONDC product detail: missing ondcProductId",
    });
    return next(new ErrorResponse("ondcProductId is required", 400));
  }

  try {
    const productDetail = await findOndcProductDetail({ ondcProductId });
    if (!productDetail) {
      customLog(req?.LogTraceId, "info", {
        message: "ONDC product detail not found",
        ondcProductId,
      });
      return next(new ErrorResponse("ONDC product not found", 404));
    }

    customLog(req?.LogTraceId, "info", {
      message: "ONDC product detail fetched",
      ondcProductId,
    });

    return res.status(200).json({
      status: true,
      message: "Successfully retrieved ONDC product detail",
      data: productDetail,
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ONDC product detail failed",
      ondcProductId,
      error: error?.message || error,
      sql: error?.parent?.sql || error?.sql,
      stack: error?.stack,
    });
    return next(error);
  }
});

// Concurrent live-refreshes of the same product share one directed search
// (double-clicks, multiple users) — maps ondcProductId -> pending refresh.
const inFlightProductRefreshes = new Map();
const PRODUCT_REFRESH_TIMEOUT_MS = 25000;

/**
 * Fire a directed ONDC /search for exactly this product (item id + provider id,
 * routed to its seller app via bpp_id/bpp_uri) and wait until that product
 * arrives on the on_search webhook, then return the row updated with the
 * seller's CURRENT price/stock.
 */
const refreshProductFromSeller = async (row, requestedCity, logTraceId) => {
  const key = row.ondcProductId;
  if (inFlightProductRefreshes.has(key)) {
    customLog(logTraceId, "info", {
      message: "ONDC product refresh: joining in-flight refresh for this product",
      ondcProductId: key,
    });
    return inFlightProductRefreshes.get(key);
  }

  const run = (async () => {
    const transactionId = uuidv4();
    const city = requestedCity || parseCityArray(row.city)[0] || undefined;

    customLog(logTraceId, "info", {
      message: "ONDC product refresh: starting directed refresh",
      ondcProductId: row.ondcProductId,
      transactionId,
      requestedCity,
      resolvedCity: city,
      bppId: row.bppId,
      bppUri: row.bppUri,
      ondcDomain: row.ondcDomain,
    });

    // Register the waiter BEFORE firing so a fast webhook can't slip past it.
    const wait = waitForProducts(transactionId, {
      productId: row.ondcProductId,
      threshold: 1,
      timeoutMs: PRODUCT_REFRESH_TIMEOUT_MS,
    });

    customLog(logTraceId, "info", {
      message: "ONDC product refresh: waiter registered",
      ondcProductId: row.ondcProductId,
      transactionId,
      threshold: 1,
      timeoutMs: PRODUCT_REFRESH_TIMEOUT_MS,
    });

    // Registry row lets the webhook stamp the requested city/source correctly.
    try {
      await createUserSearch({
        transactionId,
        search: row.name || "",
        source: "OFFICE_SUPPLIES",
        ondcDomain: row.ondcDomain,
        city,
      });
      customLog(logTraceId, "info", {
        message: "ONDC product refresh: user search registered",
        ondcProductId: row.ondcProductId,
        transactionId,
        search: row.name || "",
        city,
      });
    } catch (registryError) {
      customLog(logTraceId, "error", {
        message: "ONDC product refresh: failed to register search (continuing)",
        transactionId,
        error: registryError?.message || registryError,
      });
    }

    try {
      customLog(logTraceId, "info", {
        message: "ONDC product refresh: firing directed /search",
        ondcProductId: row.ondcProductId,
        transactionId,
        bppId: row.bppId,
        bppUri: row.bppUri,
        domain: row.ondcDomain,
        city,
      });
      await ondc.search({
        bppId: row.bppId,
        bppUri: row.bppUri,
        domain: row.ondcDomain,
        city,
        transactionId,
      });
      customLog(logTraceId, "info", {
        message: "ONDC product refresh: /search accepted, waiting for on_search webhook",
        ondcProductId: row.ondcProductId,
        transactionId,
      });
    } catch (searchError) {
      cancelWait(transactionId, "search_failed");
      customLog(logTraceId, "error", {
        message: "ONDC product refresh /search call failed (serving cached row)",
        ondcProductId: row.ondcProductId,
        transactionId,
        error: searchError?.message || searchError,
      });
      return { refreshed: false, reason: "search_failed" };
    }

    const result = await wait;
    customLog(logTraceId, "info", {
      message: "ONDC product refresh: wait settled",
      ondcProductId: row.ondcProductId,
      transactionId,
      ...result,
    });
    return { refreshed: result.reason === "product", reason: result.reason };
  })().finally(() => {
    inFlightProductRefreshes.delete(key);
  });

  inFlightProductRefreshes.set(key, run);
  return run;
};

/**
 * Live product detail: holds the HTTP response until the seller's on_search
 * webhook delivers this product's CURRENT catalog entry (price/stock), then
 * responds with the refreshed row. Falls back to the cached row (flagged
 * `refreshed: false`) when the seller doesn't answer within the timeout.
 */
exports.refreshOndcProductDetail = asyncHandler(async (req, res, next) => {
  const ondcProductId = req.query.ondcProductId;
  const requestedCity = req.query.city;

  customLog(req?.LogTraceId, "info", {
    message: "ONDC live product detail requested",
    credentialId: req?.user?.id,
    ondcProductId,
    city: requestedCity,
  });

  if (!ondcProductId) {
    return next(new ErrorResponse("ondcProductId is required", 400));
  }

  try {
    const cachedRow = await findOndcProductDetail({ ondcProductId });
    if (!cachedRow) {
      customLog(req?.LogTraceId, "info", {
        message: "ONDC live product detail: product not found",
        ondcProductId,
      });
      return next(new ErrorResponse("ONDC product not found", 404));
    }

    customLog(req?.LogTraceId, "info", {
      message: "ONDC live product detail: cached row found, starting seller refresh",
      ondcProductId,
      bppId: cachedRow.bppId,
      bppUri: cachedRow.bppUri,
      cachedPrice: cachedRow.price,
      cachedAvailableQuantity: cachedRow.availableQuantity,
    });

    const { refreshed, reason } = await refreshProductFromSeller(
      cachedRow,
      requestedCity,
      req?.LogTraceId
    );

    customLog(req?.LogTraceId, "info", {
      message: "ONDC live product detail: seller refresh completed",
      ondcProductId,
      refreshed,
      reason,
    });

    // Re-read: the webhook upsert refreshed the row's volatile fields in place.
    const latestRow = refreshed
      ? (await findOndcProductDetail({ ondcProductId })) || cachedRow
      : cachedRow;

    if (refreshed) {
      customLog(req?.LogTraceId, "info", {
        message: "ONDC live product detail: re-read refreshed row",
        ondcProductId,
        price: latestRow.price,
        availableQuantity: latestRow.availableQuantity,
        priceChanged: latestRow.price !== cachedRow.price,
        stockChanged: latestRow.availableQuantity !== cachedRow.availableQuantity,
      });
    }

    customLog(req?.LogTraceId, "info", {
      message: "ONDC live product detail served",
      ondcProductId,
      refreshed,
      reason,
    });

    return res.status(200).json({
      status: true,
      message: refreshed
        ? "Successfully retrieved live ONDC product detail"
        : "Seller did not answer in time — serving last known product detail",
      data: { ...latestRow, refreshed },
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ONDC live product detail failed",
      ondcProductId,
      error: error?.message || error,
      stack: error?.stack,
    });
    return next(error);
  }
});

/**
 * City autocomplete for the Office Supplies city picker, backed by Google Places
 * (`/v1/places:autocomplete`). Mirrors the logistics city search but lives in the
 * purchase MS so Office Supplies doesn't depend on another service. Returns
 * `{ cities: [{ label, value }] }` (label = city text, value = Google placeId);
 * the frontend filters these down to cities it can map to an ONDC std code.
 */
exports.getEcommerceCityList = asyncHandler(async (req, res, next) => {
  const { searchText = "" } = req.query;

  if (!searchText || typeof searchText !== "string" || searchText.trim() === "") {
    return next(new ErrorResponse("Search text is required.", 400));
  }

  // Autocomplete degrades instead of erroring: the frontend merges these
  // results with its local city list, and an error response here would be
  // toasted at the user on every keystroke.
  const emptyResult = (message) =>
    res.status(200).json({
      status: true,
      message,
      responseCode: "000",
      data: { cities: [] },
    });

  try {
    const serviceDetails = await findServiceOperatorByAccessKey(GOOGLE_ACCESS_KEY);
    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      customLog(req?.LogTraceId, "error", {
        message: "City autocomplete unavailable: google_service operator missing/disabled",
      });
      return emptyResult("City autocomplete is unavailable");
    }

    const API_URL = serviceDetails.vendor.apiUrl;
    const googleApiKey = serviceDetails.vendor.optional1; // api key

    const payload = {
      input: searchText,
      includedPrimaryTypes: [
        "administrative_area_level_2",
        "locality",
        "administrative_area_level_3",
      ],
      languageCode: "en-US",
    };

    const config = {
      method: "POST",
      url: `${API_URL}/v1/places:autocomplete`,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Goog-Api-Key": googleApiKey,
        "X-Goog-FieldMask":
          "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text",
      },
      data: payload,
      timeout: 10_000,
    };

    customLog(
      req?.LogTraceId,
      "info",
      { message: "google city list api Request", request: config },
      "VENDOR",
      ["X-Goog-Api-Key"]
    );

    const response = await axios(config);

    customLog(
      req?.LogTraceId,
      "info",
      { message: "google city list api Response", response: response?.data },
      "VENDOR"
    );

    const suggestions = response?.data?.suggestions;
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      return emptyResult("No matching cities found");
    }

    // Map suggestions -> { value: placeId, label: text }
    const cities = suggestions
      .map((s) => {
        const placePrediction = s?.placePrediction;
        const placeId = placePrediction?.placeId ?? null;
        const labelText = placePrediction?.text?.text ?? null;
        if (!placeId || !labelText) return null;
        return { value: placeId, label: labelText };
      })
      .filter(Boolean);

    if (cities.length === 0) {
      return emptyResult("No matching cities found");
    }

    return res.status(200).json({
      status: true,
      message: "Cities fetched successfully",
      responseCode: "000",
      data: { cities },
    });
  } catch (error) {
    if (error?.response?.data) {
      customLog(req?.LogTraceId, "error", {
        message: "Error fetching city list from places API",
        status: error.response.status,
        data: error.response.data,
      });
    } else {
      customLog(req?.LogTraceId, "error", {
        message: "Error fetching city list",
        data: error?.message || error,
      });
    }
    return emptyResult("City autocomplete is unavailable");
  }
});

/**
 * Distinct seller (vendorName) list for a city — powers the Office Supplies
 * Filters sidebar "Seller" group.
 */
exports.getEcommerceSellers = asyncHandler(async (req, res, next) => {
  const city = req.query.city;
  if (!city) {
    return next(new ErrorResponse("city is required", 400));
  }
  const search = req.query.search;
  const localCategory = req.query.localCategory;
  try {
    const sellers = await findSellersByCity({ city, search, localCategory });
    return res.status(200).json({
      status: true,
      message: "Successfully retrieved sellers",
      data: { sellers: sellers || [] },
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "ONDC sellers fetch failed",
      city,
      error: error?.message || error,
    });
    return next(error);
  }
});

/**
 * Resolve an Indian pincode to { city, state }. India Post is retried, then
 * Zippopotam is the fallback — api.postalpincode.in times out often enough that
 * a single call used to 502 a valid PIN (e.g. 600001).
 */
exports.lookupPostcode = asyncHandler(async (req, res, next) => {
  const { postcode } = req.query;

  if (!postcode) {
    return next(new ErrorResponse("postcode is required", 400));
  }
  if (!/^[1-9][0-9]{5}$/.test(postcode)) {
    return res.status(400).json({
      status: false,
      message: "Invalid PIN code",
      responseCode: "003",
      data: {},
    });
  }

  try {
    const { city, state } = await resolveIndianPincode(postcode);

    if (!city && !state) {
      return res.status(400).json({
        status: false,
        message: "Invalid PIN code",
        responseCode: "003",
        data: {},
      });
    }

    return res.status(200).json({
      status: true,
      message: "Postcode resolved",
      responseCode: "000",
      data: { city, state },
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "Pincode lookup failed",
      postcode,
      error: error?.message || error,
    });
    return next(
      new ErrorResponse("Unable to resolve the pincode. Please try again.", 502)
    );
  }
});

/**
 * Add an ONDC office-supply product to the user's cart. The FE sends the listing
 * row id (`productId`, numeric) + `productQuantity`; we resolve that ondcProducts
 * row, snapshot its ONDC identity/price/name/image, and store it in the shared
 * cart tagged `source: "OFFICE_SUPPLIES"`. Mirrors the legacy add-to-cart response
 * shape (`{ newCartProduct, status }`).
 */
exports.addOndcProductToCart = asyncHandler(async (req, res, next) => {
  const productId = req.body.productId;
  const { productQuantity } = req.body;
  const quantity = parseInt(productQuantity);

  let product = await findOndcProductById({ id: productId });
  if (!product || !product.category) {
    return next(new ErrorResponse(`Product with id ${productId} not found`, 404));
  }
  // category disabled, seller blocked, admin switch off … — the storefront no
  // longer lists it, so a stale page or a direct call must not add it either
  if (!isOndcProductListed(product)) {
    return next(new ErrorResponse(`${product.name} is no longer available`, 409));
  }

  // Directed refresh: ask the seller for this item's current catalog entry and
  // wait for the on_search webhook to upsert the row, so the cart snapshot
  // (price/stock/locationId/fulfillmentId — all needed later by /select) is
  // built from fresh data. Best-effort: on timeout/failure keep the stored row.
  const transactionId = uuidv4();
  const wait = waitForProducts(transactionId, {
    productId: product.ondcProductId,
    threshold: 1,
    timeoutMs: SEARCH_TIMEOUT_MS,
  });
  try {
    await ondc.search({
      bppId: product.bppId,
      bppUri: product.bppUri,
      itemId: product.ondcProductId,
      providerId: product.ondcVendorId,
      domain: product.ondcDomain,
      transactionId,
    });
  } catch (searchErr) {
    cancelWait(transactionId, "search_failed");
  }
  const refresh = await wait;
  if (refresh.received) {
    product = (await findOndcProductById({ id: productId })) || product;
  } else {
    customLog(req, "warn", {
      message: "addOndcProductToCart: product refresh did not arrive, using stored row",
      productId,
      ondcProductId: product.ondcProductId,
      reason: refresh.reason,
    }, "VENDOR");
  }

  if (product.availableQuantity < 1) {
    return next(new ErrorResponse(`${product.name} is out of stock`, 409));
  }

  // Seller-declared order limits (quantity.minimum/maximum.count from on_search),
  // further bounded by MAX_ORDER_QUANTITY_PER_ITEM — sellers publish sentinel
  // counts (895689) that would otherwise become the ceiling.
  const { min: minOrderQty, max: maxOrderQty } = ondcQuantityBounds(product);
  if (quantity < minOrderQty) {
    return next(
      new ErrorResponse(`Minimum order quantity for ${product.name} is ${minOrderQty}`, 422)
    );
  }
  if (quantity > maxOrderQty) {
    return next(
      new ErrorResponse(`Insufficient quantity available for the desired product`, 422)
    );
  }

  const unitPrice = parseFloat(product.price) || 0;
  const cities = parseCityArray(product.city);
  const item = {
    source: "OFFICE_SUPPLIES",
    // listing row id — lets the cart update/delete endpoints address this item
    productId: product.id,
    ondcProductId: product.ondcProductId,
    ondcVendorId: product.ondcVendorId,
    bppId: product.bppId,
    bppUri: product.bppUri,
    // provider location + fulfillment serving this item — /select must echo
    // both (locationId doubles as the order-level provider location id).
    locationId: product.locationId || null,
    fulfillmentId: product.fulfillmentId || null,
    ondcDomain: product.ondcDomain || null,
    city: cities[0] || null,
    vendorName: product.vendorName,
    productName: product.name,
    image: (Array.isArray(product.images) && product.images[0]) || product.symbol || "",
    price: unitPrice,
    maxPrice: parseFloat(product.maxPrice) || unitPrice,
    productQuantity: quantity,
    availableQuantity: product.availableQuantity,
    minQuantity: minOrderQty,
    maxQuantity: parseInt(product.maxQuantity) || null,
    totalPrice: parseFloat((unitPrice * quantity).toFixed(2)),
    totalGst: 0,
    // seller-declared item policy (@ondc/org/*) — snapshotted here since the
    // ONDC protocol never re-sends these past on_search; carried through
    // init/confirm so a placed order can still answer "is this cancellable".
    returnable: product.returnable,
    cancellable: product.cancellable,
    returnWindow: product.returnWindow,
    // txn of the refresh search above — /select reuses it so the BPP can
    // correlate the order session with a search it actually answered
    transactionId,
    // Delivery estimate captured by the frontend (PDP already fetched it on
    // entry; a product card fetches on add) and passed in here — snapshotted so
    // the cart/checkout pages can show it without re-validating. Null when the
    // seller couldn't quote / no location selected (never fabricated).
    expectedDeliveryDate: req.body?.expectedDeliveryDate || null,
    deliveryTat: req.body?.deliveryTat || null,
  };

  const userData = {};
  if (req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId) {
    userData.subCorporateId = req.user.subCorporateId;
  } else {
    userData.corporateId = req.user.corporateId;
  }

  const newCartProduct = await addOndcProductInCart(item, userData);
  if (!newCartProduct) {
    return next(new ErrorResponse(`Something went wrong while adding product to the cart`, 500));
  }
  if (newCartProduct === "duplicate") {
    return res.status(201).json({
      status: true,
      message: "Product(s) already in the cart. Cart updated successfully",
      data: { newCartProduct, status: "updated" },
      responseCode: "000",
    });
  }

  return res.status(201).json({
    status: true,
    message: "Product(s) added to cart successfully",
    data: { newCartProduct, status: "added" },
    responseCode: "000",
  });
});

// Same flat shipping rules as the legacy cart.
const SHIPPING_CHARGE = 15;
const ELIGIBLE_FREE_SHIPPING = 100;

const ondcCartUserData = (req) => {
  const userData = {};
  if (req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId) {
    userData.subCorporateId = req.user.subCorporateId;
  } else {
    userData.corporateUserId = req.user.corporateId;
  }
  return userData;
};

/**
 * Map an on_select/on_init `order.quote` into the API shape: typed item rows,
 * summed delivery charge, other charges (tax/packing/misc…), and `rows` — an
 * exact ordered mirror of quote.breakup the review page renders verbatim
 * (incl. zero-amount lines). Sellers' item rows carry only the variant as
 * title ("1 Kg"), so rows keyed to a cart item are enriched with its
 * productName. Counts arrive as number or string depending on the seller.
 */
const mapQuote = (quote, cartItems) => {
  const breakup = quote?.breakup || [];
  const byOndcId = new Map((cartItems || []).map((c) => [c.ondcProductId, c]));
  const quoteItems = breakup
    .filter((b) => b["@ondc/org/title_type"] === "item")
    .map((b) => ({
      itemId: b["@ondc/org/item_id"],
      title: b.title,
      quantity: parseInt(b["@ondc/org/item_quantity"]?.count) || null,
      amount: parseOndcAmount(b.price?.value),
    }));
  const deliveryCharge = breakup
    .filter((b) => b["@ondc/org/title_type"] === "delivery")
    .reduce((sum, b) => sum + parseOndcAmount(b.price?.value), 0);
  const otherCharges = breakup
    .filter((b) => !["item", "delivery"].includes(b["@ondc/org/title_type"]))
    .map((b) => ({
      title: b.title,
      type: b["@ondc/org/title_type"],
      amount: parseOndcAmount(b.price?.value),
    }));
  const rows = breakup.map((b) => {
    const cartItem = byOndcId.get(b["@ondc/org/item_id"]);
    return {
      itemId: b["@ondc/org/item_id"] || null,
      titleType: b["@ondc/org/title_type"] || null,
      title: b.title || "",
      productName: cartItem?.productName || null,
      // seller-declared item policy, snapshotted at add-to-cart time (see
      // addOndcProductToCart) — null/undefined on cart items predating this.
      returnable: cartItem?.returnable ?? null,
      cancellable: cartItem?.cancellable ?? null,
      returnWindow: cartItem?.returnWindow || null,
      quantity: parseInt(b["@ondc/org/item_quantity"]?.count) || null,
      amount: parseOndcAmount(b.price?.value),
      currency: b.price?.currency || "INR",
    };
  });

  return {
    total: parseOndcAmount(quote?.price?.value),
    currency: quote?.price?.currency || "INR",
    items: quoteItems,
    // Item value excluding delivery/tax/packing — the buyer finder fee's base.
    // Kept identical to the mapQuote copy in services/ondcOnConfirmPersist.js.
    itemsTotal: sumQuoteItemsTotal(quote),
    deliveryCharge: parseFloat(deliveryCharge.toFixed(2)),
    otherCharges,
    rows,
    ttl: quote?.ttl || null,
  };
};

const OFFICE_SUPPLY_ACCESS_KEY = "ecommerce";

/** Recompute checkout platform fee server-side — same inputs as the surcharge API. */
const computeOfficeSupplyPlatformFee = async (req, orderAmount) => {
  if (!orderAmount || orderAmount <= 0) return 0;
  try {
    const serviceDetails = await fetchServiceDetails({
      credentialId: req.user?.id,
      accessKey: OFFICE_SUPPLY_ACCESS_KEY,
      packageId: req.user?.packageId,
      corporateUserId: req.user?.corporateId,
    });
    if (!serviceDetails || serviceDetails.error) return 0;
    const surchargeDetails = await calculateSurchargeWithTax(
      serviceDetails.surcharge,
      serviceDetails.surchargeType,
      orderAmount.toFixed(2),
      req.user?.id
    );
    return parseFloat(surchargeDetails.surcharge) || 0;
  } catch (err) {
    customLog(req?.LogTraceId, "error", {
      message: "computeOfficeSupplyPlatformFee failed — persisting seller totals only",
      error: err?.message || err,
    }, "VENDOR");
    return 0;
  }
};

/**
 * Split the checkout platform fee across confirmed seller orders and stamp
 * amountPaid on each row. Proportional by seller quote; last row absorbs
 * rounding so allocated fees sum exactly to platformFeeTotal.
 */
const persistCheckoutPaymentTotals = async (req, confirmed, confirmedTotal, platformFeeTotal) => {
  if (!confirmed.length) return;

  let allocated = 0;
  for (let i = 0; i < confirmed.length; i += 1) {
    const group = confirmed[i];
    const sellerTotal = parseFloat(group.quote?.total) || 0;
    let share = 0;
    if (platformFeeTotal > 0) {
      if (i === confirmed.length - 1) {
        share = parseFloat((platformFeeTotal - allocated).toFixed(2));
      } else {
        share = confirmedTotal > 0
          ? parseFloat((platformFeeTotal * (sellerTotal / confirmedTotal)).toFixed(2))
          : 0;
        allocated += share;
      }
    }
    // eslint-disable-next-line no-await-in-loop
    await updateOndcOrderPaymentTotals({
      transactionId: group.transactionId,
      platformFee: share,
      amountPaid: parseFloat((sellerTotal + share).toFixed(2)),
    });
  }
};

/**
 * Route each confirmed seller's share of a paid order to their own account with
 * Cashfree Easy Split: register the seller as an Easy Split vendor if they aren't
 * one already, then write ONE split rule covering every eligible vendor.
 *
 * Sellers whose BPP gave us unusable settlement details (masked "XXXX", missing
 * IFSC, no settlement block at all) are skipped and reported to ops rather than
 * blocking anything — their money simply stays in the Peko balance for a manual
 * payout. Same for a Cashfree failure. The orders are already placed when this
 * runs, so nothing in here may throw.
 *
 * Amount split per seller is that seller's full confirmed quote total; the Peko
 * platform fee was never part of the seller's quote and stays with Peko.
 */
// const settleConfirmedSellersViaEasySplit = async (req, confirmed, paymentRef) => {
//   const logTraceId = req?.LogTraceId;
//   try {
//     // Entry breadcrumb: if a split never happens, this line tells you the run
//     // started and with what.
//     customLog(logTraceId, "info", {
//       scope: "easySplit",
//       step: "start",
//       message: "Settling confirmed ONDC sellers via Easy Split",
//       paymentRef,
//       confirmedCount: confirmed.length,
//       sellers: confirmed.map((g) => ({
//         bppId: g.bppId,
//         providerId: g.providerId,
//         vendorName: g.vendorName,
//         amount: g.quote?.total ?? null,
//       })),
//     }, "VENDOR");

//     if (!(await isEasySplitEnabled(logTraceId))) return;

//     const config = await resolveEasySplitConfig(logTraceId);
//     if (config.error) {
//       customLog(logTraceId, "error", {
//         scope: "easySplit",
//         step: "start",
//         message: "Aborting — Cashfree configuration incomplete (see the config log above)",
//         paymentRef,
//         error: config.error,
//       }, "VENDOR");
//       return;
//     }
//     const settings = await getEasySplitSettings(logTraceId);

//     // The Cashfree order id — read it off the payment record rather than rebuilding
//     // `peko_<ref>`: the prefix is `pekoSub_` for sub-corporate users.
//     const paymentOrder = await findOneOrder({ corporateTxnId: String(paymentRef) });
//     let gatewayOrderId = null;
//     let orderIdParseError = null;
//     try {
//       gatewayOrderId = paymentOrder?.paymentModeResponse
//         ? JSON.parse(paymentOrder.paymentModeResponse)?.order_id || null
//         : null;
//     } catch (parseErr) {
//       orderIdParseError = parseErr?.message || String(parseErr);
//       gatewayOrderId = null;
//     }
//     if (!gatewayOrderId) {
//       // Says exactly which link in the chain broke: no orders row at all, a row
//       // with no gateway response, or a response we couldn't parse.
//       customLog(logTraceId, "error", {
//         scope: "easySplit",
//         step: "gateway-order-id",
//         message: "Aborting — could not resolve the Cashfree order id for this payment",
//         paymentRef,
//         foundPaymentOrder: Boolean(paymentOrder),
//         orderRowId: paymentOrder?.id ?? null,
//         hasPaymentModeResponse: Boolean(paymentOrder?.paymentModeResponse),
//         parseError: orderIdParseError,
//       }, "VENDOR");
//       return;
//     }

//     const sellers = await findOndcSellersByKeys(
//       confirmed.map((group) => ({ bppId: group.bppId, providerId: group.providerId }))
//     );

//     const splits = [];
//     const skipped = [];

//     for (const group of confirmed) {
//       const amount = parseFloat((group.quote?.total || 0).toFixed(2));
//       const seller = sellers.get(`${group.bppId}|${group.providerId}`);
//       const label = group.vendorName || group.providerId || group.bppId || "seller";

//       if (!seller) {
//         // No ondcSellers row: this checkout's /init predates the seller-capture
//         // code, or the upsert failed back then (look for the init-time error).
//         customLog(logTraceId, "error", {
//           scope: "easySplit",
//           step: "seller-lookup",
//           message: "No ondcSellers row for this confirmed group — nothing to pay against",
//           paymentRef,
//           bppId: group.bppId,
//           providerId: group.providerId,
//           vendorName: group.vendorName,
//           transactionId: group.transactionId,
//           amount,
//         }, "VENDOR");
//         skipped.push({ group, label, reason: "seller_not_captured" });
//         continue;
//       }
//       if (amount <= 0) {
//         customLog(logTraceId, "error", {
//           scope: "easySplit",
//           step: "seller-lookup",
//           message: "Confirmed group has no quote total — refusing to split zero",
//           paymentRef,
//           providerId: group.providerId,
//           transactionId: group.transactionId,
//           quote: group.quote ?? null,
//         }, "VENDOR");
//         skipped.push({ group, label, reason: "zero_amount" });
//         continue;
//       }

//       // eslint-disable-next-line no-await-in-loop
//       const vendor = await ensureEasySplitVendor(seller, {
//         settings,
//         config,
//         logTraceId,
//         persist: updateOndcSellerVendor,
//       });
//       if (vendor.error) {
//         skipped.push({ group, label, reason: vendor.error, detail: vendor.message });
//         continue;
//       }

//       splits.push({
//         group,
//         amount,
//         entry: {
//           vendor_id: vendor.vendorId,
//           amount,
//           tags: {
//             transaction_id: String(group.transactionId || ""),
//             provider_id: String(group.providerId || ""),
//             ondc_order_id: String(group.orderId || ""),
//           },
//         },
//       });
//     }

//     let splitResult = { status: false, message: "no eligible vendors" };
//     if (splits.length) {
//       splitResult = await splitOrder(
//         gatewayOrderId,
//         splits.map((s) => s.entry),
//         // one split, written once the order is confirmed — close the order to
//         // any further splits
//         { disableSplit: true, logTraceId },
//         config
//       );
//     }

//     // Stamp the outcome per seller order so it's queryable for reconciliation.
//     // A DB write failing here would hide the outcome, so each one is guarded and
//     // logged rather than allowed to abort the loop.
//     const stamp = async (transactionId, patch) => {
//       try {
//         await updateOndcOrderSplit({ transactionId, ...patch });
//       } catch (stampErr) {
//         customLog(logTraceId, "error", {
//           scope: "easySplit",
//           step: "stamp-order",
//           message: "Could not record the split outcome on the ondcOrders row",
//           paymentRef,
//           transactionId,
//           patch,
//           error: stampErr?.message || stampErr,
//         }, "VENDOR");
//       }
//     };

//     for (const s of splits) {
//       // eslint-disable-next-line no-await-in-loop
//       await stamp(s.group.transactionId, {
//         splitVendorId: s.entry.vendor_id,
//         splitStatus: splitResult.status ? "SPLIT" : "FAILED",
//         splitAmount: s.amount,
//         splitError: splitResult.status ? null : splitResult.message || "split_failed",
//       });
//     }
//     for (const s of skipped) {
//       // eslint-disable-next-line no-await-in-loop
//       await stamp(s.group.transactionId, {
//         splitStatus: "SKIPPED",
//         splitAmount: parseFloat((s.group.quote?.total || 0).toFixed(2)),
//         splitError: s.detail ? `${s.reason}: ${s.detail}` : s.reason,
//       });
//     }

//     // Closing summary — one line that answers "what happened to this checkout's
//     // money" without reading the rest of the trace.
//     customLog(logTraceId, splitResult.status || !splits.length ? "info" : "error", {
//       scope: "easySplit",
//       step: "done",
//       message: splits.length
//         ? splitResult.status
//           ? "Split rule written — sellers will be settled by Cashfree"
//           : "Split rule FAILED — sellers unpaid, needs manual payout"
//         : "Nothing to split — no eligible sellers on this order",
//       paymentRef,
//       gatewayOrderId,
//       splitCount: splits.length,
//       splitTotal: parseFloat(splits.reduce((sum, s) => sum + s.amount, 0).toFixed(2)),
//       split: splits.map((s) => ({ vendor_id: s.entry.vendor_id, amount: s.amount })),
//       skippedCount: skipped.length,
//       skipped: skipped.map((s) => ({
//         seller: s.label,
//         providerId: s.group.providerId,
//         amount: parseFloat((s.group.quote?.total || 0).toFixed(2)),
//         reason: s.reason,
//         detail: s.detail || null,
//       })),
//       splitMessage: splitResult.message || null,
//     }, "VENDOR");

//     if (skipped.length || (splits.length && !splitResult.status)) {
//       await notifyOpsOfUnsplitSellers(req, {
//         paymentRef,
//         gatewayOrderId,
//         skipped,
//         failed: splitResult.status ? [] : splits,
//         failureMessage: splitResult.message,
//       });
//     }
//   } catch (splitErr) {
//     // Unexpected throw (a DB error, a bug). Stack included — nothing above this
//     // catch is allowed to fail the confirm response, so this log is the only
//     // trace that will exist.
//     customLog(logTraceId, "error", {
//       scope: "easySplit",
//       step: "threw",
//       message: "Settlement threw — sellers may be unpaid, needs manual reconciliation",
//       paymentRef,
//       confirmedCount: confirmed?.length ?? null,
//       error: splitErr?.message || String(splitErr),
//       stack: splitErr?.stack || null,
//     }, "VENDOR");
//   }
// };

/**
 * One digest to ops per checkout listing sellers whose share could not be split,
 * with the reason. Reuses the platform ops mailbox from the `pekoWebsite` setting,
 * the same source the refund-failure mail uses. Fully guarded and fire-and-forget.
 */
// const notifyOpsOfUnsplitSellers = async (req, { paymentRef, gatewayOrderId, skipped, failed, failureMessage }) => {
//   const logTraceId = req?.LogTraceId;
//   try {
//     const websiteSetting = await findByName({ name: "pekoWebsite" });
//     const to = websiteSetting?.emails;
//     if (!to) {
//       customLog(logTraceId, "error", {
//         scope: "easySplit",
//         step: "ops-digest",
//         message: "No ops mailbox configured (settings row 'pekoWebsite'.emails) — unpaid sellers were NOT reported by email; rely on the logs above",
//         paymentRef,
//         skippedCount: skipped?.length ?? 0,
//         failedCount: failed?.length ?? 0,
//       }, "VENDOR");
//       return;
//     }

//     const rows = [
//       ...skipped.map((s) => `<tr><td>${s.label}</td><td>₹${(s.group.quote?.total || 0).toFixed(2)}</td><td>${s.reason}${s.detail ? ` — ${s.detail}` : ""}</td></tr>`),
//       ...failed.map((s) => `<tr><td>${s.group.vendorName || s.group.providerId}</td><td>₹${s.amount.toFixed(2)}</td><td>split_failed${failureMessage ? ` — ${failureMessage}` : ""}</td></tr>`),
//     ].join("");

//     const body = `
//       <p>These ONDC sellers were <b>not</b> paid through Easy Split for payment reference
//       <b>${paymentRef}</b> (Cashfree order <b>${gatewayOrderId}</b>). The buyer's orders were
//       placed successfully — this money is still in the Peko balance and needs a manual payout.</p>
//       <table border="1" cellpadding="6" cellspacing="0">
//         <tr><th>Seller</th><th>Amount</th><th>Reason</th></tr>
//         ${rows}
//       </table>`;

//     emailer.email(to, "ONDC Easy Split — sellers pending manual payout", body, () =>
//       customLog(logTraceId, "info", {
//         scope: "easySplit",
//         step: "ops-digest",
//         message: "Ops digest sent for unpaid sellers",
//         to,
//         paymentRef,
//       }, "VENDOR"));
//   } catch (mailErr) {
//     customLog(logTraceId, "error", {
//       scope: "easySplit",
//       step: "ops-digest",
//       message: "Could not send the ops digest — unpaid sellers are only in the logs",
//       paymentRef,
//       error: mailErr?.message || String(mailErr),
//       stack: mailErr?.stack || null,
//     }, "VENDOR");
//   }
// };

/**
 * Expected delivery date for a confirmed order: the longest (worst-case) TAT
 * across its fulfillments — "@ondc/org/TAT" (e.g. "P1DT1H") — resolved against
 * the on_confirm timestamp into an absolute date.
 */
const computeExpectedDelivery = (order) => {
  const tats = (order.fulfillments || [])
    .map((f) => f["@ondc/org/TAT"])
    .filter(Boolean);
  if (!tats.length) return { deliveryTat: null, expectedDeliveryDate: null };

  const ms = tats.map(parseIsoDurationMs).filter((v) => v !== null);
  if (!ms.length) return { deliveryTat: tats[0], expectedDeliveryDate: null };

  const maxMs = Math.max(...ms);
  const base = new Date(order.updated_at || order.created_at || Date.now());
  return {
    deliveryTat: tats[ms.indexOf(maxMs)] || tats[0],
    expectedDeliveryDate: new Date(base.getTime() + maxMs),
  };
};

// ============================================================
// Live order status / tracking refresh (explicit Refresh / Track buttons)
// ============================================================
// Once an issue is in one of these, no further buyer/seller action moves it.
// (The ITEM/FULFILLMENT/ORDER/AGENT category enum is enforced by
// validateRaiseOndcIssue in utils/apiValidation.js, not re-checked here.)
// Canonical list now lives in utils/ondcIgmStatus.js alongside the wire<->internal
// mapping, so the three controllers that need it can no longer drift apart.
const { TERMINAL_ISSUE_STATUSES, ISSUE_STATUS, ISSUE_LEVEL, toWireIssueLevel, mapStatusToWireStatus } = require("../../utils/ondcIgmStatus");
// Short timeout for the button-triggered /status and /track calls — better to
// fall back to the cached row than hold the page for the full checkout wait.
const ORDER_STATUS_TIMEOUT_MS = 30000;

// Dedupe concurrent refreshes of the same order (e.g. two tabs open on the
// same Order Details page) so only one /status (or /track) actually goes out;
// both callers await the same in-flight promise. Mirrors inFlightProductRefreshes.
const inFlightStatusRefreshes = new Map();
const inFlightTrackingRefreshes = new Map();
const inFlightIssueRefreshes = new Map();

/**
 * Fire a signed /status at the order's BPP and wait (briefly) for the
 * on_status webhook to answer. The webhook persists orderState/fulfillments
 * directly (unconditionally — see controllers/webhook/ondc.js onStatus), so
 * this function's return value only tells the caller WHETHER to re-read the
 * row — it never returns order data itself.
 */
const refreshOrderStatusFromSeller = async (row, logTraceId) => {
  const key = row.transactionId;
  if (inFlightStatusRefreshes.has(key)) {
    return inFlightStatusRefreshes.get(key);
  }

  const run = (async () => {
    const wait = waitForOnStatus(row.transactionId, { timeoutMs: ORDER_STATUS_TIMEOUT_MS });
    try {
      await ondc.status({
        bppId: row.bppId,
        bppUri: row.bppUri,
        orderId: row.orderId,
        transactionId: row.transactionId,
        domain: row.domain,
        city: row.city,
      });
    } catch (statusErr) {
      cancelStatusWait(row.transactionId, "status_failed");
      customLog(logTraceId, "error", {
        message: "refreshOndcOrderStatus: /status call failed (serving cached order)",
        transactionId: row.transactionId,
        error: statusErr?.message || statusErr,
      }, "VENDOR");
      return { received: false, reason: "status_failed" };
    }
    return wait;
  })().finally(() => {
    inFlightStatusRefreshes.delete(key);
  });

  inFlightStatusRefreshes.set(key, run);
  return run;
};

/** Same as refreshOrderStatusFromSeller, for /track + on_track. */
const refreshOrderTrackingFromSeller = async (row, logTraceId) => {
  const key = row.transactionId;
  if (inFlightTrackingRefreshes.has(key)) {
    return inFlightTrackingRefreshes.get(key);
  }

  const run = (async () => {
    const wait = waitForOnTrack(row.transactionId, { timeoutMs: ORDER_STATUS_TIMEOUT_MS });
    try {
      await ondc.track({
        bppId: row.bppId,
        bppUri: row.bppUri,
        orderId: row.orderId,
        transactionId: row.transactionId,
        domain: row.domain,
        city: row.city,
      });
    } catch (trackErr) {
      cancelTrackWait(row.transactionId, "track_failed");
      customLog(logTraceId, "error", {
        message: "refreshOndcOrderTracking: /track call failed (serving cached tracking)",
        transactionId: row.transactionId,
        error: trackErr?.message || trackErr,
      }, "VENDOR");
      return { received: false, reason: "track_failed" };
    }
    return wait;
  })().finally(() => {
    inFlightTrackingRefreshes.delete(key);
  });

  inFlightTrackingRefreshes.set(key, run);
  return run;
};

const ISSUE_STATUS_TIMEOUT_MS = 10000;

/**
 * Fire a signed /issue_status at the issue's BPP and wait (briefly) for the
 * on_issue_status webhook to answer. The webhook persists respondent_actions
 * directly (see controllers/webhook/ondc.js onIssueStatus), so this function
 * only tells the caller WHETHER to re-read — it never returns issue data itself.
 */
const refreshIssueStatusFromSeller = async (issue, logTraceId, domain = null, city = null) => {
  const key = issue.issueId;
  if (inFlightIssueRefreshes.has(key)) {
    return inFlightIssueRefreshes.get(key);
  }

  const run = (async () => {
    const wait = waitForOnIssue(issue.issueId, { timeoutMs: ISSUE_STATUS_TIMEOUT_MS });
    try {
      await ondc.issueStatus({
        bppId: issue.bppId,
        bppUri: issue.bppUri,
        issueId: issue.issueId,
        transactionId: issue.transactionId,
        domain,
        city,
      });
    } catch (issueStatusErr) {
      cancelIssueWait(issue.issueId, "issue_status_failed");
      customLog(logTraceId, "error", {
        message: "refreshIssueStatusFromSeller: /issue_status call failed (serving cached issue)",
        issueId: issue.issueId,
        error: issueStatusErr?.message || issueStatusErr,
      }, "VENDOR");
      return { received: false, reason: "issue_status_failed" };
    }
    return wait;
  })().finally(() => {
    inFlightIssueRefreshes.delete(key);
  });

  inFlightIssueRefreshes.set(key, run);
  return run;
};

/**
 * Derive the Order Details page's `tracking` block from the persisted
 * fulfillments (on_confirm/on_status agent + tracking tags) and the last
 * on_track callback (row.tracking + row.trackingCheckedAt). Returns null when
 * there's genuinely nothing to show yet (no on_track callback ever received
 * AND no courier/url info on the fulfillment) — the frontend renders null as
 * "not available", never a fabricated placeholder.
 */
const buildTrackingDto = (row) => {
  const fulfillment = (row.fulfillments || [])[0] || null;
  const trackingTag = (fulfillment?.tags || []).find((t) => t.code === "tracking");
  const tagList = trackingTag?.list || [];
  const tagValue = (code) => tagList.find((l) => l.code === code)?.value || null;

  const courierName = fulfillment?.agent?.name || null;
  const courierPhone = fulfillment?.agent?.phone || null;
  const track = row.tracking || null; // persisted on_track message.tracking, verbatim

  const url = track?.url || tagValue("url") || null;
  const gps = track?.location?.gps || null;
  const status = track?.status || null;
  const updatedAt = row.trackingCheckedAt || null;

  if (!track && !courierName && !url) return null;

  return { status, gps, url, updatedAt, courierName, courierPhone };
};

/** Stored history, or a one-shot seed from the current snapshot for older rows. */
const resolveStatusHistory = (row) => {
  const stored = Array.isArray(row?.statusHistory) ? row.statusHistory : [];
  const seeded = stored.length
    ? stored
    : appendStatusHistory([], {
        orderState: row?.orderState,
        fulfillments: row?.fulfillments,
      }, "on_status");
  return dedupeStatusHistory(seeded);
};

/**
 * The products an ONDC order actually covers — shared by the Order History list
 * and the Order Details page so the two can never disagree.
 *
 * Two columns on the row can answer this: `items` is the cart snapshot written
 * at /confirm (everything the buyer asked for, never reconciled afterwards),
 * while `quote.rows` mirrors the seller's on_confirm quote.breakup (only the
 * lines it accepted and priced). A seller that is out of stock simply omits its
 * line, so `quote.rows` wins — it is what the buyer was charged for, and what
 * the cancel/return eligibility helpers already read.
 *
 * The cart snapshot is the fallback for rows carrying no confirmed item lines
 * (orders predating quote.rows, or a seller that omitted @ondc/org/title_type):
 * there the accepted set is genuinely unknown, and the requested set beats an
 * empty order. Nothing on that path was ever priced line-by-line.
 */
const resolveOndcOrderItems = (row = {}) => {
  const fromQuote = (row?.quote?.rows || []).filter((r) => r && r.titleType === "item");
  if (fromQuote.length) {
    return fromQuote.map((r) => ({
      itemId: r.itemId || null,
      // sellers title item rows with just the variant ("1 Kg"); mapQuote enriches
      // the row with our catalog name where the cart item matched
      productName: r.productName || r.title,
      quantity: r.quantity,
      price: r.amount,
      returnable: r.returnable ?? null,
      cancellable: r.cancellable ?? null,
      returnWindow: r.returnWindow || null,
    }));
  }
  return (row?.items || []).map((i) => ({
    itemId: i.ondcProductId || null,
    productName: i.productName || null,
    quantity: parseInt(i.productQuantity) || null,
    price: null,
    returnable: i.returnable ?? null,
    cancellable: i.cancellable ?? null,
    returnWindow: i.returnWindow || null,
  }));
};

/** Whitelist DTO for the Order Details page (GET + post-status/track refresh). */
const buildOndcOrderDetailData = (row) => ({
  id: row.id,
  orderId: row.orderId,
  orderState: row.orderState,
  transactionId: row.transactionId,
  vendorName: row.vendorName?.trim() || null,
  bppId: row.bppId,
  bppUri: row.bppUri,
  createdAt: row.createdAt,
  deliveredAt: row.deliveredAt || null,
  items: resolveOndcOrderItems(row),
  quote: row.quote,
  billing: row.billing,
  paymentRef: row.paymentRef,
  paymentStatus: row.paymentStatus,
  totalAmount: row.totalAmount,
  platformFee: parseFloat(row.platformFee) || 0,
  amountPaid: row.amountPaid ?? row.totalAmount,
  deliveryTat: row.deliveryTat,
  expectedDeliveryDate: row.expectedDeliveryDate,
  fulfillments: row.fulfillments || [],
  tracking: buildTrackingDto(row),
  statusHistory: resolveStatusHistory(row),
  returnStatus: row.returnStatus || null,
  returnRequestId: row.returnRequestId || null,
  returnReason: row.returnReason || null,
  returnedAt: row.returnedAt || null,
  returnWindow: row.returnWindow || null,
  returnReasons: RETURN_REASONS,
  invoiceUrl: getInvoiceUrl(row.documents),
});

const findOwnedOndcOrder = async (req) => {
  const userData = ondcCartUserData(req);
  const row = await findOneOndcOrderById({
    id: req.params.id,
    corporateUserId: userData.corporateUserId,
    subCorporateUserId: userData.subCorporateId,
  });
  return { userData, row };
};

/**
 * Order History list for the Office Supplies ONDC flow — paginated/filterable
 * over the confirmed orders in ondcOrders (one row per seller order placed via
 * /confirm). Query params: page (1-based), itemsPerPage, search, from, to.
 */
exports.getOndcOrderHistory = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const itemsPerPage = Math.min(parseInt(req.query.itemsPerPage) || 10, 100); // the UI page-size picker tops out at 100
  const { search, from, to } = req.query;
  const userData = ondcCartUserData(req);

  const { rows, count } = await findAllOndcOrdersAndCount({
    corporateUserId: userData.corporateUserId,
    subCorporateUserId: userData.subCorporateId,
    search,
    from,
    to,
    offset: (page - 1) * itemsPerPage,
    limit: itemsPerPage,
  });

  const orders = rows.map((row) => ({
    id: row.id,
    date: row.createdAt,
    // "" → null so the client has one "unknown" to check; older rows were
    // written with an empty string when the BPP omitted provider.descriptor.
    seller: row.vendorName?.trim() || null,
    // The seller-confirmed set, same source the Order Details page reads — the
    // cart snapshot on `row.items` still lists products an out-of-stock seller
    // dropped from its quote, which the buyer was never charged for.
    items: resolveOndcOrderItems(row).map((i) => `${i.productName} × ${i.quantity}`).join(', '),
    orderId: row.orderId || row.transactionId,
    amount: row.amountPaid ?? row.totalAmount,
    status: row.orderState || "Created",
    transactionId: row.transactionId,
    // lets the frontend derive a fulfillment-level delivery status (e.g.
    // "Out for delivery") the same way the Order Details page already does
    fulfillments: row.fulfillments || [],
  }));

  return res.status(200).json({
    status: true,
    message: "Successfully retrieved ONDC order history",
    responseCode: "000",
    data: { rows: orders, count },
  });
});

/**
 * Single ONDC order detail (Order Details page). Serves the last persisted
 * ondcOrders row — does NOT call ONDC /status or /track. Those go out only
 * from the explicit Refresh status / Track shipment buttons.
 */
exports.getOndcOrderById = asyncHandler(async (req, res, next) => {
  const { row } = await findOwnedOndcOrder(req);
  if (!row) {
    return next(new ErrorResponse("Order not found", 404));
  }

  return res.status(200).json({
    status: true,
    message: "Successfully retrieved order detail",
    responseCode: "000",
    data: buildOndcOrderDetailData(row),
  });
});

/**
 * Button-triggered ONDC /status. Waits briefly for on_status, then returns
 * the latest persisted row (cached fallback if the seller is slow/unreachable).
 */
exports.refreshOndcOrderStatus = asyncHandler(async (req, res, next) => {
  const { userData, row } = await findOwnedOndcOrder(req);
  if (!row) {
    return next(new ErrorResponse("Order not found", 404));
  }
  if (!row.bppUri || !row.orderId) {
    return next(new ErrorResponse("Cannot refresh status for this order yet", 400));
  }

  let result = { received: false, reason: "status_failed" };
  try {
    result = await refreshOrderStatusFromSeller(row, req?.LogTraceId);
  } catch (refreshErr) {
    customLog(req?.LogTraceId, "error", {
      message: "refreshOndcOrderStatus: /status refresh failed (serving cached order)",
      id: row.id,
      transactionId: row.transactionId,
      error: refreshErr?.message || refreshErr,
    }, "VENDOR");
  }

  const latestRow =
    (await findOneOndcOrderById({
      id: row.id,
      corporateUserId: userData.corporateUserId,
      subCorporateUserId: userData.subCorporateId,
    })) || row;

  return res.status(200).json({
    status: true,
    message: result?.received
      ? "Order status updated"
      : "Seller did not respond in time; showing last known status",
    responseCode: "000",
    data: {
      received: Boolean(result?.received),
      reason: result?.reason || null,
      order: buildOndcOrderDetailData(latestRow),
    },
  });
});

/**
 * Button-triggered ONDC /track. Always fires (even if tracking was not known
 * enabled yet) so the buyer can discover courier/url updates on demand.
 */
exports.refreshOndcOrderTracking = asyncHandler(async (req, res, next) => {
  const { userData, row } = await findOwnedOndcOrder(req);
  if (!row) {
    return next(new ErrorResponse("Order not found", 404));
  }
  if (!row.bppUri || !row.orderId) {
    return next(new ErrorResponse("Cannot track this order yet", 400));
  }

  let result = { received: false, reason: "track_failed" };
  try {
    result = await refreshOrderTrackingFromSeller(row, req?.LogTraceId);
  } catch (refreshErr) {
    customLog(req?.LogTraceId, "error", {
      message: "refreshOndcOrderTracking: /track refresh failed (serving cached tracking)",
      id: row.id,
      transactionId: row.transactionId,
      error: refreshErr?.message || refreshErr,
    }, "VENDOR");
  }

  const latestRow =
    (await findOneOndcOrderById({
      id: row.id,
      corporateUserId: userData.corporateUserId,
      subCorporateUserId: userData.subCorporateId,
    })) || row;

  return res.status(200).json({
    status: true,
    message: result?.received
      ? "Shipment tracking updated"
      : "Seller did not respond in time; showing last known tracking",
    responseCode: "000",
    data: {
      received: Boolean(result?.received),
      reason: result?.reason || null,
      order: buildOndcOrderDetailData(latestRow),
    },
  });
});

/**
 * Customer-initiated ONDC order cancellation (Order Details page's "Cancel
 * order" button) — a direct, self-service call, same as the admin "Cancel &
 * Refunds" panel's ondcOrderId branch (controllers/admin/ecomCancelAndRefunds.js):
 * a real signed /cancel POST to the seller's BPP, awaiting their on_cancel
 * webhook before persisting anything. The only real difference from the admin
 * path is ownership scoping — findOneOndcOrderById (unlike the admin's
 * findOndcOrderByIdAdmin) only returns a row belonging to the requesting
 * corporate user/sub-user, so a customer can never cancel someone else's order.
 */
exports.cancelOndcOrder = asyncHandler(async (req, res, next) => {
  const { reason, description } = req.body;
  const userData = ondcCartUserData(req);
  const row = await findOneOndcOrderById({
    id: req.params.id,
    corporateUserId: userData.corporateUserId,
    subCorporateUserId: userData.subCorporateId,
  });
  if (!row) {
    return next(new ErrorResponse("Order not found", 404));
  }

  const eligibility = assertOndcOrderCancellable(row);
  if (!eligibility.ok) {
    return next(new ErrorResponse(eligibility.message, eligibility.statusCode));
  }

  const waiterPromise = waitForOnCancel(row.transactionId);
  try {
    await ondc.cancel({
      bppId: row.bppId,
      bppUri: row.bppUri,
      orderId: row.orderId,
      transactionId: row.transactionId,
    });
  } catch (ondcErr) {
    return next(new ErrorResponse(ondcErr.message || "Failed to send cancellation to the seller", 502));
  }

  const result = await waiterPromise;
  const outcome = describeCancelOutcome(result);
  if (!outcome.ok) {
    // Log the raw reason: "the seller refused" and "we heard nothing back" look
    // identical to the buyer but mean very different things to ops.
    customLog(req?.LogTraceId, "warn", {
      message: "ondcCancel: cancellation not confirmed",
      ondcOrderId: row.id,
      waiterReason: result.reason,
      outcome: outcome.outcome,
      canForce: outcome.canForce,
    }, "VENDOR");
    return next(new ErrorResponse(outcome.message, outcome.statusCode));
  }

  const cancelReason = description ? `${reason} — ${description}` : reason || null;
  await updateOndcOrderCancellation({ id: row.id, cancelReason });
  await sendOndcOrderCancelledEmail({ row, cancelReason, logTraceId: req?.LogTraceId });

  let refund = null;
  try {
    refund = await refundOndcOrderAfterCancel({
      ondcOrderId: row.id,
      userId: req.user?.id || null,
      logTraceId: req?.LogTraceId,
      reason: cancelReason || "Order cancelled",
    });
  } catch (refundErr) {
    customLog(req?.LogTraceId, "error", {
      flow: "ondcCancelRefund",
      step: "cancel-handler-refund-threw",
      message: "Order cancelled at BPP but refund helper threw — needs reconciliation",
      ondcOrderId: row.id,
      paymentRef: row.paymentRef || null,
      error: refundErr?.message || String(refundErr),
    }, "VENDOR");
    refund = { status: false, reason: "refund_threw", message: refundErr?.message || String(refundErr) };
  }

  if (refund && refund.status === false && !refund.alreadyRefunded) {
    customLog(req?.LogTraceId, "error", {
      flow: "ondcCancelRefund",
      step: "cancel-handler-refund-failed",
      message: "Order cancelled but buyer refund did not complete — needs reconciliation",
      ondcOrderId: row.id,
      paymentRef: row.paymentRef || null,
      refund,
    }, "VENDOR");
  }

  return res.status(200).json({
    status: true,
    message: "Order cancelled successfully",
    responseCode: "000",
    data: {
      cancelled: true,
      refund: refund
        ? {
            status: Boolean(refund.status),
            amount: refund.amount ?? 0,
            refundId: refund.refundId || null,
            reason: refund.reason || null,
            message: refund.message || null,
            alreadyRefunded: Boolean(refund.alreadyRefunded),
          }
        : null,
    },
  });
});

/**
 * Customer-initiated DigiDukaan return for a delivered ONDC order — fires
 * signed /update with return_request tags, awaits first on_update, persists
 * lifecycle. Later Liquidated / Return_Picked / Return_Delivered callbacks
 * trigger refund + settlement via the webhook lifecycle handler.
 */
exports.returnOndcOrder = asyncHandler(async (req, res, next) => {
  const { items, reasonId, reasonDesc, images, description, replace: replaceRaw } = req.body || {};
  const replace = replaceRaw === true || replaceRaw === "yes" || replaceRaw === "true";
  const userData = ondcCartUserData(req);
  const row = await findOneOndcOrderById({
    id: req.params.id,
    corporateUserId: userData.corporateUserId,
    subCorporateUserId: userData.subCorporateId,
  });
  if (!row) {
    return next(new ErrorResponse("Order not found", 404));
  }

  const quoteItems = (row.quote?.rows || []).filter((r) => r.titleType === "item");
  let returnItems = Array.isArray(items) && items.length
    ? items.map((i) => ({
        itemId: String(i.itemId),
        quantity: Number(i.quantity) || 1,
      }))
    : quoteItems.map((r) => ({
        itemId: String(r.itemId),
        quantity: Number(r.quantity) || 1,
      }));

  returnItems = returnItems.filter((i) => i.itemId && i.itemId !== "null" && i.itemId !== "undefined");
  if (!returnItems.length) {
    return next(new ErrorResponse("No returnable items found on this order", 400));
  }

  let settings = {};
  try {
    settings = await getEasySplitSettings(req?.LogTraceId);
  } catch (_) {
    settings = { defaultReturnWindow: "P2D" };
  }

  const eligibility = assertOndcOrderReturnable(row, { items: returnItems, settings });
  if (!eligibility.ok) {
    return next(new ErrorResponse(eligibility.message, eligibility.statusCode));
  }

  const { reasonId: resolvedReasonId, reasonDesc: resolvedReasonDesc } = resolveReturnReason(
    reasonId,
    reasonDesc || description
  );

  // Upload evidence images (same posture as raise issue).
  let imageUrls = [];
  if (Array.isArray(images) && images.length) {
    try {
      imageUrls = await Promise.all(
        images.map((img) =>
          uploadFile(img.base64, `ondc/returns/${row.id}`, img.format, 2)
        )
      );
    } catch (uploadErr) {
      return next(new ErrorResponse(uploadErr.message || "Failed to upload the attached photo(s)", 400));
    }
  }

  // Workbench Replacement_Flow logs RP1; returns keep the R… prefix.
  const returnRequestId = `${replace ? "RP" : "R"}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  // DigiDukaan samples show one return_request per /update fulfillment; for
  // multi-item we send one fulfillment per line sharing the same reason.
  const returnRequests = returnItems.map((item, idx) => ({
    id: idx === 0 ? returnRequestId : `${returnRequestId}_${idx + 1}`,
    itemId: item.itemId,
    itemQuantity: item.quantity,
    reasonId: resolvedReasonId,
    reasonDesc: resolvedReasonDesc,
    images: imageUrls,
    replace,
  }));

  await updateOndcOrderReturnLifecycle({
    id: row.id,
    returnStatus: "Return_Requested",
    returnRequestId,
    returnReason: resolvedReasonDesc,
    returnMeta: {
      items: returnItems,
      reasonId: resolvedReasonId,
      reasonDesc: resolvedReasonDesc,
      images: imageUrls,
      replace,
      requestedAt: new Date().toISOString(),
    },
  });

  const waiterPromise = waitForOnUpdate(row.transactionId);
  try {
    await ondc.update({
      bppId: row.bppId,
      bppUri: row.bppUri,
      orderId: row.orderId,
      transactionId: row.transactionId,
      returnRequests,
    });
  } catch (ondcErr) {
    await updateOndcOrderReturnLifecycle({
      id: row.id,
      returnStatus: null,
      returnRequestId: null,
      returnMeta: { error: ondcErr?.message || String(ondcErr) },
    });
    return next(new ErrorResponse(ondcErr.message || "Failed to send the return request to the seller", 502));
  }

  const result = await waiterPromise;
  if (!result.received || result.error) {
    await updateOndcOrderReturnLifecycle({
      id: row.id,
      returnStatus: "Return_Failed",
      returnMeta: {
        items: returnItems,
        reasonId: resolvedReasonId,
        reasonDesc: resolvedReasonDesc,
        images: imageUrls,
        replace,
        bppError: result.error || { message: "timeout" },
      },
    });
    return next(new ErrorResponse(result.error?.message || "Seller did not confirm the return request", 502));
  }

  // Webhook may have already applied lifecycle; re-apply for the first snapshot
  // so the HTTP response includes the latest returnStatus / early refund.
  let applied = null;
  try {
    applied = await applyOndcReturnOnUpdate({
      transactionId: row.transactionId,
      order: result.order,
      logTraceId: req?.LogTraceId,
      userId: req.user?.id || null,
    });
  } catch (applyErr) {
    customLog(req?.LogTraceId, "error", {
      flow: "ondcReturn",
      step: "apply-first-on-update-failed",
      message: applyErr?.message || String(applyErr),
      ondcOrderId: row.id,
    }, "VENDOR");
  }

  const latest =
    (await findOneOndcOrderById({
      id: row.id,
      corporateUserId: userData.corporateUserId,
      subCorporateUserId: userData.subCorporateId,
    })) || row;

  // Only here — past the waiter and the seller's confirmation. A request the seller
  // rejected or never answered returned 502 above, so it mails nothing.
  // Item labels come from the quote rows already loaded (they carry productName and
  // title against the same itemId); an unmatched line falls back to its raw id rather
  // than vanishing from the email.
  const returnedItemLabels = returnItems.map((item) => {
    const quoteRow = quoteItems.find((r) => String(r.itemId) === String(item.itemId));
    const label = quoteRow?.productName || quoteRow?.title || item.itemId;
    return `${label} × ${item.quantity}`;
  });
  await sendOndcReturnInitiatedEmail({
    row: latest,
    returnRequestId: latest.returnRequestId || returnRequestId,
    items: returnedItemLabels,
    reason: resolvedReasonDesc,
    logTraceId: req?.LogTraceId,
  });

  const refund = applied?.refund || null;
  return res.status(200).json({
    status: true,
    message: replace
      ? "Replacement request submitted successfully"
      : "Return request submitted successfully",
    responseCode: "000",
    data: {
      returned: latest.orderState === "Returned",
      returnStatus: latest.returnStatus || applied?.returnStatus || "Return_Initiated",
      returnRequestId: latest.returnRequestId || returnRequestId,
      replace,
      refund: refund
        ? {
            status: Boolean(refund.status),
            amount: refund.amount ?? 0,
            refundId: refund.refundId || null,
            reason: refund.reason || null,
            message: refund.message || null,
            alreadyRefunded: Boolean(refund.alreadyRefunded),
          }
        : null,
    },
  });
});

/**
 * Complaint copy from IGM 2.0 `issue.descriptor` (stored on igmMeta) plus the
 * write-once description column. short_desc is the title ("Issue with product
 * quality"); long_desc is the buyer's/seller's fuller text.
 */
const issueDescriptorFields = (row) => {
  const descriptor = row?.igmMeta?.descriptor && typeof row.igmMeta.descriptor === "object"
    ? row.igmMeta.descriptor
    : {};
  const shortDesc = descriptor.short_desc || row?.description || null;
  const rawLong = descriptor.long_desc || null;
  const longDesc = rawLong && rawLong !== shortDesc ? rawLong : null;
  return {
    shortDesc,
    longDesc,
    description: longDesc || shortDesc || row?.description || null,
  };
};

const mapIssueForDto = (row) => {
  // events come back oldest-first; reverse so the API (and the frontend) sees newest-first.
  const events = [...(row.events || [])].reverse();
  const latest = events[0];
  const { shortDesc, longDesc, description } = issueDescriptorFields(row);
  return {
    id: row.id,
    displayId: `ISS-${1000 + row.id}`,
    category: row.category,
    subCategory: row.subCategory,
    status: row.status,
    wireStatus: mapStatusToWireStatus(row.status),
    latestUpdateSummary: latest?.message || "No updates yet.",
    shortDesc,
    longDesc,
    description,
    // IGM 2.0: the complaint's level, and what the seller has actually offered.
    // Flattened from the stored `resolutions[]` blob so the client doesn't have to
    // understand Beckn descriptor/tag nesting. Null for a 1.0 thread.
    level: row.level || null,
    resolutions: mapIssueResolutionsForDto(row.resolution),
    events: events.map((e) => ({
      eventType: e.eventType,
      actorType: e.actorType,
      actorName: e.actorName,
      message: e.message,
      images: e.images || [],
      occurredAt: e.occurredAt,
    })),
  };
};

/**
 * Flatten IGM 2.0 `issue.resolutions[]` for the client.
 *
 * The wire shape is a PARENT group plus its options, each carrying free-form
 * `RESOLUTION_DETAILS` tags (a REFUND_AMOUNT, an ITEM). The PARENT is a grouping
 * device with nothing to show a buyer, so it is dropped; the options keep their
 * details as simple key/value pairs.
 */
const mapIssueResolutionsForDto = (resolutions) => {
  if (!Array.isArray(resolutions)) return [];
  return resolutions
    .filter((r) => r?.descriptor?.code && r.descriptor.code !== "PARENT")
    .map((r) => ({
      id: r.id || null,
      code: r.descriptor.code,
      shortDesc: r.descriptor.short_desc || null,
      proposedBy: r.proposed_by || null,
      updatedAt: r.updated_at || null,
      details: (r.tags || [])
        .flatMap((tag) => tag?.list || [])
        .map((entry) => ({
          code: entry?.descriptor?.code || null,
          value: entry?.value ?? null,
        }))
        .filter((d) => d.code),
    }));
};

/**
 * Reconstructs the full {complainant_actions, respondent_actions} history IGM
 * expects echoed on every /issue call from our own stored event rows (oldest
 * first), appending `newAction` to whichever array it belongs to.
 */
const buildIssueActionsFromEvents = (events, newAction) => {
  const complainantActions = (events || [])
    .filter((e) => e.actorType === "COMPLAINANT")
    .map((e) => ({ complainant_action: e.eventType === "CLOSED" ? "CLOSE" : "OPEN", short_desc: e.message, updated_at: e.occurredAt }));
  const respondentActions = (events || [])
    .filter((e) => e.actorType === "RESPONDENT")
    .map((e) => ({ respondent_action: e.eventType, short_desc: e.message, updated_at: e.occurredAt }));

  if (newAction.complainant_action) complainantActions.push(newAction);
  else respondentActions.push(newAction);

  return { complainantActions, respondentActions };
};

/** Issues on one order, newest first — same ownership scoping as
 *  getOndcOrderById (look up the order first, 404/scope on that). */
exports.getOndcOrderIssues = asyncHandler(async (req, res, next) => {
  const userData = ondcCartUserData(req);
  const order = await findOneOndcOrderById({
    id: req.params.id,
    corporateUserId: userData.corporateUserId,
    subCorporateUserId: userData.subCorporateId,
  });
  if (!order) {
    return next(new ErrorResponse("Order not found", 404));
  }

  let issues = await findOndcIssuesForOrder({
    ondcOrderId: order.id,
    corporateUserId: userData.corporateUserId,
    subCorporateUserId: userData.subCorporateId,
  });

  // Best-effort live refresh: fire /issue_status for every non-terminal issue
  // so the on_issue_status webhook persists any new respondent_actions before
  // we return. Skip on Workbench — extra issue_status/on_issue_status calls
  // become the latest protocol action and block the IGM replacement on_update.
  const cfg = await ondc.getOndcConfig().catch(() => null);
  const activeIssues = issues.filter((i) => !TERMINAL_ISSUE_STATUSES.includes(i.status));
  if (activeIssues.length > 0 && !igm2.shouldUseIgm2(cfg, order)) {
    try {
      await Promise.all(
        activeIssues.map((issue) => refreshIssueStatusFromSeller(issue, req?.LogTraceId, order.domain, order.city))
      );
    } catch (refreshErr) {
      customLog(req?.LogTraceId, "error", {
        message: "getOndcOrderIssues: issue status refresh failed (serving cached issues)",
        orderId: order.id,
        error: refreshErr?.message || refreshErr,
      }, "VENDOR");
    }

    // Re-read after the webhooks may have persisted new events
    issues = await findOndcIssuesForOrder({
      ondcOrderId: order.id,
      corporateUserId: userData.corporateUserId,
      subCorporateUserId: userData.subCorporateId,
    });
  }

  return res.status(200).json({
    status: true,
    message: "Successfully retrieved order issues",
    responseCode: "000",
    data: { rows: issues.map(mapIssueForDto) },
  });
});

/**
 * Raise a new IGM issue (Order Details "Raise an issue" modal). Persists the
 * row BEFORE /issue so a fast Workbench on_issue can ingest against it. If the
 * seller NACKs, the row is deleted so the buyer never sees a fake thread.
 */
exports.raiseOndcIssue = asyncHandler(async (req, res, next) => {
  const { category, subCategory, description, images, clientRequestId } = req.body;
  const userData = ondcCartUserData(req);
  const row = await findOneOndcOrderById({
    id: req.params.id,
    corporateUserId: userData.corporateUserId,
    subCorporateUserId: userData.subCorporateId,
  });
  if (!row) {
    return next(new ErrorResponse("Order not found", 404));
  }
  if (!row.bppUri || !row.orderId) {
    return next(new ErrorResponse("An issue can't be raised on this order yet — missing seller order reference", 400));
  }

  const issueId = uuidv4();
  const now = new Date().toISOString();

  let imageUrls = [];
  try {
    imageUrls = await Promise.all(
      (images || []).map((img) => uploadFile(img.base64, `ondc/issues/${issueId}`, img.format, 2))
    );
  } catch (uploadErr) {
    return next(new ErrorResponse(uploadErr.message || "Failed to upload the attached photo(s)", 400));
  }

  const cfg = await ondc.getOndcConfig().catch(() => null);
  const useIgm2 = igm2.shouldUseIgm2(cfg, row);
  const igmMeta = useIgm2
    ? igm2.seedIgm2OpenSession({
        cfg,
        order: row,
        issueId,
        category,
        subCategory,
        description,
        images: imageUrls,
        now,
      })
    : null;

  const created = await createOndcIssue({
    ondcOrderId: row.id,
    orderId: row.orderId,
    transactionId: row.transactionId,
    corporateUserId: userData.corporateUserId,
    subCorporateUserId: userData.subCorporateId,
    bppId: row.bppId,
    bppUri: row.bppUri,
    issueId,
    category,
    subCategory,
    description,
    igmMeta,
    level: igmMeta ? toWireIssueLevel(igmMeta.level) : null,
    firstEvent: {
      eventType: "OPEN",
      actorType: "COMPLAINANT",
      actorName: "You",
      message: description,
      images: imageUrls,
      sourceAction: "LOCAL_RAISE",
      occurredAt: now,
      dedupeKey: clientRequestId,
    },
  });

  const wait = waitForOnIssue(issueId, { timeoutMs: 15000 });

  try {
    await ondc.issue({
      bppId: row.bppId,
      bppUri: row.bppUri,
      issueId,
      orderId: row.orderId,
      category,
      subCategory,
      description,
      images: imageUrls,
      complainantActions: [{ complainant_action: "OPEN", short_desc: description, updated_at: now }],
      transactionId: row.transactionId,
      ...(useIgm2 ? { igm2Session: igmMeta, wireStatus: "OPEN" } : {}),
    });
  } catch (ondcErr) {
    cancelIssueWait(issueId, "issue_failed");
    await deleteOndcIssue({ id: created.id }).catch(() => {});
    return next(new ErrorResponse(ondcErr.message || "Failed to send this issue to the seller", 502));
  }

  await wait;

  const latest =
    (await findOneOndcIssueById({
      id: created.id,
      corporateUserId: userData.corporateUserId,
      subCorporateUserId: userData.subCorporateId,
    })) || created;

  return res.status(200).json({
    status: true,
    message: "Your issue has been raised with the seller",
    responseCode: "000",
    data: mapIssueForDto(latest),
  });
});

/**
 * Buyer reply on an existing thread — either a substantive reply, or "I
 * can't prove this" (a reply noting the buyer has no further evidence to
 * substantiate the issue — still a normal complainant_action: OPEN, it does
 * NOT close the issue). Blocks replies once the issue has reached a
 * genuinely terminal state.
 */
exports.respondToOndcIssue = asyncHandler(async (req, res, next) => {
  const { message: replyText, cannotProvideProof, images, clientRequestId } = req.body;
  const userData = ondcCartUserData(req);
  const order = await findOneOndcOrderById({
    id: req.params.id,
    corporateUserId: userData.corporateUserId,
    subCorporateUserId: userData.subCorporateId,
  });
  if (!order) {
    return next(new ErrorResponse("Order not found", 404));
  }
  const issue = await findOneOndcIssueById({
    id: req.params.issueId,
    ondcOrderId: order.id,
    corporateUserId: userData.corporateUserId,
    subCorporateUserId: userData.subCorporateId,
  });
  if (!issue) {
    return next(new ErrorResponse("Issue not found", 404));
  }
  if (TERMINAL_ISSUE_STATUSES.includes(issue.status)) {
    return next(new ErrorResponse(`This issue is already ${issue.status.toLowerCase()}`, 400));
  }
  if (!cannotProvideProof && !replyText) {
    return next(new ErrorResponse("message is required", 400));
  }

  // "I can't prove this" is still an OPEN reply — it just tells the seller the
  // buyer has no more evidence; it must never unilaterally close the issue.
  const complainantAction = "OPEN";
  const finalMessage = cannotProvideProof ? "Buyer indicated they cannot provide further proof." : replyText;
  const now = new Date().toISOString();

  // "I can't prove this" carries no evidence by definition; otherwise upload
  // any attached photos to public URLs before the outbound call.
  let imageUrls = [];
  if (!cannotProvideProof) {
    try {
      imageUrls = await Promise.all(
        (images || []).map((img) => uploadFile(img.base64, `ondc/issues/${issue.issueId}`, img.format, 2))
      );
    } catch (uploadErr) {
      return next(new ErrorResponse(uploadErr.message || "Failed to upload the attached photo(s)", 400));
    }
  }

  const priorEvents = await findEventsByIssueId({ ondcIssueId: issue.id });
  const { complainantActions, respondentActions } = buildIssueActionsFromEvents(priorEvents, {
    complainant_action: complainantAction,
    short_desc: finalMessage,
    updated_at: now,
  });

  const wait = waitForOnIssue(issue.issueId, { timeoutMs: 15000 });

  try {
    await ondc.issue({
      bppId: issue.bppId,
      bppUri: issue.bppUri,
      issueId: issue.issueId,
      orderId: issue.orderId,
      category: issue.category,
      subCategory: issue.subCategory,
      images: imageUrls,
      complainantActions,
      respondentActions,
      transactionId: issue.transactionId,
    });
  } catch (ondcErr) {
    cancelIssueWait(issue.issueId, "issue_failed");
    return next(new ErrorResponse(ondcErr.message || "Couldn't send your response to the seller — you can try again", 502));
  }

  await recordOndcIssueEvent({
    ondcIssueId: issue.id,
    eventType: "RESPONSE_RECEIVED",
    actorType: "COMPLAINANT",
    actorName: "You",
    message: finalMessage,
    images: imageUrls,
    sourceAction: "LOCAL_RESPOND",
    occurredAt: now,
    dedupeKey: clientRequestId,
  });

  await wait;

  return res.status(200).json({
    status: true,
    message: "Your response has been sent to the seller",
    responseCode: "000",
    data: {},
  });
});

const loadBuyerIssueOrNext = async (req, next) => {
  const userData = ondcCartUserData(req);
  const order = await findOneOndcOrderById({
    id: req.params.id,
    corporateUserId: userData.corporateUserId,
    subCorporateUserId: userData.subCorporateId,
  });
  if (!order) {
    next(new ErrorResponse("Order not found", 404));
    return null;
  }
  const issue = await findOneOndcIssueById({
    id: req.params.issueId,
    ondcOrderId: order.id,
    corporateUserId: userData.corporateUserId,
    subCorporateUserId: userData.subCorporateId,
  });
  if (!issue) {
    next(new ErrorResponse("Issue not found", 404));
    return null;
  }
  return { order, issue, userData };
};

const performIgm2BuyerAction = async ({
  req,
  next,
  issue,
  order,
  userData,
  code,
  eventType,
  shortDesc,
  wireStatus,
  preferredId = null,
  preferReplacement = false,
  linkResolution = false,
  escalate = false,
  close = false,
}) => {
  const sessionIn = issue.igmMeta && typeof issue.igmMeta === "object" ? issue.igmMeta : null;
  if (!sessionIn || !Array.isArray(sessionIn.actions) || !sessionIn.actions.length) {
    return next(new ErrorResponse("This issue is not on the IGM 2.0 path", 400));
  }
  const cfg = await ondc.getOndcConfig();
  const now = new Date().toISOString();
  let refId;
  let refType;
  if (linkResolution) {
    const chosen = igm2.pickIgm2Resolution(sessionIn.resolutions || issue.resolution, {
      preferredId,
      preferReplacement,
    });
    if (!chosen?.id) {
      return next(new ErrorResponse("No resolution to act on yet", 400));
    }
    refId = chosen.id;
    refType = "RESOLUTIONS";
  }
  const extra = {};
  if (escalate) extra.level = toWireIssueLevel(ISSUE_LEVEL.GRIEVANCE);
  const session = igm2.appendBuyerAction(sessionIn, {
    bapId: cfg.bapId,
    code,
    shortDesc,
    now,
    actorName: order.billing?.name || "You",
    refId,
    refType,
    tags: close
      ? [
          {
            descriptor: { code: "CLOSURE_DETAILS" },
            list: [{ descriptor: { code: "RATING" }, value: "THUMBS_UP" }],
          },
        ]
      : undefined,
    extra,
  });
  if (escalate) session.level = toWireIssueLevel(ISSUE_LEVEL.GRIEVANCE);
  session.level = toWireIssueLevel(session.level);

  await updateOndcIssueFromCallback({
    id: issue.id,
    igmMeta: session,
    level: session.level,
  });

  const wait = waitForOnIssue(issue.issueId, { timeoutMs: 15000 });
  try {
    await ondc.issue({
      bppId: issue.bppId,
      bppUri: issue.bppUri,
      issueId: issue.issueId,
      orderId: issue.orderId,
      category: issue.category,
      igm2Session: session,
      igm2UpdateTarget: true,
      wireStatus,
      transactionId: issue.transactionId,
    });
  } catch (ondcErr) {
    cancelIssueWait(issue.issueId, "issue_failed");
    return next(new ErrorResponse(ondcErr.message || "Failed to send this action to the seller", 502));
  }

  await recordOndcIssueEvent({
    ondcIssueId: issue.id,
    eventType,
    actorType: "COMPLAINANT",
    actorName: "You",
    message: shortDesc,
    sourceAction: "LOCAL_RESPOND",
    occurredAt: now,
    dedupeKey: req.body?.clientRequestId || `local_${code}_${now}`,
  });

  await wait;

  const latest =
    (await findOneOndcIssueById({
      id: issue.id,
      corporateUserId: userData.corporateUserId,
      subCorporateUserId: userData.subCorporateId,
    })) || issue;

  return latest;
};

exports.rejectOndcIssue = asyncHandler(async (req, res, next) => {
  const loaded = await loadBuyerIssueOrNext(req, next);
  if (!loaded) return;
  const { issue, order, userData } = loaded;
  if (issue.status !== ISSUE_STATUS.RESOLUTION_PROPOSED) {
    return next(new ErrorResponse("There is no proposed resolution to reject", 400));
  }
  const latest = await performIgm2BuyerAction({
    req,
    next,
    issue,
    order,
    userData,
    code: "RESOLUTION_REJECTED",
    eventType: ISSUE_STATUS.RESOLUTION_REJECTED,
    shortDesc: req.body?.message || "Buyer rejected the proposed resolution",
    wireStatus: "PROCESSING",
    linkResolution: true,
  });
  if (!latest || latest === true) return;
  return res.status(200).json({
    status: true,
    message: "Resolution rejected",
    responseCode: "000",
    data: mapIssueForDto(latest),
  });
});

exports.escalateOndcIssue = asyncHandler(async (req, res, next) => {
  const loaded = await loadBuyerIssueOrNext(req, next);
  if (!loaded) return;
  const { issue, order, userData } = loaded;
  if (TERMINAL_ISSUE_STATUSES.includes(issue.status)) {
    return next(new ErrorResponse(`This issue is already ${issue.status.toLowerCase()}`, 400));
  }
  const latest = await performIgm2BuyerAction({
    req,
    next,
    issue,
    order,
    userData,
    code: "ESCALATED",
    eventType: ISSUE_STATUS.ESCALATED,
    shortDesc: req.body?.message || "Buyer escalated this issue",
    wireStatus: "OPEN",
    escalate: true,
  });
  if (!latest || latest === true) return;
  return res.status(200).json({
    status: true,
    message: "Issue escalated",
    responseCode: "000",
    data: mapIssueForDto(latest),
  });
});

exports.acceptOndcIssue = asyncHandler(async (req, res, next) => {
  const loaded = await loadBuyerIssueOrNext(req, next);
  if (!loaded) return;
  const { issue, order, userData } = loaded;
  if (issue.status !== ISSUE_STATUS.RESOLUTION_PROPOSED) {
    return next(new ErrorResponse("There is no proposed resolution to accept", 400));
  }
  const resolutionId = req.body?.resolutionId || null;
  const latest = await performIgm2BuyerAction({
    req,
    next,
    issue,
    order,
    userData,
    code: "RESOLUTION_ACCEPTED",
    eventType: ISSUE_STATUS.RESOLUTION_ACCEPTED,
    shortDesc: req.body?.message || "Buyer accepted the proposed resolution",
    wireStatus: "PROCESSING",
    linkResolution: true,
    preferredId: resolutionId,
    preferReplacement: !resolutionId,
  });
  if (!latest || latest === true) return;
  return res.status(200).json({
    status: true,
    message: "Resolution accepted",
    responseCode: "000",
    data: mapIssueForDto(latest),
  });
});

exports.closeOndcIssue = asyncHandler(async (req, res, next) => {
  const loaded = await loadBuyerIssueOrNext(req, next);
  if (!loaded) return;
  const { issue, order, userData } = loaded;
  if (issue.status !== ISSUE_STATUS.RESOLVED && issue.status !== ISSUE_STATUS.RESOLUTION_ACCEPTED) {
    return next(new ErrorResponse("This issue can only be closed after a resolution is accepted", 400));
  }
  const latest = await performIgm2BuyerAction({
    req,
    next,
    issue,
    order,
    userData,
    code: "CLOSED",
    eventType: ISSUE_STATUS.CLOSED,
    shortDesc: req.body?.message || "Buyer closed this issue",
    wireStatus: "CLOSED",
    close: true,
  });
  if (!latest || latest === true) return;
  return res.status(200).json({
    status: true,
    message: "Issue closed",
    responseCode: "000",
    data: mapIssueForDto(latest),
  });
});

/**
 * HTTP wrapper — distinct ONDC domain codes from officeSupplyCategories.
 */
exports.getOndcDomains = asyncHandler(async (req, res) => {
  const domains = await getDistinctOndcDomains();
  return res.status(200).json({
    status: true,
    message: "Successfully retrieved ONDC domains",
    responseCode: "000",
    data: { domains },
  });
});

/** Enabled category/subcategory tree for the corporate office-supplies browse UI. */
exports.getOndcOfficeSupplyCategories = asyncHandler(async (req, res) => {
  const data = await listEnabledTreeForStorefront();
  return res.status(200).json({
    status: true,
    message: "Categories fetched successfully",
    responseCode: "000",
    data,
  });
});

const UNAVAILABLE_ITEM_MESSAGE = "This item is no longer available on Peko. Remove it from your cart to continue.";

/**
 * Cart items Peko no longer lists, as failed seller groups (one per seller) in
 * the same shape validateOndcCart returns for a seller that refused — so the
 * checkout's existing "remove these items" prompt handles them unchanged.
 */
const unavailableCartGroups = (items) => {
  const bySeller = new Map();
  for (const item of items) {
    const key = `${item.bppUri || ""}|${item.ondcVendorId || ""}`;
    if (!bySeller.has(key)) {
      bySeller.set(key, {
        bppId: item.bppId || null,
        bppUri: item.bppUri || null,
        providerId: item.ondcVendorId || null,
        vendorName: item.vendorName || "",
        cartItems: [],
        status: "failed",
        reason: "unavailable",
        quote: null,
        error: { code: null, message: UNAVAILABLE_ITEM_MESSAGE },
      });
    }
    bySeller.get(key).cartItems.push({
      productId: item.productId,
      ondcProductId: item.ondcProductId,
      productName: item.productName,
      productQuantity: parseInt(item.productQuantity) || 1,
    });
  }
  return [...bySeller.values()];
};

/**
 * ONDC office-supplies cart details. Snapshots in the cart JSON are refreshed
 * against the live ondcProducts rows: current price/stock win, and a missing,
 * hidden or zero-stock row marks the item `available: false` (shown under "No longer
 * available" and excluded from totals). Mirrors the legacy /cartDetails shape.
 */
exports.getOndcCartDetails = asyncHandler(async (req, res) => {
  const cart = await getOndcProductsInMyCart(ondcCartUserData(req));

  const emptyPayload = {
    items: [],
    count: 0,
    cartId: 0,
    itemsTotalAmount: 0,
    allowCheckout: false,
    grandTotal: 0,
    totalGst: 0,
    shippingCharge: 0,
    freeDelivery: false,
    eligibleFreeShipping: ELIGIBLE_FREE_SHIPPING,
  };
  if (cart === -1 || !cart.items.length) {
    return res.status(200).json({
      status: true,
      message: "Your cart is empty. Add some items to it!",
      responseCode: "002",
      data: emptyPayload,
    });
  }

  // By row id, else by product identity: a purged-then-re-ingested product lives
  // under a new id, and must not read as "No longer available".
  const rows = await Promise.all(cart.items.map((item) => findOndcProductForCartItem(item)));

  // Point the cart at those new ids, so quantity changes / removals (keyed on
  // productId) keep working. Best-effort — the page still renders if this fails.
  const remaps = cart.items
    .map((item, i) => ({ from: item.productId, to: rows[i]?.id }))
    .filter((r) => r.from != null && r.to != null && String(r.from) !== String(r.to));
  if (remaps.length) {
    try {
      await healOndcCartProductIds(ondcCartUserData(req), remaps);
    } catch (healErr) {
      customLog(req?.LogTraceId, "error", {
        message: "ONDC cart: could not re-point items at their current catalog rows",
        remaps,
        error: healErr?.message || String(healErr),
      }, "VENDOR");
    }
  }

  let itemsTotalAmount = 0;
  let count = 0;
  const items = cart.items.map((item, i) => {
    const row = rows[i];
    const availableQuantity = row ? parseInt(row.availableQuantity) || 0 : 0;
    // A product hidden after it was added (its category disabled, seller
    // blocked, …) moves to "No longer available" with the out-of-stock ones.
    const available = availableQuantity > 0 && isOndcProductListed(row);
    const price = (available ? parseFloat(row.price) : 0) || parseFloat(item.price) || 0;
    const maxPrice =
      (available ? parseFloat(row.maxPrice) : 0) || parseFloat(item.maxPrice) || price;
    // Seller order limits: prefer the live row, fall back to the cart snapshot.
    // Bounded by MAX_ORDER_QUANTITY_PER_ITEM; the effective max (not the raw
    // seller count) is what we return, so the stepper shows the ceiling we enforce.
    const { min: minQuantity, max: quantityCap } = ondcQuantityBounds({
      availableQuantity,
      minQuantity:
        (row && parseInt(row.minQuantity)) || parseInt(item.minQuantity) || 1,
      maxQuantity:
        (row && parseInt(row.maxQuantity)) || parseInt(item.maxQuantity) || null,
    });
    const maxQuantity = quantityCap;
    let productQuantity = parseInt(item.productQuantity) || 1;
    if (available && productQuantity > quantityCap) productQuantity = quantityCap;
    const totalPrice = parseFloat((price * productQuantity).toFixed(2));
    if (available) {
      itemsTotalAmount += totalPrice;
      count += productQuantity;
    }
    return {
      productId: (row && row.id) || item.productId || null,
      // Stable across catalog refreshes (unlike productId, a listing row id) —
      // the key Buy Now scopes checkout by, and the one removeOndcProductsFromCart
      // already matches on.
      ondcProductId: item.ondcProductId || null,
      vendorName: item.vendorName || (row && row.vendorName) || "",
      productName: item.productName,
      image: item.image || "",
      price,
      maxPrice,
      productQuantity,
      availableQuantity,
      minQuantity,
      maxQuantity,
      totalPrice,
      available,
      // Delivery estimate saved at add-to-cart time (from the stored snapshot,
      // not the live listing row) — drives the cart/checkout delivery banner.
      expectedDeliveryDate: item.expectedDeliveryDate ?? null,
      deliveryTat: item.deliveryTat ?? null,
    };
  });

  itemsTotalAmount = parseFloat(itemsTotalAmount.toFixed(2));
  const freeDelivery = itemsTotalAmount >= ELIGIBLE_FREE_SHIPPING;
  const shippingCharge = count === 0 || freeDelivery ? 0 : SHIPPING_CHARGE;
  const grandTotal = count === 0 ? 0 : parseFloat((itemsTotalAmount + shippingCharge).toFixed(2));

  return res.status(200).json({
    status: true,
    message: "Successfully retrieved all products in your cart.",
    responseCode: "000",
    data: {
      items,
      count,
      cartId: cart.cartId,
      itemsTotalAmount,
      allowCheckout: count > 0,
      grandTotal,
      totalGst: 0,
      shippingCharge,
      freeDelivery,
      eligibleFreeShipping: ELIGIBLE_FREE_SHIPPING,
    },
  });
});

/**
 * Validate the ONDC cart with the sellers before checkout: group cart items by
 * seller (bppUri + provider — /select carries ONE provider per order, so the
 * pair is the correct grouping; in practice one provider per seller endpoint),
 * fire a signed /select per group, hold the response until each group's
 * on_select webhook delivers the quote (ondcSelectWaiter), and return the
 * per-seller amount breakup (quote.breakup rows split by @ondc/org/title_type).
 *
 * Partial success is allowed: failed groups (NACK, timeout, not serviceable,
 * missing seller data) are returned with a reason so the client can flag and
 * exclude those items; HTTP stays 200 unless the input/cart itself is invalid.
 *
 * Body: { pincode: "560011", gps?: "12.92,77.58" } — gps falls back to the
 * corporate profile's latLng when omitted.
 */
exports.validateOndcCart = asyncHandler(async (req, res, next) => {
  const pincode = String(req.body?.pincode || "").trim();
  let gps = String(req.body?.gps || "").trim();
  if (!/^\d{6}$/.test(pincode)) {
    return next(new ErrorResponse("A valid 6-digit pincode is required", 422));
  }
  if (!gps) {
    // corporate profile fallback — the use-case queries by credentialId. gps is
    // optional end-to-end: when absent the select goes out with pincode only.
    const corporate = await findCorporateUser({ corporateId: req.user.id });
    gps = String(corporate?.latLng || "").trim();
  }

  const cart = await getOndcProductsInMyCart(ondcCartUserData(req));
  if (cart === -1 || !cart.items.length) {
    return next(new ErrorResponse("Your cart is empty", 409));
  }

  // Buy Now scopes this to a single product; absent/empty = the whole cart.
  // Both /select and /init re-derive their seller groups from the cart, so the
  // same scoping has to happen in both or the order would widen back out.
  const scopedItems = scopeCartItems(cart.items, req.body?.ondcProductIds);
  if (!scopedItems.length) {
    return next(new ErrorResponse("The selected item is no longer in your cart", 409));
  }

  // Products hidden since they were added (category disabled, seller blocked, …)
  // never reach the seller: they come back as failed groups, which the checkout
  // already turns into its "remove these items" prompt.
  const scopedRows = await Promise.all(scopedItems.map((item) => findOndcProductForCartItem(item)));
  const isUnlisted = (i) => !!scopedRows[i] && !isOndcProductListed(scopedRows[i]);
  const unavailableGroups = unavailableCartGroups(scopedItems.filter((_, i) => isUnlisted(i)));

  // Backfill seller-routing fields on snapshots stored before those fields
  // existed on the cart item (bppId/bppUri/ondcVendorId/locationId/fulfillmentId/ondcDomain/city).
  const items = scopedItems
    .map((item, i) => {
      if (isUnlisted(i)) return null;
      if (
        item.bppUri &&
        item.ondcVendorId &&
        item.locationId &&
        item.fulfillmentId &&
        item.ondcDomain
      )
        return item;
      const row = scopedRows[i];
      return {
        ...item,
        bppId: item.bppId || row?.bppId || null,
        bppUri: item.bppUri || row?.bppUri || null,
        ondcVendorId: item.ondcVendorId || row?.ondcVendorId || null,
        locationId: item.locationId || row?.locationId || null,
        fulfillmentId: item.fulfillmentId || row?.fulfillmentId || null,
        ondcDomain: item.ondcDomain || row?.ondcDomain || null,
        city: item.city || (row ? parseCityArray(row.city)[0] : null) || null,
      };
    })
    .filter(Boolean);

  const groups = new Map();
  for (const item of items) {
    const key = `${item.bppUri || ""}|${item.ondcVendorId || ""}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  const groupList = [...groups.values()];

  // This click starts the order flow, so every seller group gets a brand new
  // transaction_id — never the cart snapshot's search id, and never the pinned
  // Workbench one.
  //
  // Reusing an id is what made a second checkout attempt impossible: a receiver
  // tracks the sequence per transaction_id and consumes each step once, so the
  // next /select on an id that already saw one is refused outright with
  // "<select> not supported after <select>". Minting here means each attempt is
  // a fresh flow that stands alone, and select → init → confirm then carry this
  // id forward (initOndcOrder receives it back as a hint).
  const groupTxnIds = groupList.map(() => uuidv4());

  customLog(req?.LogTraceId, "info", {
    message: "validateOndcCart: starting a fresh ONDC order flow",
    sellerCount: groupList.length,
    transactionIds: groupTxnIds,
  });

  const results = await Promise.all(
    groupList.map(async (groupItems, groupIndex) => {
      const first = groupItems[0];
      const seller = {
        bppId: first.bppId || null,
        bppUri: first.bppUri || null,
        providerId: first.ondcVendorId || null,
        vendorName: first.vendorName || "",
        cartItems: groupItems.map((i) => ({
          productId: i.productId,
          ondcProductId: i.ondcProductId,
          productName: i.productName,
          productQuantity: parseInt(i.productQuantity) || 1,
        })),
      };

      if (!first.bppUri || !first.ondcVendorId || !first.locationId) {
        return { ...seller, status: "failed", reason: "missing_seller_data", quote: null, error: null };
      }

      const transactionId = groupTxnIds[groupIndex];
      const wait = waitForOnSelect(transactionId, { timeoutMs: SEARCH_TIMEOUT_MS });
      // Set when the seller refused the /select synchronously. Its own words are
      // the only useful thing to show whoever clicked — a NACK like
      // "<select> not supported after <select>" says exactly what to fix, while
      // the generic timeout it used to become said nothing.
      let sendError = null;
      try {
        await ondc.select({
          bppProviderId: first.ondcVendorId,
          bppLocationId: first.locationId,
          bppId: first.bppId,
          bppUri: first.bppUri,
          domain: first.ondcDomain,
          city: first.city,
          transactionId,
          items: groupItems.map((i) => ({
            id: i.ondcProductId,
            quantity: parseInt(i.productQuantity) || 1,
            locationId: i.locationId,
            fulfillmentId: i.fulfillmentId,
          })),
          gps,
          pinCOde: pincode,
        });
      } catch (selectErr) {
        cancelSelectWait(transactionId, "select_failed");
        sendError = {
          code: selectErr.ondcCode || null,
          message: selectErr.ondcMessage || selectErr.message || "Seller rejected the request",
        };
        customLog(req, "error", {
          message: "validateOndcCart: select failed",
          bppUri: first.bppUri,
          transactionId,
          error: sendError.message,
        }, "VENDOR");
      }

      // A refused send has no on_select coming, so there is nothing to wait for.
      // Awaiting anyway is what turned a millisecond rejection into a 30s hang.
      if (sendError) {
        return {
          ...seller,
          transactionId,
          status: "failed",
          reason: "nack",
          quote: null,
          error: sendError,
        };
      }

      const { received, reason, order, error } = await wait;
      if (!received || !order || error) {
        return {
          ...seller,
          transactionId,
          status: "failed",
          reason: error ? "error" : reason,
          quote: null,
          error: error || null,
        };
      }

      const serviceable = (order.fulfillments || []).every(
        (f) => !f?.state?.descriptor?.code || f.state.descriptor.code === "Serviceable"
      );
      const quote = mapQuote(order.quote, seller.cartItems);
      // Fulfillment serviceability and quote pricing are reported independently
      // by the seller — a "Serviceable" response with no usable price must not
      // count as validated, or a priceless quote silently reaches checkout.
      const priced = quote.total > 0;
      // Real seller-declared TAT, if this bpp already sends it at on_select
      // (some only send it later at on_init/on_confirm — computeExpectedDelivery
      // returns nulls gracefully in that case, same as it already does at confirm).
      const { deliveryTat, expectedDeliveryDate } = computeExpectedDelivery(order);

      return {
        ...seller,
        transactionId,
        status: serviceable && priced ? "validated" : "failed",
        reason: !serviceable ? "not_serviceable" : !priced ? "quote_unpriced" : null,
        quote,
        deliveryTat,
        expectedDeliveryDate,
        error: null,
      };
    })
  );
  results.push(...unavailableGroups);

  const validated = results.filter((g) => g.status === "validated");
  const validatedTotal = parseFloat(
    validated.reduce((sum, g) => sum + (g.quote?.total || 0), 0).toFixed(2)
  );

  // Nothing validated and a seller told us why: answer with its words rather than
  // the 200 envelope, so the storefront toasts the actual reason. Partial success
  // keeps its 200 — one refusing seller must not fail a mixed cart.
  const rejected = results.find((g) => g.reason === "nack" && g.error?.message);
  if (!validated.length && rejected) {
    return next(new ErrorResponse(rejected.error.message, 502));
  }

  return res.status(200).json({
    status: true,
    message:
      validated.length === results.length
        ? "Cart validated with all sellers"
        : validated.length
          ? "Cart partially validated — some sellers could not confirm"
          : "Cart could not be validated with any seller",
    responseCode: validated.length ? "000" : "001",
    data: {
      groups: results,
      validatedTotal,
      allValidated: validated.length === results.length,
      anyValidated: validated.length > 0,
      failedCount: results.length - validated.length,
    },
  });
});

/**
 * On-demand estimated-delivery-date for a SINGLE product (PDP "Get estimated
 * delivery date" button). Scoped-down twin of validateOndcCart: a directed
 * /search for this one item (so the BPP correlates a session), then a /select,
 * then the seller-declared "@ondc/org/TAT" resolved into an absolute date.
 *
 * Delivery location is the office-supplies selected city (`city`, an ONDC
 * "std:<code>") plus a 6-digit Indian PIN (`pincode` / saved-address fallback)
 * and a best-effort `gps`. /select requires `address.area_code`; without a PIN
 * we skip the network call rather than send an empty one. Never fabricates: if
 * the seller returns no serviceable TAT, expectedDeliveryDate is null.
 *
 * This fires on every PDP view and every "Add to Cart" click anywhere a
 * product card renders — including the PDP's own "Similar products" — so
 * against a test harness (optionals.forceTransactionId set) it skips the
 * network entirely and estimates from the stored row's
 * `@ondc/org/time_to_ship` instead: a scenario has no expectation for an
 * unsolicited /select, so each card would only buy a refusal.
 *
 * Body: { ondcProductId (required), quantity?, city (required, "std:<code>"),
 *         gps? "lat,lng", pincode? }
 */
exports.getOndcDeliveryEstimate = asyncHandler(async (req, res, next) => {
  const ondcProductId = String(req.body?.ondcProductId || "").trim();
  const city = String(req.body?.city || "").trim();
  let gps = String(req.body?.gps || "").trim();
  const quantity = parseInt(req.body?.quantity) || 1;

  if (!ondcProductId) {
    return next(new ErrorResponse("ondcProductId is required", 422));
  }
  if (!city) {
    return next(new ErrorResponse("A delivery location (city) is required", 422));
  }

  let product = await findOndcProductDetail({ ondcProductId });
  if (!product) {
    return next(new ErrorResponse(`Product ${ondcProductId} not found`, 404));
  }

  // Workbench test lever: skip the network round-trip entirely. A scripted
  // harness only answers the steps its active scenario expects, and it has no
  // expectation for an out-of-band /select — so every product card rendered
  // would buy one refused round-trip for nothing. Real traffic (flag unset) is
  // untouched below. Never fabricates a date it can't support — same principle
  // as the network path, just computed from the stored row's time_to_ship
  // instead of a live serviceability check.
  const cfg = await ondc.getOndcConfig().catch(() => null);
  if (cfg?.forceTransactionId) {
    const ms = parseIsoDurationMs(product.timeToShip);
    return res.status(200).json({
      status: true,
      message: ms
        ? "Estimated delivery date resolved"
        : "The seller hasn't shared a delivery estimate for this location",
      responseCode: "000",
      data: {
        serviceable: true,
        deliveryTat: product.timeToShip || null,
        expectedDeliveryDate: ms ? new Date(Date.now() + ms) : null,
      },
    });
  }

  let pincode = indianPincode(req.body?.pincode);
  if (!pincode) {
    const addresses = await findAllEcommerceAddresses({ credentialId: req.user.id });
    pincode = pickDefaultAddressPincode(addresses);
  }
  if (!pincode) {
    customLog(req, "info", {
      message: "getOndcDeliveryEstimate: no delivery pincode — skipping /select",
      ondcProductId,
      city,
    }, "VENDOR");
    return res.status(200).json({
      status: true,
      message: "Delivery estimate is unavailable for this location",
      responseCode: "000",
      data: { serviceable: false, deliveryTat: null, expectedDeliveryDate: null },
    });
  }

  if (!gps) {
    const corporate = await findCorporateUser({ corporateId: req.user.id });
    gps = String(corporate?.latLng || "").trim();
  }

  // Reuse the search txn this BPP already answered (stored on the row) so it can
  // correlate the order session with a discovery it actually served.
  const transactionId = product.transactionId || uuidv4();

  // Step 1 — directed /search for this one item; wait for the on_search webhook
  // to upsert a fresh row (price/stock/locationId/fulfillmentId that /select
  // needs). Best-effort: on timeout/failure keep the stored row.
  const searchWait = waitForProducts(transactionId, {
    productId: ondcProductId,
    threshold: 1,
    timeoutMs: SEARCH_TIMEOUT_MS,
  });
  try {
    await ondc.search({
      bppId: product.bppId,
      bppUri: product.bppUri,
      itemId: ondcProductId,
      providerId: product.ondcVendorId,
      domain: product.ondcDomain,
      city,
      transactionId,
    });
  } catch (searchErr) {
    cancelWait(transactionId, "search_failed");
    customLog(req, "warn", {
      message: "getOndcDeliveryEstimate: search failed, using stored row",
      ondcProductId,
      error: searchErr.message,
    }, "VENDOR");
  }
  const refresh = await searchWait;
  if (refresh.received) {
    product = (await findOndcProductDetail({ ondcProductId })) || product;
  }

  if (!product.bppUri || !product.ondcVendorId || !product.locationId) {
    return res.status(200).json({
      status: true,
      message: "Delivery estimate is unavailable for this product",
      responseCode: "000",
      data: { serviceable: false, deliveryTat: null, expectedDeliveryDate: null },
    });
  }

  // Step 2 — /select on the same transaction; hold until the on_select webhook.
  const selectWait = waitForOnSelect(transactionId, { timeoutMs: SEARCH_TIMEOUT_MS });
  try {
    await ondc.select({
      bppProviderId: product.ondcVendorId,
      bppLocationId: product.locationId,
      bppId: product.bppId,
      bppUri: product.bppUri,
      domain: product.ondcDomain,
      city,
      transactionId,
      items: [
        {
          id: ondcProductId,
          quantity,
          locationId: product.locationId,
          fulfillmentId: product.fulfillmentId,
        },
      ],
      gps,
      pinCOde: pincode,
    });
  } catch (selectErr) {
    cancelSelectWait(transactionId, "select_failed");
    customLog(req, "error", {
      message: "getOndcDeliveryEstimate: select failed",
      ondcProductId,
      bppUri: product.bppUri,
      error: selectErr.message,
    }, "VENDOR");
  }

  const { received, order, error } = await selectWait;

  // Step 3 — resolve the seller-declared TAT into an absolute date. Honest
  // fallbacks: no callback / not serviceable / no TAT → null, never invented.
  let serviceable = false;
  let deliveryTat = null;
  let expectedDeliveryDate = null;
  if (received && order && !error) {
    serviceable = (order.fulfillments || []).some(
      (f) => f?.state?.descriptor?.code === "Serviceable"
    );
    if (serviceable) {
      ({ deliveryTat, expectedDeliveryDate } = computeExpectedDelivery(order));
    }
  }

  return res.status(200).json({
    status: true,
    message: expectedDeliveryDate
      ? "Estimated delivery date resolved"
      : "The seller hasn't shared a delivery estimate for this location",
    responseCode: "000",
    data: { serviceable, deliveryTat, expectedDeliveryDate },
  });
});

/**
 * Initialize the ONDC order(s) at Pay time: group the cart by seller
 * (bppUri + provider, same as validateCart), fire a signed /init per group with
 * the buyer's billing + delivery details, and hold until each group's on_init
 * webhook returns the final quote + payment/settlement terms (ondcInitWaiter).
 *
 * Partial success is allowed (same policy as validateCart): failed groups are
 * returned with a reason and the client continues with the initialized ones.
 *
 * Body: {
 *   pincode: "560011",            // delivery/billing pincode (required)
 *   name, phone, addressLine,     // billing contact + house/building line (required)
 *   email?,                       // falls back to the logged-in user's email
 *   gps?,                         // "lat,lng" from the browser; falls back to the
 *                                 // profile latLng. One of the two must resolve to
 *                                 // a real coordinate — the network refuses an
 *                                 // /init whose fulfillment end has no valid gps
 *   groups?: [{ bppUri, providerId, transactionId }]
 *             // txn hints from the select validation, so init runs on the
 *             // SAME transaction the BPP already quoted
 * }
 */
exports.initOndcOrder = asyncHandler(async (req, res, next) => {
  const pincode = String(req.body?.pincode || "").trim();
  const name = String(req.body?.name || "").trim();
  const phone = String(req.body?.phone || "").trim();
  const addressLine = String(req.body?.addressLine || "").trim();
  const email = String(req.body?.email || req.user?.email || "").trim();
  let gps = String(req.body?.gps || "").trim();
  const txnHints = Array.isArray(req.body?.groups) ? req.body.groups : [];

  if (!/^\d{6}$/.test(pincode)) {
    return next(new ErrorResponse("A valid 6-digit pincode is required", 422));
  }
  if (!name || !phone || !addressLine) {
    return next(new ErrorResponse("name, phone and addressLine are required", 422));
  }

  if (!gps) {
    // The browser's location is the primary source (the checkout form sends it
    // alongside the address); this is the fallback for a denied or unavailable one.
    const corporate = await findCorporateUser({ corporateId: req.user.id });
    gps = String(corporate?.latLng || "").trim();
  }

  // The network requires a well-formed coordinate on the fulfillment end location
  // and refuses the whole /init without one, so there is nothing to gain by
  // sending it and waiting: fail here, naming the actual problem. The alternative
  // was a validator dump about a regex, which tells a buyer nothing.
  const normalizedGps = normalizeOndcGps(gps);
  if (!normalizedGps) {
    customLog(req?.LogTraceId, "error", {
      message: "initOndcOrder: refused, no usable delivery coordinate",
      // what we had, so a malformed profile latLng is identifiable
      requestGps: String(req.body?.gps || "").trim() || null,
      resolvedGps: gps || null,
      pincode,
    });
    return next(
      new ErrorResponse(
        "We need your delivery location to place this order. Allow location access in your browser and try again.",
        422
      )
    );
  }
  gps = normalizedGps;

  // City/state for the ONDC billing address — best-effort India Post lookup;
  // a third-party outage must not block checkout.
  let pinCity = "";
  let pinState = "";
  try {
    const resolved = await resolveIndianPincode(pincode);
    pinCity = resolved.city;
    pinState = resolved.state;
  } catch (lookupErr) {
    customLog(req, "warn", {
      message: "initOndcOrder: pincode lookup failed, proceeding without city/state",
      pincode,
      error: lookupErr?.message || lookupErr,
    }, "VENDOR");
  }
  const billing = {
    name,
    building: addressLine,
    locality: "",
    city: pinCity,
    state: pinState,
    country: "IND",
    areaCode: pincode,
    phone,
    email,
  };

  const cart = await getOndcProductsInMyCart(ondcCartUserData(req));
  if (cart === -1 || !cart.items.length) {
    return next(new ErrorResponse("Your cart is empty", 409));
  }

  // Buy Now scopes this to a single product; absent/empty = the whole cart.
  // Both /select and /init re-derive their seller groups from the cart, so the
  // same scoping has to happen in both or the order would widen back out.
  const scopedItems = scopeCartItems(cart.items, req.body?.ondcProductIds);
  if (!scopedItems.length) {
    return next(new ErrorResponse("The selected item is no longer in your cart", 409));
  }

  // Last stop before payment: a product hidden since /select (its category was
  // disabled meanwhile, …) must not be initialised, let alone paid for.
  const scopedRows = await Promise.all(scopedItems.map((item) => findOndcProductForCartItem(item)));
  const unlisted = scopedItems.filter((_, i) => scopedRows[i] && !isOndcProductListed(scopedRows[i]));
  if (unlisted.length) {
    const names = unlisted.map((i) => i.productName).filter(Boolean).join(", ");
    return next(
      new ErrorResponse(
        `${names || "Some items"} ${unlisted.length === 1 ? "is" : "are"} no longer available on Peko. Remove ${unlisted.length === 1 ? "it" : "them"} from your cart to continue.`,
        409
      )
    );
  }

  // Backfill seller-routing fields on snapshots stored before those fields
  // existed on the cart item (bppId/bppUri/ondcVendorId/locationId/fulfillmentId/ondcDomain/city).
  const items = await Promise.all(
    scopedItems.map(async (item, i) => {
      if (
        item.bppUri &&
        item.ondcVendorId &&
        item.locationId &&
        item.fulfillmentId &&
        item.ondcDomain
      )
        return item;
      const row = scopedRows[i];
      return {
        ...item,
        bppId: item.bppId || row?.bppId || null,
        bppUri: item.bppUri || row?.bppUri || null,
        ondcVendorId: item.ondcVendorId || row?.ondcVendorId || null,
        locationId: item.locationId || row?.locationId || null,
        fulfillmentId: item.fulfillmentId || row?.fulfillmentId || null,
        ondcDomain: item.ondcDomain || row?.ondcDomain || null,
        city: item.city || (row ? parseCityArray(row.city)[0] : null) || null,
      };
    })
  );

  const groups = new Map();
  for (const item of items) {
    const key = `${item.bppUri || ""}|${item.ondcVendorId || ""}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  const groupList = [...groups.values()];

  // Continue on the txn /select already validated with this seller — the BPP has
  // quoted on it, and the whole flow validateOndcCart started has to stay on one
  // id through to /confirm. Nothing overrides this hint: the Workbench pin
  // deliberately stops at /search, so the id minted at validate time is the one
  // on the wire here too.
  //
  // Never fall back to the snapshot's search txn: it is shared by every seller a
  // broadcast /search returned, and two groups on one id collide the on_init
  // waiter, the parked init session and the confirm-time lookup.
  const groupTxnIds = assignGroupTransactionIds(
    groupList,
    (groupItems) => {
      const first = groupItems[0];
      const hint = txnHints.find(
        (h) => h && h.bppUri === first.bppUri && h.providerId === first.ondcVendorId
      );
      return hint?.transactionId;
    },
    uuidv4
  );

  const results = await Promise.all(
    groupList.map(async (groupItems, groupIndex) => {
      const first = groupItems[0];
      const seller = {
        bppId: first.bppId || null,
        bppUri: first.bppUri || null,
        providerId: first.ondcVendorId || null,
        vendorName: first.vendorName || "",
        cartItems: groupItems.map((i) => ({
          productId: i.productId,
          ondcProductId: i.ondcProductId,
          productName: i.productName,
          productQuantity: parseInt(i.productQuantity) || 1,
          // seller-declared item policy snapshotted at add-to-cart time — see
          // addOndcProductToCart; carried through so a placed order can still
          // answer "is this cancellable" after ONDC drops these past on_search.
          returnable: i.returnable,
          cancellable: i.cancellable,
          returnWindow: i.returnWindow,
        })),
      };

      if (!first.bppUri || !first.ondcVendorId || !first.locationId) {
        return { ...seller, status: "failed", reason: "missing_seller_data", quote: null, payment: null, error: null };
      }

      const transactionId = groupTxnIds[groupIndex];
      const wait = waitForOnInit(transactionId, { timeoutMs: SEARCH_TIMEOUT_MS });
      // Set when the seller refused the /init synchronously — see validateOndcCart.
      let sendError = null;
      try {
        await ondc.init({
          bppProviderId: first.ondcVendorId,
          bppLocationId: first.locationId,
          bppId: first.bppId,
          bppUri: first.bppUri,
          domain: first.ondcDomain,
          city: first.city,
          transactionId,
          items: groupItems.map((i) => ({
            id: i.ondcProductId,
            quantity: parseInt(i.productQuantity) || 1,
            locationId: i.locationId,
            fulfillmentId: i.fulfillmentId,
          })),
          gps,
          billing,
        });
      } catch (initErr) {
        cancelInitWait(transactionId, "init_failed");
        sendError = {
          code: initErr.ondcCode || null,
          message: initErr.ondcMessage || initErr.message || "Seller rejected the request",
        };
        customLog(req, "error", {
          message: "initOndcOrder: init failed",
          bppUri: first.bppUri,
          transactionId,
          error: sendError.message,
        }, "VENDOR");
      }

      // No on_init is coming for a refused send, so do not hold the waiter open.
      if (sendError) {
        return {
          ...seller,
          transactionId,
          status: "failed",
          reason: "nack",
          quote: null,
          payment: null,
          error: sendError,
        };
      }

      const { received, reason, order, error } = await wait;
      if (!received || !order || error) {
        return {
          ...seller,
          transactionId,
          status: "failed",
          reason: error ? "error" : reason,
          quote: null,
          payment: null,
          error: error || null,
        };
      }

      // Park the raw on_init order for the upcoming /confirm — it must echo
      // this order (quote/payment/billing) verbatim.
      saveInitSession(transactionId, {
        order,
        bppId: first.bppId,
        bppUri: first.bppUri,
        vendorName: first.vendorName || "",
        domain: first.ondcDomain,
        city: first.city,
        gps,
        cartItems: seller.cartItems,
      });

      // on_init is the ONLY place the network hands us this seller's payout
      // account (payment["@ondc/org/settlement_details"]) and tax identity
      // (the bpp_terms tag group). The init session holding it expires in 30
      // minutes, so persist it now — the Easy Split split rule written after
      // /confirm settles against this row. Fully guarded: losing the seller
      // snapshot must never fail the buyer's checkout.
      try {
        const sellerRecord = buildSellerRecord(order, {
          bppId: first.bppId,
          bppUri: first.bppUri,
          providerId: first.ondcVendorId,
          vendorName: first.vendorName,
          domain: first.ondcDomain,
        });
        // Link this checkout's ONDC transaction so payment-time Easy Split can
        // correlate the capture with the on_init settlement snapshot.
        sellerRecord.lastInitTransactionId = transactionId;
        sellerRecord.lastSeenAt = new Date();
        await upsertOndcSeller(sellerRecord);

        // Log the verdict now, at on_init — this is where a seller becomes
        // un-payable, and finding out only at checkout time (when the split is
        // skipped) means digging through a different request's logs.
        customLog(req?.LogTraceId, sellerRecord.splitEligible ? "info" : "error", {
          scope: "easySplit",
          step: "capture-seller",
          message: sellerRecord.splitEligible
            ? "Seller settlement details captured and payable"
            : `Seller settlement details NOT payable (${sellerRecord.ineligibleReason}) — their share will not be split`,
          transactionId,
          bppId: sellerRecord.bppId,
          providerId: sellerRecord.providerId,
          vendorName: sellerRecord.vendorName,
          splitEligible: sellerRecord.splitEligible,
          ineligibleReason: sellerRecord.ineligibleReason,
          settlementType: sellerRecord.settlementType,
          collectedBy: sellerRecord.collectedBy,
          // the raw values the BPP sent, so a rejection is explainable — these are
          // the seller's business payout details, not buyer PII
          settlementBankAccountNo: sellerRecord.settlementBankAccountNo,
          settlementIfscCode: sellerRecord.settlementIfscCode,
          upiAddress: sellerRecord.upiAddress,
          beneficiaryName: sellerRecord.beneficiaryName,
          hasGst: Boolean(sellerRecord.gstNumber),
          hasPan: Boolean(sellerRecord.panNumber),
          bppTermsCount: sellerRecord.bppTerms?.length ?? 0,
        }, "VENDOR", ["settlementBankAccountNo"]);
      } catch (sellerErr) {
        customLog(req?.LogTraceId, "error", {
          scope: "easySplit",
          step: "capture-seller",
          message: "Failed to persist the seller settlement snapshot — the split at /confirm will have no seller row to pay against",
          bppId: first.bppId,
          providerId: first.ondcVendorId,
          transactionId,
          error: sellerErr?.message || String(sellerErr),
          stack: sellerErr?.stack || null,
        }, "VENDOR");
      }

      return {
        ...seller,
        transactionId,
        status: "initialized",
        reason: null,
        quote: mapQuote(order.quote, seller.cartItems),
        // payment/settlement terms from the BPP — the /confirm step echoes these
        payment: order.payment || null,
        error: null,
      };
    })
  );

  const initialized = results.filter((g) => g.status === "initialized");
  const initializedTotal = parseFloat(
    initialized.reduce((sum, g) => sum + (g.quote?.total || 0), 0).toFixed(2)
  );

  // Nothing initialized and a seller said why: surface its words so the buyer sees
  // the real reason instead of a generic failure. Partial success keeps its 200.
  const rejected = results.find((g) => g.reason === "nack" && g.error?.message);
  if (!initialized.length && rejected) {
    return next(new ErrorResponse(rejected.error.message, 502));
  }

  return res.status(200).json({
    status: true,
    message:
      initialized.length === results.length
        ? "Order initialized with all sellers"
        : initialized.length
          ? "Order partially initialized — some sellers could not confirm"
          : "Order could not be initialized with any seller",
    responseCode: initialized.length ? "000" : "001",
    data: {
      groups: results,
      initializedTotal,
      allInitialized: initialized.length === results.length,
      anyInitialized: initialized.length > 0,
      failedCount: results.length - initialized.length,
    },
  });
});

/**
 * Place the ONDC order(s) after a successful /ondc/initOrder: for each
 * initialized seller group, fire a signed /confirm that ECHOES the on_init
 * order parked in the session cache (quote/payment/billing must match) marked
 * PAID, and hold until each group's on_confirm webhook returns the created
 * order (ondcConfirmWaiter).
 *
 * Partial success is allowed (same policy as validate/init): failed groups
 * are returned with a reason. A group whose init session has expired (>30 min)
 * fails with `session_expired` — the client must re-run Pay (init) for it.
 *
 * Body: {
 *   groups: [{ bppUri, providerId, transactionId }],  // initialized groups from /initOrder
 *   paymentRef?                                        // payment gateway reference id
 * }
 */
/**
 * Post-payment outcome for one Cashfree capture (`paymentRef` = corporateTxnId).
 *
 * The placing-order page polls this after payment SUCCESS; PG triggers confirm.
 * Returns:
 *   PENDING   — capture recorded but ondc_orders not written yet (confirm still
 *               running, or not started)
 *   CONFIRMED — at least one ondc_orders row exists for this paymentRef
 *   FAILED    — payment txn itself is FAILURE/REFUNDED (and no orders). Easy
 *               Split failure does NOT mark checkout FAILED — orders place first.
 *
 * Query: ?paymentRef=<corporateTxnId>
 */
exports.getOndcCheckoutResult = asyncHandler(async (req, res, next) => {
  const paymentRef = String(req.query.paymentRef || "").trim();
  if (!paymentRef) {
    return next(new ErrorResponse("paymentRef is required", 400));
  }

  const userData = ondcCartUserData(req);
  const logTraceId = req?.LogTraceId;

  customLog(logTraceId, "info", {
    flow: "ondcCheckoutResult",
    step: "start",
    message: "ONDC checkout-result: looking up outcome by paymentRef",
    paymentRef,
    corporateUserId: userData.corporateUserId || null,
    subCorporateId: userData.subCorporateId || null,
  }, "VENDOR");

  let orders = await findOndcOrdersByPaymentRef({
    paymentRef,
    corporateUserId: userData.corporateUserId,
    subCorporateUserId: userData.subCorporateId,
  });

  // The payment record (written by paymentGateway before the buyer is redirected here) carries
  // the payer's credentialId — orphans and settlement data are only for the caller's own payment.
  const paymentOrder = await findOneOrder({ corporateTxnId: String(paymentRef) });
  const isOwnPayment = Boolean(paymentOrder) && String(paymentOrder.credentialId) === String(req.user.id);

  // Orphan rows: on_confirm persisted with null buyer after a PG context miss.
  // Only claim null-buyer rows for this paymentRef — never another buyer's orders.
  if (!orders.length && isOwnPayment) {
    const orphans = await findOrphanOndcOrdersByPaymentRef({ paymentRef });
    if (orphans.length) {
      try {
        await healOndcOrderBuyer({
          paymentRef,
          corporateUserId: userData.corporateUserId || null,
          subCorporateUserId: userData.subCorporateId || null,
        });
      } catch (healErr) {
        customLog(logTraceId, "error", {
          flow: "ondcCheckoutResult",
          step: "heal-orphan-buyer",
          message: "ONDC checkout-result: failed to heal orphan buyer linkage",
          paymentRef,
          error: healErr?.message || String(healErr),
        }, "VENDOR");
      }
      customLog(logTraceId, "info", {
        flow: "ondcCheckoutResult",
        step: "orphan-orders",
        message: "ONDC checkout-result: using orphan ondc_orders (null buyer) for paymentRef",
        paymentRef,
        orphanCount: orphans.length,
      }, "VENDOR");
      orders = orphans;
    }
  }

  // Settlement may live on the wallet/PG txn (written by paymentGateway after
  // Easy Split) and/or on each ondc_orders.splitStatus.
  let paymentTxn = null;
  let settlementFromPayment = null;
  let ondcConfirm = null;
  let expectedGroupCount = null;
  try {
    paymentTxn = isOwnPayment ? paymentOrder : null;
    if (paymentTxn?.orderResponse) {
      const parsed = typeof paymentTxn.orderResponse === "string"
        ? JSON.parse(paymentTxn.orderResponse)
        : paymentTxn.orderResponse;
      settlementFromPayment = parsed?.settlement || null;
      ondcConfirm = parsed?.ondcConfirm || null;
    }
  } catch (parseErr) {
    customLog(logTraceId, "error", {
      flow: "ondcCheckoutResult",
      step: "payment-lookup",
      message: "ONDC checkout-result: could not parse payment orderResponse",
      paymentRef,
      error: parseErr?.message || String(parseErr),
    }, "VENDOR");
  }

  try {
    const pgOrder = await paymentGatewayOrders.findOne({
      where: { paymentRefId: String(paymentRef) },
      attributes: ["paymentData"],
      raw: true,
    });
    if (pgOrder?.paymentData) {
      const pd = typeof pgOrder.paymentData === "string"
        ? JSON.parse(pgOrder.paymentData)
        : pgOrder.paymentData;
      expectedGroupCount = Array.isArray(pd?.ondcGroups) ? pd.ondcGroups.length : null;
    }
  } catch (_) {
    // diagnostics only
  }

  const buildSettlementFromOrders = (rows) => {
    if (settlementFromPayment?.status) return settlementFromPayment;
    if (!rows.length) return undefined;
    const statuses = rows.map((r) => r.splitStatus).filter(Boolean);
    if (!statuses.length) return undefined;
    const skipped = rows
      .filter((r) => r.splitStatus && r.splitStatus !== "SPLIT")
      .map((r) => ({
        seller: r.vendorName || r.providerId || r.bppId || "seller",
        providerId: r.providerId || null,
        amount: parseFloat(r.splitAmount || r.totalAmount || 0) || 0,
        reason: r.splitError || r.splitStatus,
      }));
    const splitRows = rows.filter((r) => r.splitStatus === "SPLIT");
    const splitTotal = parseFloat(
      splitRows.reduce((sum, r) => sum + (parseFloat(r.splitAmount) || 0), 0).toFixed(2)
    );
    let status = "SKIPPED";
    if (statuses.every((s) => s === "SPLIT")) status = "SPLIT";
    else if (statuses.some((s) => s === "SPLIT") && skipped.length) status = "PARTIAL";
    else if (statuses.some((s) => s === "FAILED") && !splitRows.length) status = "FAILED";
    return {
      status,
      splitCount: splitRows.length,
      splitTotal,
      skipped,
    };
  };

  // Confirm-after-payment checkouts (services/ondcConfirmAfterPayment.js) are answered
  // from their per-seller attempts: which sellers confirmed, which are still pending,
  // which failed and why, and the refund of what could not be placed. Checkouts that
  // predate that flow have no checkout row and fall through to the row-based answer.
  let confirmSummary = null;
  try {
    confirmSummary = await findCheckoutConfirmSummary(paymentRef);
    if (confirmSummary && ownsCheckout(confirmSummary.checkout, userData)) {
      // The placing-order page polls every 3 s, and this poll is what settles the
      // checkout: it times out a seller silent past its deadline, completes the
      // checkout (refunding what no seller placed) and retries what did not go
      // through. Required here, not at the top, for the same reason as the webhook:
      // the flow pulls in the gateway, mail and ONDC transport modules.
      try {
        const { settleCheckoutOnPoll } = require("../../services/ondcConfirmAfterPayment");
        await settleCheckoutOnPoll({ paymentRef, logTraceId });
        confirmSummary = await findCheckoutConfirmSummary(paymentRef);
      } catch (settleErr) {
        customLog(logTraceId, "error", {
          flow: "ondcCheckoutResult",
          step: "confirm-settle",
          message: "ONDC checkout-result: could not settle the checkout — answering from what is recorded",
          paymentRef,
          error: settleErr?.message || String(settleErr),
        }, "VENDOR");
      }
    }
  } catch (summaryErr) {
    customLog(logTraceId, "error", {
      flow: "ondcCheckoutResult",
      step: "confirm-summary",
      message: "ONDC checkout-result: could not read confirm attempts — using the row-based answer",
      paymentRef,
      error: summaryErr?.message || String(summaryErr),
    }, "VENDOR");
  }
  if (confirmSummary && ownsCheckout(confirmSummary.checkout, userData)) {
    const data = buildCheckoutResultFromAttempts({
      paymentRef,
      checkout: confirmSummary.checkout,
      attempts: confirmSummary.attempts,
      rows: orders,
      paymentModeResponse: paymentTxn?.paymentModeResponse || null,
      settlement: buildSettlementFromOrders(orders),
    });
    customLog(logTraceId, data.status === "FAILED" ? "error" : "info", {
      flow: "ondcCheckoutResult",
      step: "result",
      message: `ONDC checkout-result: ${data.status} (confirm attempts)`,
      paymentRef,
      attemptCount: confirmSummary.attempts.length,
      failedCount: data.failedCount,
      refundStatus: data.refund?.status || null,
      refundAmount: data.refund?.amount || 0,
    }, "VENDOR");
    return res.status(200).json({
      status: true,
      message:
        data.status === "PENDING"
          ? "Checkout still in progress"
          : data.status === "FAILED"
            ? "Checkout failed"
            : "Checkout result retrieved",
      responseCode: data.status === "FAILED" ? "001" : "000",
      data,
    });
  }

  if (!orders.length) {
    const txnStatus = String(paymentTxn?.status || "").toUpperCase();
    const paymentFailed = ["FAILURE", "FAILED", "REFUNDED"].includes(txnStatus);
    const confirmFailed = String(ondcConfirm?.status || "").toUpperCase() === "FAILED";

    // Settlement runs after confirm — never treat Easy Split failure as "no order".
    if (paymentFailed || confirmFailed) {
      customLog(logTraceId, "error", {
        flow: "ondcCheckoutResult",
        step: "result",
        message: confirmFailed
          ? "ONDC checkout-result: FAILED (no orders; BPP confirm failed)"
          : "ONDC checkout-result: FAILED (no orders; payment failed/refunded)",
        paymentRef,
        txnStatus: txnStatus || null,
        ondcConfirmStatus: ondcConfirm?.status || null,
        ondcConfirmReasons: ondcConfirm?.reasons || null,
        settlementStatus: settlementFromPayment?.status || null,
        expectedGroupCount,
      }, "VENDOR");
      return res.status(200).json({
        status: true,
        message: "Checkout failed",
        responseCode: "001",
        data: {
          paymentRef,
          status: "FAILED",
          groups: [],
          confirmedTotal: 0,
          amountPaidTotal: 0,
          allConfirmed: false,
          anyConfirmed: false,
          failedCount: 0,
          settlement: settlementFromPayment || undefined,
        },
      });
    }

    let orphanCount = 0;
    try {
      const orphans = await findOrphanOndcOrdersByPaymentRef({ paymentRef });
      orphanCount = orphans?.length || 0;
    } catch (_) {
      // diagnostics only
    }

    customLog(logTraceId, "info", {
      flow: "ondcCheckoutResult",
      step: "pending-diagnostics",
      message: "ONDC checkout-result: PENDING (no ondc_orders yet for this paymentRef)",
      paymentRef,
      txnStatus: txnStatus || null,
      settlementStatus: settlementFromPayment?.status || null,
      scopedOrderCount: 0,
      orphanCount,
      expectedGroupCount,
      confirmOutcome: ondcConfirm || null,
    }, "VENDOR");

    return res.status(200).json({
      status: true,
      message: "Checkout still in progress",
      responseCode: "000",
      data: {
        paymentRef,
        status: "PENDING",
        groups: [],
        confirmedTotal: 0,
        allConfirmed: false,
        anyConfirmed: false,
        failedCount: 0,
        settlement: settlementFromPayment || undefined,
      },
    });
  }

  const groups = orders.map((row) => ({
    bppId: row.bppId || null,
    bppUri: row.bppUri || null,
    providerId: row.providerId || null,
    vendorName: row.vendorName || "",
    cartItems: row.items || [],
    transactionId: row.transactionId || undefined,
    status: "confirmed",
    reason: null,
    quote: row.quote || null,
    deliveryTat: row.deliveryTat || null,
    expectedDeliveryDate: row.expectedDeliveryDate || null,
    orderState: row.orderState || null,
    orderId: row.orderId || null,
    payment: row.payment || null,
    error: null,
  }));

  const confirmedTotal = parseFloat(
    orders
      .reduce((sum, o) => sum + (parseFloat(o.quote?.total) || parseFloat(o.totalAmount) || 0), 0)
      .toFixed(2)
  );
  const amountPaidTotal = parseFloat(
    orders.reduce((sum, o) => sum + (parseFloat(o.amountPaid) || parseFloat(o.totalAmount) || 0), 0).toFixed(2)
  );
  const settlement = buildSettlementFromOrders(orders);
  const confirmedAt = orders[0]?.createdAt
    ? new Date(orders[0].createdAt).toISOString()
    : new Date().toISOString();

  customLog(logTraceId, "info", {
    flow: "ondcCheckoutResult",
    step: "result",
    message: "ONDC checkout-result: CONFIRMED",
    paymentRef,
    orderCount: orders.length,
    confirmedTotal,
    amountPaidTotal,
    settlementStatus: settlement?.status || null,
  }, "VENDOR");

  return res.status(200).json({
    status: true,
    message: "Checkout result retrieved",
    responseCode: "000",
    data: {
      paymentRef,
      status: "CONFIRMED",
      groups,
      confirmedTotal,
      amountPaidTotal,
      allConfirmed: true,
      anyConfirmed: true,
      failedCount: 0,
      confirmedAt,
      settlement,
    },
  });
});

exports.confirmOndcOrder = asyncHandler(async (req, res, next) => {
  const groups = Array.isArray(req.body?.groups) ? req.body.groups.filter(Boolean) : [];
  const paymentRef = String(req.body?.paymentRef || "").trim() || undefined;

  // paymentRef drives a Cashfree refund and the Easy Split coordinator, so it must be the caller's own payment
  if (paymentRef) {
    const paymentOrder = await findOneOrder({ corporateTxnId: paymentRef });
    if (!paymentOrder || String(paymentOrder.credentialId) !== String(req.user.id)) {
      return next(new ErrorResponse("Payment not found", 404));
    }
  }

  if (!groups.length) {
    return next(new ErrorResponse("groups (from the init response) are required", 422));
  }

  // Coordinate Easy Split: expect one on_confirm per group, then one split write.
  if (paymentRef) {
    registerCheckout(paymentRef, groups.length, req?.LogTraceId);
  }

  // buyer linkage for the persisted order rows (cart semantics)
  const userData = ondcCartUserData(req);

  const results = await Promise.all(
    groups.map(async (group) => {
      const transactionId = group.transactionId;
      const seller = {
        bppId: null,
        bppUri: group.bppUri || null,
        providerId: group.providerId || null,
        vendorName: "",
        cartItems: [],
      };

      const session = transactionId ? getInitSession(transactionId) : undefined;
      if (!session) {
        return {
          ...seller,
          transactionId: transactionId || null,
          status: "failed",
          reason: "session_expired",
          orderState: null,
          orderId: null,
          quote: null,
          payment: null,
          error: null,
        };
      }
      seller.bppId = session.bppId || null;
      seller.bppUri = session.bppUri || seller.bppUri;
      seller.vendorName = session.vendorName || "";
      seller.cartItems = session.cartItems || [];

      const wait = waitForOnConfirm(transactionId, { timeoutMs: SEARCH_TIMEOUT_MS });
      try {
        await ondc.confirm({
          bppId: session.bppId,
          bppUri: session.bppUri,
          domain: session.domain,
          city: session.city,
          transactionId,
          initOrder: session.order,
          paymentRef,
        });
      } catch (confirmErr) {
        cancelConfirmWait(transactionId, "confirm_failed");
        customLog(req, "error", {
          message: "confirmOndcOrder: confirm failed",
          bppUri: session.bppUri,
          error: confirmErr.message,
        }, "VENDOR");
      }

      const { received, reason, order, error } = await wait;
      if (!received || !order || error) {
        return {
          ...seller,
          transactionId,
          status: "failed",
          reason: error ? "error" : reason,
          orderState: null,
          orderId: null,
          quote: null,
          payment: null,
          error: error || null,
        };
      }

      // Order placed — the parked init session has served its purpose.
      clearInitSession(transactionId);

      const quote = mapQuote(order.quote, seller.cartItems);
      const { deliveryTat, expectedDeliveryDate } = computeExpectedDelivery(order);

      // Persist the confirmed order + settlement terms. A DB hiccup must not
      // fail the response (the order IS placed with the seller) but is logged
      // loudly — a missing row needs manual reconciliation.
      try {
        const payment = order.payment || {};
        const settlement = payment["@ondc/org/settlement_details"]?.[0] || {};
        await createOndcOrder({
          transactionId,
          orderId: order.id || null,
          orderState: order.state || null,
          corporateUserId: userData.corporateUserId || null,
          subCorporateUserId: userData.subCorporateId || null,
          bppId: session.bppId || null,
          bppUri: session.bppUri || null,
          providerId: group.providerId || order.provider?.id || null,
          vendorName: seller.vendorName || "",
          domain: session.domain || null,
          city: session.city || null,
          deliveryTat,
          expectedDeliveryDate,
          totalAmount: quote.total,
          currency: quote.currency,
          // Our own capture, not the BPP's echo of its pay-on-fulfilment terms —
          // see resolveBuyerPayment in utils/ondc_helper.js.
          ...resolveBuyerPayment(payment, paymentRef),
          settlementBasis: payment["@ondc/org/settlement_basis"] || null,
          settlementWindow: payment["@ondc/org/settlement_window"] || null,
          withholdingAmount: payment["@ondc/org/withholding_amount"] || null,
          settlementType: settlement.settlement_type || null,
          upiAddress: settlement.upi_address || null,
          settlementBankAccountNo: settlement.settlement_bank_account_no || null,
          settlementIfscCode: settlement.settlement_ifsc_code || null,
          beneficiaryName: settlement.beneficiary_name || null,
          bankName: settlement.bank_name || null,
          branchName: settlement.branch_name || null,
          items: stampBuyerFinderFee(seller.cartItems, order.payment),
          quote,
          cancellationTerms: order.cancellation_terms || null,
          billing: order.billing || null,
          fulfillments: order.fulfillments || null,
          payment: order.payment || null,
        });
      } catch (persistErr) {
        customLog(req, "error", {
          message: "confirmOndcOrder: failed to persist confirmed order — needs manual reconciliation",
          transactionId,
          orderId: order.id || null,
          bppUri: session.bppUri,
          error: persistErr?.message || persistErr,
        }, "VENDOR");
      }

      // NOTE: confirmed sellers' items are removed from the cart ONCE after the
      // Promise.all below (single write — the cart is one row, so per-group
      // parallel removes would race and clobber each other).

      return {
        ...seller,
        transactionId,
        status: "confirmed",
        reason: null,
        orderState: order.state || null,
        orderId: order.id || null,
        quote,
        // surfaced so the post-loop confirmation email can render the
        // "Delivering to" line (billing is a local of this success branch,
        // otherwise out of scope after Promise.all)
        billing: order.billing || null,
        payment: order.payment || null,
        error: null,
      };
    })
  );

  const confirmed = results.filter((g) => g.status === "confirmed");
  const confirmedTotal = parseFloat(
    confirmed.reduce((sum, g) => sum + (g.quote?.total || 0), 0).toFixed(2)
  );

  const platformFeeTotal = await computeOfficeSupplyPlatformFee(req, confirmedTotal);
  try {
    await persistCheckoutPaymentTotals(req, confirmed, confirmedTotal, platformFeeTotal);
  } catch (feePersistErr) {
    customLog(req, "error", {
      message: "confirmOndcOrder: failed to persist platform fee / amount paid",
      error: feePersistErr?.message || feePersistErr,
    }, "VENDOR");
  }
  const amountPaidTotal = parseFloat((confirmedTotal + platformFeeTotal).toFixed(2));

  // The buyer paid via Cashfree BEFORE this /confirm ran (ONDC requires the order
  // to be echoed back marked PAID), so anything the sellers wouldn't take has to
  // go back. Refund proportionally off what Cashfree actually captured rather than
  // summing the failed groups' quotes: that stays correct when a coupon reduced
  // the capture, and it works for `session_expired` groups whose quote we no
  // longer hold. Fully guarded — the confirmed orders ARE placed, so a refund
  // problem must never fail this response.
  if (paymentRef && confirmed.length !== results.length) {
    try {
      const order = await findOneOrder({ corporateTxnId: String(paymentRef) });
      const chargedTotal = parseFloat(order?.baseAmount) || 0;
      if (!order || chargedTotal <= 0) {
        throw new Error(
          `no payment record for paymentRef ${paymentRef} (charged=${chargedTotal})`
        );
      }
      const undeliveredRatio = Math.max(0, chargedTotal - amountPaidTotal) / chargedTotal;
      const refund = await cancelPGTransaction(String(paymentRef), {
        // This capture is on the cashfree_ondc merchant, not the shared PG one — a
        // Cashfree order only exists on the merchant it was created against.
        isOndc: true,
        // A total failure refunds the whole capture — let cancelPGTransaction take
        // its default full-refund path so the audit trail stays the simple one.
        ...(confirmed.length && {
          refundAmount: parseFloat((chargedTotal * undeliveredRatio).toFixed(2)),
        }),
        reason: confirmed.length
          ? "ONDC partial confirm failure"
          : "ONDC confirm failed",
      });
      customLog(req, refund?.status ? "info" : "error", {
        message: refund?.status
          ? "confirmOndcOrder: refund initiated for the unconfirmed share"
          : "confirmOndcOrder: refund could NOT be initiated — needs manual reconciliation",
        paymentRef,
        chargedTotal,
        amountPaidTotal,
        undeliveredRatio: parseFloat(undeliveredRatio.toFixed(4)),
        failedCount: results.length - confirmed.length,
        refundStatus: refund?.refundStatus || null,
        refundMessage: refund?.message || null,
      }, "VENDOR");

      if (refund?.status) {
        publishJournalEvent(
          {
            transactionRef: paymentRef,
            type: "refund",
            contextSnapshot: {
              credentialId: req?.user?.id || null,
              registeredBy: req?.user?.registeredBy || null,
              reason: confirmed.length
                ? "ONDC partial confirm failure"
                : "ONDC confirm failed",
            },
            amounts: {
              refundAmount: parseFloat((chargedTotal * undeliveredRatio).toFixed(2)),
              totalOrderAmount: chargedTotal,
            },
          },
          req?.LogTraceId
        );
      }
    } catch (refundErr) {
      customLog(req, "error", {
        message: "confirmOndcOrder: refund for the unconfirmed share threw — needs manual reconciliation",
        paymentRef,
        amountPaidTotal,
        failedCount: results.length - confirmed.length,
        error: refundErr?.message || refundErr,
      }, "VENDOR");
    }
  }

  // Easy Split safety net (background): on_confirm may already have written the
  // split via the coordinator; finalize covers timeouts / partial confirms.
  // Never await — create vendor + splitOrder must not delay confirm SUCCESS.
  if (paymentRef && confirmed.length) {
    const confirmedForSplit = confirmed;
    const logTraceId = req?.LogTraceId;
    setImmediate(() => {
      finalizeEasySplit(paymentRef, confirmedForSplit, logTraceId)
        .then((settlement) => {
          customLog(logTraceId, settlement?.status === "FAILED" ? "error" : "info", {
            scope: "easySplit",
            step: "confirm-finalize-bg",
            message: "Easy Split finalize after confirm (background safety net)",
            paymentRef,
            confirmedCount: confirmedForSplit.length,
            settlementStatus: settlement?.status || null,
          }, "VENDOR");
        })
        .catch((splitErr) => {
          customLog(logTraceId, "error", {
            scope: "easySplit",
            step: "confirm-finalize-bg",
            message: "Easy Split finalize threw in background — orders are placed; needs manual payout check",
            paymentRef,
            error: splitErr?.message || String(splitErr),
          }, "VENDOR");
        });
    });
  }

  // Remove the confirmed sellers' items from the cart in ONE write — the cart
  // is a single row, so per-group parallel removes would race and clobber each
  // other. Best-effort: a cart-cleanup failure must not fail the response
  // (orders are already placed). Failed groups keep their items for retry.
  try {
    const orderedItems = confirmed.flatMap((g) =>
      (g.cartItems || []).map((ci) => ({
        ondcProductId: ci.ondcProductId,
        bppUri: g.bppUri,
        ondcVendorId: g.providerId,
      }))
    );
    if (orderedItems.length) {
      // removeOndcProductsFromCart maps { corporateId, subCorporateId } onto the
      // corporateUserId/subCorporateUserId columns — a different key shape than
      // ondcCartUserData returns, so bridge it here.
      await removeOndcProductsFromCart(orderedItems, {
        corporateId: userData.corporateUserId,
        subCorporateId: userData.subCorporateId,
      });
    }
  } catch (removeErr) {
    customLog(req, "error", {
      message: "confirmOndcOrder: failed to remove confirmed cart items",
      error: removeErr?.message || removeErr,
    }, "VENDOR");
  }

  // Notify the corporate of the checkout outcome — one email per checkout,
  // confirmed OR failed. Fire-and-forget and fully guarded: a mail/lookup/
  // template failure must never affect the already-placed order or the 200
  // response below (the emailer itself also swallows SMTP errors).
  try {
    // findCorporateUser (findOne) matches on credentialId, and req.user.id IS the
    // credential id (see the two existing call sites in this file + jwtToken.js) —
    // req.user.corporateId is the corporate PK used for order ownership, NOT a
    // credentialId. For a sub-user-placed order this won't resolve a corporate
    // (its credential isn't a corporateUser) and the email is simply skipped.
    const corporate = await findCorporateUser({ corporateId: req.user.id });
    const to = corporate?.email;
    if (to) {
      const name = corporate?.contactPersonName || corporate?.name || "there";
      const templateDetails = corporate?.registeredBy
        ? await fetchPartnerDetails(corporate.registeredBy)
        : await partnerLogos();
      let subject;
      let body;
      if (confirmed.length) {
        // Built from the PERSISTED rows, not from the confirm results, and through
        // the same builder the PG-direct path uses (services/ondcCheckoutNotify.js)
        // — the spec's confirmation carries an item table, seller, address and ETA,
        // none of which the in-flight group objects hold. Two call sites, one mail.
        const rows = await findOndcOrdersByTransactionIds(
          confirmed.map((g) => g.transactionId).filter(Boolean)
        );
        ({ subject, body } = await buildOrderConfirmedMail({
          rows: rows.length ? rows : confirmed,
          name,
          corporate,
          templateDetails,
          // The confirmation now carries the payment receipt lines the spec
          // revision folded in from the deleted template 2.
          txn: paymentRef ? await findOneOrder({ corporateTxnId: String(paymentRef) }) : null,
        }));
      } else {
        subject = "We couldn't place your Peko order";
        body = ondcOrderFailedTemplate(name, results, templateDetails);
      }
      emailer.email(to, subject, body, () =>
        customLog(req, "info", { message: "confirmOndcOrder: order email sent", to }));
    }
  } catch (mailErr) {
    customLog(req, "error", {
      message: "confirmOndcOrder: failed to send order confirmation email",
      error: mailErr?.message || mailErr,
    }, "VENDOR");
  }

  return res.status(200).json({
    status: true,
    message:
      confirmed.length === results.length
        ? "Order placed with all sellers"
        : confirmed.length
          ? "Order partially placed — some sellers could not confirm"
          : "Order could not be placed with any seller",
    responseCode: confirmed.length ? "000" : "001",
    data: {
      groups: results,
      confirmedTotal,
      amountPaidTotal,
      allConfirmed: confirmed.length === results.length,
      anyConfirmed: confirmed.length > 0,
      failedCount: results.length - confirmed.length,
    },
  });
});

/** Increase/decrease an ONDC cart item's quantity by 1. */
exports.updateOndcCartProduct = asyncHandler(async (req, res, next) => {
  const { productId, operation } = req.body;
  if (!productId || !["increase", "decrease"].includes(operation)) {
    return next(new ErrorResponse("productId and a valid operation are required", 400));
  }

  const result = await updateOndcProductInCart(productId, operation, ondcCartUserData(req));
  if (result === -1) return next(new ErrorResponse("Your cart is empty now!", 404));
  if (result === -2) return next(new ErrorResponse("Product not available in your cart", 400));
  if (result === -3) return next(new ErrorResponse("Cannot add more items of this product", 409));
  if (!result) {
    return next(new ErrorResponse("Something went wrong while updating the cart", 500));
  }
  return res.status(200).json({
    status: true,
    message: "Product updated successfully",
    data: { newCartProduct: result },
    responseCode: "000",
  });
});

/**
 * Remove an ONDC item from the cart. With `?clearUnavailable=true` it instead
 * removes ALL no-longer-purchasable items in one call — the cart's "No longer
 * available" clear button uses this because legacy snapshots may have no
 * `productId` and can never be addressed by the per-item delete below.
 */
exports.deleteOndcCartProduct = asyncHandler(async (req, res, next) => {
  const productId = req.query.productId;
  const clearUnavailable = req.query.clearUnavailable === "true";

  if (clearUnavailable) {
    const result = await clearUnavailableOndcProductsInCart(ondcCartUserData(req));
    if (result === false) {
      return next(new ErrorResponse("Something went wrong while clearing unavailable items", 500));
    }
    const removed = result === -1 ? 0 : result.removed;
    customLog(req?.LogTraceId, "info", {
      message: "ONDC cart: cleared unavailable items",
      credentialId: req?.user?.id,
      removed,
    });
    return res.status(200).json({
      status: true,
      message: removed
        ? "Unavailable products removed from the cart"
        : "No unavailable products in your cart",
      data: { removed },
      responseCode: "000",
    });
  }

  if (!productId) {
    return next(new ErrorResponse("Missing 'productId' in the request. Please provide a valid productId.", 400));
  }

  const result = await deleteOndcProductInCart(productId, ondcCartUserData(req));
  if (result === -2) return next(new ErrorResponse("Product not available in your cart", 404));
  if (!result && result !== -1) {
    return next(new ErrorResponse("Something went wrong while deleting product from the cart", 500));
  }
  return res.status(200).json({
    status: true,
    message: result === -1 ? "Your cart is empty now" : "Product deleted from the cart successfully",
    data: {},
    responseCode: "000",
  });
});

exports.getEcommerceAddresses = asyncHandler(async (req, res) => {
  const credentialId = req.user.id;
  const result = await findAllEcommerceAddresses({ credentialId });

  return res.status(200).json({
    status: true,
    data: { addressDetails: result || [] },
    message: "All ecommerce addresses retrieved successfully.",
    responseCode: "000",
  });
});

exports.saveEcommerceAddress = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id;
  const { name, addressLine1, addressLine2, phoneNumber, email, zipCode, nickname, city, state } = req.body;

  if (!name || !addressLine1 || !phoneNumber || !zipCode) {
    return next(new ErrorResponse("name, addressLine1, phoneNumber and zipCode are required", 400));
  }

  // Prevent duplicate address records for the same user
  const existing = await findEcommerceAddressByFields({
    credentialId,
    addressLine1,
    zipCode,
  });

  if (existing) {
    return res.status(200).json({
      status: true,
      data: existing,
      message: "Address already saved.",
      responseCode: "000",
    });
  }

  const result = await createEcommerceAddress({
    credentialId,
    name,
    addressLine1,
    addressLine2: addressLine2 || null,
    phoneNumber,
    email: email || null,
    zipCode,
    nickname: nickname || null,
    city: city || null,
    state: state || null,
    country: "India",
  });

  return res.status(200).json({
    status: true,
    data: result,
    message: "Address saved successfully.",
    responseCode: "000",
  });
});
