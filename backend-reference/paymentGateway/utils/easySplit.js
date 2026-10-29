const crypto = require("crypto");
const { default: axios } = require("axios");

const { findServiceOperatorByAccessKey } = require("./checkAndFetchServiceDetails");
const { customLog } = require("./loggerHelper");
const operatorsData = require("./operatorsData.json");
const { findByName } = require("../models/use-cases/setting");
const { isPlaceholder } = require("./ondcSeller");

/**
 * `cashfree_ondc` is the service operator holding the Cashfree credentials used
 * for the ONDC flow — both the payment gateway and Easy Split. Its
 * `serviceStatus` boolean doubles as the admin on/off switch for splitting.
 */
const ONDC_ACCESS_KEY = operatorsData["cashFreeOndc"]["accessKey"];

/**
 * Easy Split's vendor + split APIs are versioned independently of the PG order
 * APIs, so this is pinned rather than read from `vendor.optional3` (which is
 * whatever the create-order path needs). Matches Cashfree Easy Split recipes.
 */
const EASY_SPLIT_API_VERSION = "2022-09-01";

/** Tunables an admin can change without a deploy — `settings` row ONDC_EASY_SPLIT. */
const SETTINGS_NAME = "ONDC_EASY_SPLIT";
const DEFAULT_SETTINGS = {
  // null = omit schedule_option on Create Vendor so Cashfree uses the merchant
  // account default settlement cycle (T+21 on our PG). Explicit positive IDs
  // (1=T+1, 2=T+2, …) may still be set via the ONDC_EASY_SPLIT settings row.
  scheduleOption: null,
  verifyAccount: true,
  dashboardAccess: false,
  accountType: "Proprietorship",
  // Exact value from Cashfree "List of business types"
  businessType: "Retail and Shopping",
  // ONDC gives us no seller contact; these stand in so vendor creation can pass
  // Cashfree's required fields.
  vendorEmailTemplate: "easysplit+{slug}@peko.one",
  vendorPhone: "9999999999",
};

// Secrets never reach the log; bank account numbers are logged as a last-4
// preview instead (see `tail4`) so a rejected vendor is still diagnosable.
const MASK_FIELDS = ["x-client-secret", "clientSecret", "account_number", "settlementBankAccountNo"];

/**
 * Every log from this module carries `scope: "easySplit"` and a `step` so a
 * failed settlement can be traced end to end by filtering on those two fields.
 */
const log = (logTraceId, level, data) =>
  customLog(logTraceId, level, { scope: "easySplit", ...data }, "VENDOR", MASK_FIELDS);

/** Last 4 of an account number — enough to tell "wrong account" from "garbage". */
const tail4 = (value) => {
  const raw = String(value ?? "");
  if (!raw) return null;
  return raw.length <= 4 ? `••${raw}` : `••••${raw.slice(-4)}`;
};

/** What we can safely say about a seller in a log line. */
const sellerContext = (seller = {}) => ({
  sellerRowId: seller.id ?? null,
  bppId: seller.bppId ?? null,
  providerId: seller.providerId ?? null,
  vendorName: seller.vendorName ?? null,
  settlementType: seller.settlementType ?? null,
  accountNoTail: tail4(seller.settlementBankAccountNo),
  ifsc: seller.settlementIfscCode ?? null,
  upiAddress: seller.upiAddress ?? null,
  splitEligible: seller.splitEligible ?? null,
  ineligibleReason: seller.ineligibleReason ?? null,
  cashfreeVendorId: seller.cashfreeVendorId ?? null,
  cashfreeVendorStatus: seller.cashfreeVendorStatus ?? null,
});

/** Normalised view of an axios failure — the bit that actually tells you why. */
const errorContext = (error) => ({
  httpStatus: error?.response?.status ?? null,
  cashfreeCode: error?.response?.data?.code ?? error?.response?.data?.type ?? null,
  cashfreeMessage:
    error?.response?.data?.message ?? error?.response?.data?.error_description ?? null,
  cashfreeBody: error?.response?.data ?? null,
  error: error?.message ?? String(error),
});

/**
 * Cashfree GET vendor docs: missing vendor → HTTP 400
 * `{ message: "vendor does not exist", code: "api_request_failed" }`.
 * Also seen as 404 / body text variants.
 */
const isVendorNotFoundMessage = (message) => {
  const text = String(message || "").toLowerCase();
  if (!text) return false;
  return (
    text.includes("vendor does not exist") ||
    text.includes("vendor not found") ||
    text.includes("does not exist") ||
    (text.includes("not found") && text.includes("vendor"))
  );
};

const isVendorNotFoundError = (error) => {
  const httpStatus = error?.response?.status;
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error_description ||
    error?.message ||
    "";

  // Docs: GET missing vendor → 400 { message: "vendor does not exist" }; also 404.
  if (httpStatus === 404) return true;
  return isVendorNotFoundMessage(message);
};

/** Cashfree name rule: no special characters except . / - & */
const sanitizeVendorName = (value, fallback = "seller") => {
  const raw = String(value || "").trim() || fallback;
  const cleaned = raw
    .replace(/[^a-zA-Z0-9\s./\-&]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
  return cleaned || fallback;
};

const getEasySplitSettings = async (logTraceId) => {
  try {
    const row = await findByName({ name: SETTINGS_NAME });
    if (!row?.details) {
      log(logTraceId, "info", {
        step: "settings",
        message: `No ${SETTINGS_NAME} settings row — using built-in defaults`,
        defaults: DEFAULT_SETTINGS,
      });
      return { ...DEFAULT_SETTINGS };
    }
    const details = typeof row.details === "string" ? JSON.parse(row.details) : row.details;
    return { ...DEFAULT_SETTINGS, ...details };
  } catch (error) {
    log(logTraceId, "error", {
      step: "settings",
      message: `Could not read the ${SETTINGS_NAME} settings row — falling back to defaults`,
      settingsName: SETTINGS_NAME,
      ...errorContext(error),
    });
    return { ...DEFAULT_SETTINGS };
  }
};

/**
 * Is splitting switched on? Driven by the `cashfree_ondc` serviceOperator row's
 * `serviceStatus` boolean. A missing row means OFF — logged explicitly, because
 * "nothing happened and nothing was logged" is the worst thing to debug.
 */
const isEasySplitEnabled = async (logTraceId) => {
  try {
    const service = await findServiceOperatorByAccessKey(ONDC_ACCESS_KEY);
    if (!service || Object.prototype.hasOwnProperty.call(service, "error")) {
      log(logTraceId, "error", {
        step: "enabled-check",
        message: `Easy Split OFF — no serviceOperator row with accessKey "${ONDC_ACCESS_KEY}". Create it and set serviceStatus = true.`,
        accessKey: ONDC_ACCESS_KEY,
        lookupError: service?.error ?? null,
      });
      return false;
    }
    if (!service.serviceStatus) {
      log(logTraceId, "info", {
        step: "enabled-check",
        message: `Easy Split OFF — serviceOperator "${ONDC_ACCESS_KEY}" has serviceStatus = false`,
        accessKey: ONDC_ACCESS_KEY,
        serviceOperatorId: service.id ?? null,
      });
      return false;
    }
    return true;
  } catch (error) {
    log(logTraceId, "error", {
      step: "enabled-check",
      message: "Easy Split OFF — the serviceOperator lookup threw",
      accessKey: ONDC_ACCESS_KEY,
      ...errorContext(error),
    });
    return false;
  }
};

/**
 * Cashfree credentials for the ONDC flow, all from the `cashfree_ondc` service
 * operator: its own paymentclientid/paymentclientsecret when set, otherwise its
 * vendor row's optional1/optional2, with the base URL from vendor.apiUrl.
 *
 * Deliberately no fallback to the shared `cashfree_pg` row — splitting money on
 * one merchant's credentials while the order was captured on another's would fail
 * confusingly.
 */
const resolveConfig = async (logTraceId) => {
  const service = await findServiceOperatorByAccessKey(ONDC_ACCESS_KEY);
  if (!service || Object.prototype.hasOwnProperty.call(service, "error")) {
    log(logTraceId, "error", {
      step: "config",
      message: `Service operator "${ONDC_ACCESS_KEY}" not found — cannot reach Cashfree`,
      accessKey: ONDC_ACCESS_KEY,
      lookupError: service?.error ?? null,
    });
    return { error: `Service operator ${ONDC_ACCESS_KEY} not found` };
  }

  const clientId = service.paymentclientid || service.vendor?.optional1;
  const clientSecret = service.paymentclientsecret || service.vendor?.optional2;
  const baseUrl = service.vendor?.apiUrl;

  if (!clientId || !clientSecret || !baseUrl) {
    log(logTraceId, "error", {
      step: "config",
      message: `Incomplete Cashfree configuration on "${ONDC_ACCESS_KEY}"`,
      accessKey: ONDC_ACCESS_KEY,
      serviceOperatorId: service.id ?? null,
      vendorId: service.vendor?.id ?? null,
      have: {
        clientId: Boolean(clientId),
        clientSecret: Boolean(clientSecret),
        baseUrl: Boolean(baseUrl),
      },
      readFrom: {
        clientId: service.paymentclientid ? "serviceOperator.paymentclientid" : "vendor.optional1",
        clientSecret: service.paymentclientsecret
          ? "serviceOperator.paymentclientsecret"
          : "vendor.optional2",
      },
    });
    return { error: `Incomplete Cashfree configuration on ${ONDC_ACCESS_KEY}` };
  }
  return { clientId, clientSecret, baseUrl };
};

const headersFor = ({ clientId, clientSecret }) => ({
  "x-api-version": EASY_SPLIT_API_VERSION,
  "x-client-id": clientId,
  "x-client-secret": clientSecret,
  "Content-Type": "application/json",
});

/**
 * Deterministic, Cashfree-safe vendor id for an ONDC seller. Alphanumeric +
 * underscore only, length-capped, and suffixed with a hash of the full key so two
 * sellers whose ids truncate to the same prefix can never collide. Once stored on
 * the seller row it is never recomputed, so changing this function can't orphan
 * an existing vendor.
 */
const buildVendorId = (bppId, providerId) => {
  const key = `${bppId || ""}|${providerId || ""}`;
  const hash = crypto.createHash("sha256").update(key).digest("hex").slice(0, 8);
  const slug = key
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30)
    .replace(/_+$/g, "");
  return `ondc_${slug}_${hash}`;
};

/**
 * GET a vendor. Cashfree docs: missing → HTTP 400 "vendor does not exist".
 * That is a normal answer ("not registered yet") — proceed to Create Vendor.
 */
const getVendor = async (vendorId, config, logTraceId) => {
  const cfg = config || (await resolveConfig(logTraceId));
  if (cfg.error) return { status: false, message: cfg.error };

  const url = `${cfg.baseUrl}/pg/easy-split/vendors/${encodeURIComponent(vendorId)}`;
  const requestPayload = { method: "GET", url, vendorId };

  log(logTraceId, "info", {
    step: "get-vendor-request",
    message: "Easy Split GET vendor — request about to send",
    requestPayload,
    apiVersion: EASY_SPLIT_API_VERSION,
  });

  try {
    const response = await axios({ method: "GET", url, headers: headersFor(cfg) });
    const data = response?.data || {};
    const bodyMessage = String(data.message || data.error_description || "");
    const bodySaysMissing = isVendorNotFoundMessage(bodyMessage);
    const exists = !bodySaysMissing && Boolean(data.vendor_id || data.status);

    log(logTraceId, "info", {
      step: "get-vendor-response",
      message: exists
        ? "Easy Split GET vendor — success (vendor exists)"
        : "Easy Split GET vendor — success body but vendor missing — will create",
      requestPayload,
      httpStatus: response?.status ?? 200,
      responseBody: data,
      exists,
      vendorStatus: data.status ?? null,
    });
    return { status: true, exists, data };
  } catch (error) {
    if (isVendorNotFoundError(error)) {
      log(logTraceId, "info", {
        step: "get-vendor-response",
        message: "Easy Split GET vendor — not found (will create)",
        requestPayload,
        httpStatus: error?.response?.status ?? null,
        responseBody: error?.response?.data ?? null,
        exists: false,
        ...errorContext(error),
      });
      return { status: true, exists: false };
    }
    log(logTraceId, "error", {
      step: "get-vendor-response",
      message: "Easy Split GET vendor — FAILED",
      requestPayload,
      ...errorContext(error),
    });
    return {
      status: false,
      message: error?.response?.data?.message || "Could not read the Easy Split vendor",
    };
  }
};

const createVendor = async (payload, config, logTraceId) => {
  const cfg = config || (await resolveConfig(logTraceId));
  if (cfg.error) return { status: false, message: cfg.error };

  const url = `${cfg.baseUrl}/pg/easy-split/vendors`;
  const requestPayload = payload || {};

  log(logTraceId, "info", {
    step: "create-vendor-request",
    message: "Easy Split CREATE vendor — request about to send",
    url,
    method: "POST",
    apiVersion: EASY_SPLIT_API_VERSION,
    // Full body Cashfree receives (account_number masked by MASK_FIELDS)
    requestPayload,
    requestSummary: {
      vendor_id: requestPayload.vendor_id,
      status: requestPayload.status,
      name: requestPayload.name,
      email: requestPayload.email,
      phone: requestPayload.phone,
      verify_account: requestPayload.verify_account,
      dashboard_access: requestPayload.dashboard_access,
      schedule_option: requestPayload.schedule_option,
      settlementMode: requestPayload.upi ? "upi" : "bank",
      accountNoTail: tail4(requestPayload.bank?.account_number),
      ifsc: requestPayload.bank?.ifsc ?? null,
      vpa: requestPayload.upi?.vpa ?? null,
      kyc_details: requestPayload.kyc_details ?? null,
    },
  });

  try {
    const response = await axios({ method: "POST", url, headers: headersFor(cfg), data: payload });
    log(logTraceId, "info", {
      step: "create-vendor-response",
      message: "Easy Split CREATE vendor — SUCCESS response from Cashfree",
      url,
      vendorId: payload?.vendor_id,
      httpStatus: response?.status ?? 200,
      responseBody: response?.data ?? null,
      vendorStatus: response?.data?.status ?? null,
    });
    return { status: true, data: response?.data || {} };
  } catch (error) {
    log(logTraceId, "error", {
      step: "create-vendor-response",
      message: "Easy Split CREATE vendor — FAILED response from Cashfree",
      url,
      vendorId: payload?.vendor_id,
      requestPayload,
      ...errorContext(error),
    });
    return {
      status: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error_description ||
        "Could not create the Easy Split vendor",
    };
  }
};

/**
 * Split-after-payment. `split` is `[{ vendor_id, amount, tags }]`.
 * `disableSplit: true` closes the order to any further splits.
 */
const splitOrder = async (
  gatewayOrderId,
  split,
  { disableSplit = true, logTraceId } = {},
  config
) => {
  if (!gatewayOrderId) {
    log(logTraceId, "error", {
      step: "split",
      message: "Split aborted — no Cashfree order id",
    });
    return { status: false, message: "gatewayOrderId is required" };
  }
  if (!Array.isArray(split) || !split.length) {
    log(logTraceId, "info", {
      step: "split",
      message: "Nothing to split — no eligible vendors",
      gatewayOrderId,
    });
    return { status: false, message: "no splits to write" };
  }

  const cfg = config || (await resolveConfig(logTraceId));
  if (cfg.error) return { status: false, message: cfg.error };

  const url = `${cfg.baseUrl}/pg/easy-split/orders/${encodeURIComponent(gatewayOrderId)}/split`;
  const body = { split, disable_split: disableSplit };
  const splitTotal = split.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  log(logTraceId, "info", {
    step: "split-request",
    message: "Easy Split WRITE split rule — request about to send",
    url,
    method: "POST",
    apiVersion: EASY_SPLIT_API_VERSION,
    gatewayOrderId,
    splitTotal: parseFloat(splitTotal.toFixed(2)),
    requestPayload: body,
  });

  try {
    const response = await axios({ method: "POST", url, headers: headersFor(cfg), data: body });
    log(logTraceId, "info", {
      step: "split-response",
      message: "Easy Split WRITE split rule — SUCCESS response from Cashfree",
      url,
      gatewayOrderId,
      httpStatus: response?.status ?? 200,
      requestPayload: body,
      responseBody: response?.data ?? null,
    });
    return { status: true, data: response?.data || {} };
  } catch (error) {
    log(logTraceId, "error", {
      step: "split-response",
      message: "Easy Split WRITE split rule — FAILED response from Cashfree",
      url,
      gatewayOrderId,
      splitTotal: parseFloat(splitTotal.toFixed(2)),
      requestPayload: body,
      ...errorContext(error),
    });
    return {
      status: false,
      message: error?.response?.data?.message || "Could not write the Easy Split rule",
    };
  }
};

/** Cashfree Easy Split sandbox tax IDs - https://www.cashfree.com/docs/payments/split/data-to-test */
const STAGING_TEST_GST = "29AAICP2912R1ZR";
const STAGING_TEST_PAN = "ABCCD8000T";

const isStagingEnv = () => String(process.env.NODE_ENV || "").trim() === "staging";

/**
 * Build Create Vendor body per Cashfree docs.
 * Bank / UPI always come from the ONDC on_init settlement snapshot on ondcSellers.
 * In staging only, PAN/GST are Cashfree test values (settlement account unchanged).
 * In production, real non-placeholder seller PAN/GST are used when present.
 */
const buildVendorPayload = (seller, settings) => {
  const vendorId = seller.cashfreeVendorId || buildVendorId(seller.bppId, seller.providerId);
  const slug = vendorId.replace(/^ondc_/, "");
  const isUpi = String(seller.settlementType || "").toLowerCase() === "upi";
  const accountHolder = sanitizeVendorName(
    seller.beneficiaryName || seller.vendorName || seller.providerId,
    "seller"
  );

  const staging = isStagingEnv();
  // Never forward BPP placeholder tax strings - Cashfree rejects malformed GST/PAN.
  const pan = staging
    ? STAGING_TEST_PAN
    : seller.panNumber && !isPlaceholder(seller.panNumber)
      ? seller.panNumber
      : undefined;
  const gst = staging
    ? STAGING_TEST_GST
    : seller.gstNumber && !isPlaceholder(seller.gstNumber)
      ? seller.gstNumber
      : undefined;

  const kyc = {
    account_type: settings.accountType || DEFAULT_SETTINGS.accountType,
    business_type: settings.businessType || DEFAULT_SETTINGS.businessType,
    ...(gst && { gst }),
    ...(pan && { pan }),
  };

  return {
    vendor_id: vendorId,
    status: "ACTIVE",
    name: sanitizeVendorName(seller.vendorName || seller.providerId, "seller"),
    email: String(settings.vendorEmailTemplate).replace("{slug}", slug),
    phone: String(settings.vendorPhone),
    verify_account: Boolean(settings.verifyAccount),
    dashboard_access: Boolean(settings.dashboardAccess),
    // Only send when an admin explicitly set scheduleOption — never default to 1 (T+1).
    ...(Number(settings.scheduleOption) > 0
      ? { schedule_option: Number(settings.scheduleOption) }
      : {}),
    ...(isUpi
      ? {
          upi: {
            vpa: seller.upiAddress,
            account_holder: accountHolder,
          },
        }
      : {
          bank: {
            account_number: seller.settlementBankAccountNo,
            account_holder: accountHolder,
            ifsc: String(seller.settlementIfscCode || "").toUpperCase(),
          },
        }),
    kyc_details: kyc,
  };
};

/**
 * Get this seller's Easy Split vendor id, registering them only if they aren't
 * already registered. GET 400 "vendor does not exist" always proceeds to create.
 */
const ensureEasySplitVendor = async (seller, { persist, settings, config, logTraceId } = {}) => {
  if (!seller?.bppId || !seller?.providerId) {
    log(logTraceId, "error", {
      step: "ensure-vendor",
      message: "Seller row has no bppId/providerId — cannot build a vendor id",
      ...sellerContext(seller),
    });
    return { error: "missing_seller_key" };
  }

  if (!seller.splitEligible) {
    log(logTraceId, "info", {
      step: "ensure-vendor",
      message: `Settlement details flagged unusable (${seller.ineligibleReason || "not_split_eligible"}) — still calling Cashfree with ONDC on_init settlement details`,
      ...sellerContext(seller),
    });
  }

  // Already fully ACTIVE locally — no network call.
  if (seller.cashfreeVendorId && seller.cashfreeVendorStatus === "ACTIVE") {
    log(logTraceId, "info", {
      step: "ensure-vendor",
      message: "Seller already registered locally — reusing the stored vendor id",
      ...sellerContext(seller),
    });
    return { vendorId: seller.cashfreeVendorId, created: false };
  }

  const cfg = config || (await resolveConfig(logTraceId));
  if (cfg.error) return { error: "cashfree_config_missing", message: cfg.error };
  const tunables = settings || (await getEasySplitSettings(logTraceId));

  const vendorId = seller.cashfreeVendorId || buildVendorId(seller.bppId, seller.providerId);

  const existing = await getVendor(vendorId, cfg, logTraceId);

  // Safety net: never block Create on Cashfree's "vendor does not exist" GET.
  if (!existing.status) {
    if (isVendorNotFoundMessage(existing.message)) {
      log(logTraceId, "info", {
        step: "ensure-vendor",
        message: "GET failed with not-found semantics — proceeding to Create Vendor anyway",
        vendorId,
        lookupMessage: existing.message,
      });
    } else {
      if (persist) await persist({ id: seller.id, lastSyncError: existing.message });
      return { error: "vendor_lookup_failed", message: existing.message };
    }
  } else if (existing.exists) {
    const status = existing.data?.status || "ACTIVE";
    if (persist) {
      await persist({
        id: seller.id,
        cashfreeVendorId: vendorId,
        cashfreeVendorStatus: status,
      });
    }
    return { vendorId, created: false };
  }

  const payload = buildVendorPayload({ ...seller, cashfreeVendorId: vendorId }, tunables);
  log(logTraceId, "info", {
    step: "ensure-vendor",
    message: "Calling Cashfree Create Vendor with ONDC settlement bank/UPI",
    vendorId,
    verifyAccount: payload.verify_account,
    hasBank: Boolean(payload.bank),
    hasUpi: Boolean(payload.upi),
    hasPan: Boolean(payload.kyc_details?.pan),
    hasGst: Boolean(payload.kyc_details?.gst),
    usingStagingTaxTestData: isStagingEnv(),
    accountNoTail: tail4(payload.bank?.account_number),
    ifsc: payload.bank?.ifsc ?? null,
  });

  const created = await createVendor(payload, cfg, logTraceId);
  if (!created.status) {
    if (persist) await persist({ id: seller.id, lastSyncError: created.message });
    return { error: "vendor_create_failed", message: created.message };
  }

  // Persist real Cashfree status (often IN_BENE_CREATION, not ACTIVE yet).
  const vendorStatus = created.data?.status || "IN_BENE_CREATION";
  if (persist) {
    await persist({
      id: seller.id,
      cashfreeVendorId: vendorId,
      cashfreeVendorStatus: vendorStatus,
    });
  }
  return { vendorId, created: true, vendorStatus };
};

module.exports = {
  EASY_SPLIT_API_VERSION,
  ONDC_ACCESS_KEY,
  isEasySplitEnabled,
  getEasySplitSettings,
  resolveConfig,
  buildVendorId,
  buildVendorPayload,
  sanitizeVendorName,
  isVendorNotFoundMessage,
  getVendor,
  createVendor,
  splitOrder,
  ensureEasySplitVendor,
};
