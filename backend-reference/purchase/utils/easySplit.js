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

  // ---- Return-window payout hold (utils/easySplitSettlement.js) ----
  // The split is still written at on_confirm; these control WHEN Cashfree may
  // settle it. false = exactly the pre-feature behaviour (no hold) — kill switch.
  payoutHoldEnabled: true,
  // For a returnable line whose seller declared no @ondc/org/return_window.
  defaultReturnWindow: "P2D",
  // Grace on top of the window: covers the lag between a buyer filing a return on
  // the last day and the seller's on_update reaching us.
  returnWindowBuffer: "PT12H",
  // MUST match the "Defer by Days" on the cashfree_ondc account — Cashfree rejects
  // any date beyond its own max_eligibity_date, so too high fails every PARK.
  deferMaxDays: 30,
  // Host override for the v2 defer API (not the /pg host). Null derives it.
  deferBaseUrl: null,
  payoutMaxAttempts: 5,
  // Min gap between /status polls per order, so the sweep can run hourly.
  statusPollThrottleHours: 6,
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

/**
 * Settleable / safe-to-reuse Easy Split vendor status. Soft-deleted or blocked
 * dashboard vendors often still return a status string — those must NOT skip create.
 */
const isUsableCashfreeVendorStatus = (status) => {
  const normalized = String(status || "")
    .trim()
    .toUpperCase();
  return normalized === "ACTIVE";
};

/** Create failed because the sticky vendor_id is reserved / already taken. */
const isVendorIdConflictMessage = (message) => {
  const text = String(message || "").toLowerCase();
  if (!text) return false;
  return (
    text.includes("already exist") ||
    text.includes("already registered") ||
    text.includes("duplicate") ||
    text.includes("vendor id exists") ||
    text.includes("vendor_id already") ||
    (text.includes("vendor") && text.includes("exist") && !text.includes("does not exist"))
  );
};

/**
 * Versioned vendor id when Cashfree rejects recreate with the sticky id.
 * attempt 1 → base (no suffix); 2 → base_v2; 3 → base_v3.
 */
const nextVendorId = (baseId, attempt) => {
  const root = String(baseId || "")
    .replace(/_v\d+$/i, "")
    .slice(0, 40);
  if (!root) return `ondc_vendor_v${Math.max(1, attempt)}`;
  if (attempt <= 1) return root;
  return `${root}_v${attempt}`;
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
    const present = !bodySaysMissing && Boolean(data.vendor_id || data.status);
    // Reuse without create only when Cashfree reports ACTIVE. Soft-deleted /
    // blocked / empty-status ghosts still "present" must go through recreate.
    const exists = present && isUsableCashfreeVendorStatus(data.status);

    log(logTraceId, "info", {
      step: "get-vendor-response",
      message: exists
        ? "Easy Split GET vendor — success (vendor ACTIVE, reusable)"
        : present
          ? "Easy Split GET vendor — present but not ACTIVE — will recreate"
          : "Easy Split GET vendor — success body but vendor missing — will create",
      requestPayload,
      httpStatus: response?.status ?? 200,
      responseBody: data,
      exists,
      present,
      vendorStatus: data.status ?? null,
    });
    return { status: true, exists, present, data };
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

/**
 * Cashfree Easy Split sandbox test data — https://www.cashfree.com/docs/payments/split/data-to-test
 *
 * Sellers on the ONDC staging network hand over masked or placeholder settlement
 * details (`judgeSplitEligibility` flags them `masked_settlement_details`), which
 * Cashfree's account verification rejects, leaving the vendor stuck out of ACTIVE and
 * the split unwritable. Substituting the documented "Success" test account in non-prod
 * lets verification pass so the whole split → defer → release path can be exercised.
 */
const TEST_BANK_ACCOUNT = "026291800001191";
const TEST_BANK_IFSC = "YESB0000262";
const TEST_UPI_VPA = "success@upi";
/**
 * MUST accompany the test account — Cashfree name-matches the beneficiary. Their own
 * test table lists this exact account twice: "John Doe" → Success, "Jon D" →
 * "Failure-account holder name matching failed". Sending the real seller's name
 * alongside a test account therefore fails verification and the vendor never reaches
 * ACTIVE, which defeats the point of substituting the account at all.
 */
const TEST_ACCOUNT_HOLDER = "John Doe";
const STAGING_TEST_GST = "29AAICP2912R1ZR";
const STAGING_TEST_PAN = "ABCCD8000T";

/**
 * Should Cashfree test settlement data be substituted for the seller's real details?
 *
 * An explicit ALLOWLIST, never `!== "production"`. Inverting the production check would
 * mean a box with NODE_ENV unset or misspelled silently registers real sellers against
 * a test bank account — money routed into nowhere. A missing NODE_ENV must fail toward
 * using the seller's real details, so the worst case is a vendor that won't verify
 * rather than settlements sent to the wrong account.
 *
 * "test" is deliberately EXCLUDED: that is jest's default NODE_ENV, and the unit tests
 * assert the real settlement mapping.
 *
 * A local machine therefore needs NODE_ENV set to one of these to get test data.
 */
const TEST_DATA_ENVS = new Set(["staging", "local", "development", "dev"]);

const isTestDataEnv = () => TEST_DATA_ENVS.has(String(process.env.NODE_ENV || "").trim().toLowerCase());

/**
 * Build Create Vendor body per Cashfree docs.
 *
 * In production, everything comes from the ONDC on_init settlement snapshot on
 * ondcSellers — the seller's real bank/UPI, PAN and GST.
 *
 * In staging/local (see isTestDataEnv), the settlement account, UPI VPA, PAN and GST are
 * all replaced with Cashfree's documented sandbox values so the vendor passes account
 * verification and reaches ACTIVE. The seller's real details are still stored on
 * ondcSellers — only what we SEND to Cashfree changes.
 */
const buildVendorPayload = (seller, settings) => {
  const vendorId = seller.cashfreeVendorId || buildVendorId(seller.bppId, seller.providerId);
  // const slug = vendorId.replace(/^ondc_/, "");
  const isUpi = String(seller.settlementType || "").toLowerCase() === "upi";
  const useTestData = isTestDataEnv();
  // The literal is used as-is, not sanitised — Cashfree matches it character for
  // character against the test account and any mangling would fail verification.
  const accountHolder = useTestData
    ? TEST_ACCOUNT_HOLDER
    : sanitizeVendorName(
        seller.beneficiaryName || seller.vendorName || seller.providerId,
        "seller"
      );
  // Never forward BPP placeholder tax strings - Cashfree rejects malformed GST/PAN.
  const pan = useTestData
    ? STAGING_TEST_PAN
    : seller.panNumber && !isPlaceholder(seller.panNumber)
      ? seller.panNumber
      : undefined;
  const gst = useTestData
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

  // The seller's declared rail is preserved (a UPI seller stays UPI) so the same code
  // path runs as in production — only the identifier is swapped for a test one.
  const settlement = isUpi
    ? {
        upi: {
          vpa: useTestData ? TEST_UPI_VPA : seller.upiAddress,
          account_holder: accountHolder,
        },
      }
    : {
        bank: {
          account_number: useTestData ? TEST_BANK_ACCOUNT : seller.settlementBankAccountNo,
          account_holder: accountHolder,
          ifsc: useTestData ? TEST_BANK_IFSC : String(seller.settlementIfscCode || "").toUpperCase(),
        },
      };

  return {
    vendor_id: vendorId,
    status: "ACTIVE",
    name: sanitizeVendorName(seller.vendorName || seller.providerId, "seller"),
    email: "partner@peko.one",
    phone: String(settings.vendorPhone),
    verify_account: Boolean(settings.verifyAccount),
    dashboard_access: Boolean(settings.dashboardAccess),
    // Only send when an admin explicitly set scheduleOption — never default to 1 (T+1).
    ...(Number(settings.scheduleOption) > 0
      ? { schedule_option: Number(settings.scheduleOption) }
      : {}),
    ...settlement,
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

  const cfg = config || (await resolveConfig(logTraceId));
  if (cfg.error) return { error: "cashfree_config_missing", message: cfg.error };
  const tunables = settings || (await getEasySplitSettings(logTraceId));

  const vendorId = seller.cashfreeVendorId || buildVendorId(seller.bppId, seller.providerId);
  const locallyActive = Boolean(seller.cashfreeVendorId) && seller.cashfreeVendorStatus === "ACTIVE";

  // ALWAYS confirm with Cashfree, even when our own row says ACTIVE. A stored ACTIVE
  // only proves the vendor was created once against SOME merchant — it can be stale if
  // the vendor was deleted, or if the row was written while a different
  // cashfree_ondc account was configured. Trusting it would put a non-existent vendor
  // into the split entry, and since the split is one request with disable_split:true,
  // one bad vendor fails the write for EVERY seller in that checkout.
  const existing = await getVendor(vendorId, cfg, logTraceId);

  if (!existing.status) {
    if (isVendorNotFoundMessage(existing.message)) {
      log(logTraceId, "info", {
        step: "ensure-vendor",
        message: "GET failed with not-found semantics — proceeding to Create Vendor anyway",
        vendorId,
        lookupMessage: existing.message,
      });
    } else if (locallyActive) {
      // Inconclusive lookup (timeout, 5xx, auth blip) on a vendor we already know is
      // registered. Proceed with the stored id rather than skipping this seller from
      // the split — a Cashfree hiccup must not cost a payout that would have worked.
      log(logTraceId, "error", {
        step: "ensure-vendor",
        message: "Could not confirm the vendor with Cashfree — proceeding on the stored ACTIVE record",
        vendorId,
        lookupMessage: existing.message,
        ...sellerContext(seller),
      });
      return { vendorId, created: false, confirmed: false, vendorStatus: seller.cashfreeVendorStatus };
    } else {
      if (persist) await persist({ id: seller.id, lastSyncError: existing.message });
      return { error: "vendor_lookup_failed", message: existing.message };
    }
  } else if (existing.exists) {
    const status = existing.data?.status || "ACTIVE";
    log(logTraceId, "info", {
      step: "ensure-vendor",
      message: "Vendor confirmed ACTIVE at Cashfree",
      vendorId,
      vendorStatus: status,
      // Cashfree is the authority; our row is a cache. Surface a disagreement rather
      // than letting it sit — a vendor stuck out of ACTIVE will not settle.
      ...(status !== seller.cashfreeVendorStatus && { previouslyStoredStatus: seller.cashfreeVendorStatus ?? null }),
    });
    if (persist) {
      await persist({
        id: seller.id,
        cashfreeVendorId: vendorId,
        cashfreeVendorStatus: status,
      });
    }
    return { vendorId, created: false, confirmed: true, vendorStatus: status };
  } else if (existing.present && !existing.exists) {
    log(logTraceId, "error", {
      step: "ensure-vendor",
      message:
        "Cashfree still returns this vendor_id but status is not ACTIVE (deleted/blocked/soft-delete). Recreating.",
      vendorId,
      vendorStatus: existing.data?.status ?? null,
      ...sellerContext(seller),
    });
  } else if (locallyActive) {
    // Cashfree says it does not exist while our row claims ACTIVE. Falling through to
    // Create is the fix, but the disagreement itself is worth shouting about: it
    // usually means the vendor lives on a different merchant account than the one now
    // configured, which is also why splits or settlements would have been failing.
    log(logTraceId, "error", {
      step: "ensure-vendor",
      message:
        "Stored vendor status is ACTIVE but Cashfree does not have this vendor — the local record was " +
        "stale (vendor deleted, or created against a different merchant account). Recreating it.",
      vendorId,
      ...sellerContext(seller),
    });
  }

  const baseVendorId = String(vendorId || "").replace(/_v\d+$/i, "") || vendorId;
  const MAX_CREATE_ATTEMPTS = 3;
  let lastCreateError = null;

  for (let attempt = 1; attempt <= MAX_CREATE_ATTEMPTS; attempt += 1) {
    const tryVendorId = attempt === 1 ? vendorId : nextVendorId(baseVendorId, attempt);
    const payload = buildVendorPayload({ ...seller, cashfreeVendorId: tryVendorId }, tunables);
    const usingTestData = isTestDataEnv();
    log(logTraceId, "info", {
      step: "ensure-vendor",
      message: usingTestData
        ? `Calling Cashfree Create Vendor with SANDBOX TEST settlement data (NODE_ENV=${process.env.NODE_ENV}) — ` +
          "the seller's real bank/UPI on ondcSellers is NOT what is being registered"
        : "Calling Cashfree Create Vendor with ONDC settlement bank/UPI",
      vendorId: tryVendorId,
      attempt,
      verifyAccount: payload.verify_account,
      hasBank: Boolean(payload.bank),
      hasUpi: Boolean(payload.upi),
      hasPan: Boolean(payload.kyc_details?.pan),
      hasGst: Boolean(payload.kyc_details?.gst),
      usingTestSettlementData: usingTestData,
      accountNoTail: tail4(payload.bank?.account_number),
      ifsc: payload.bank?.ifsc ?? null,
      vpa: payload.upi?.vpa ?? null,
    });

    // eslint-disable-next-line no-await-in-loop
    const created = await createVendor(payload, cfg, logTraceId);
    if (created.status) {
      const vendorStatus = created.data?.status || "IN_BENE_CREATION";
      if (persist) {
        // eslint-disable-next-line no-await-in-loop
        await persist({
          id: seller.id,
          cashfreeVendorId: tryVendorId,
          cashfreeVendorStatus: vendorStatus,
          lastSyncError: null,
        });
      }
      return {
        vendorId: tryVendorId,
        created: true,
        confirmed: true,
        vendorStatus,
      };
    }

    lastCreateError = created.message;
    const canRetry =
      attempt < MAX_CREATE_ATTEMPTS && isVendorIdConflictMessage(created.message);
    log(logTraceId, canRetry ? "info" : "error", {
      step: "ensure-vendor",
      message: canRetry
        ? "Create rejected — sticky vendor_id likely reserved; retrying with a versioned id"
        : "Create Vendor failed",
      vendorId: tryVendorId,
      attempt,
      createMessage: created.message,
      willRetry: canRetry,
      nextVendorId: canRetry ? nextVendorId(baseVendorId, attempt + 1) : null,
      ...sellerContext(seller),
    });
    if (!canRetry) break;
  }

  // Do not leave a false ACTIVE cache after a failed recreate — next checkout must
  // not trust the deleted dashboard vendor as settleable.
  if (persist) {
    await persist({
      id: seller.id,
      cashfreeVendorStatus: null,
      lastSyncError: lastCreateError || "vendor_create_failed",
    });
  }
  return { error: "vendor_create_failed", message: lastCreateError };
};

module.exports = {
  EASY_SPLIT_API_VERSION,
  ONDC_ACCESS_KEY,
  isEasySplitEnabled,
  getEasySplitSettings,
  resolveConfig,
  buildVendorId,
  nextVendorId,
  buildVendorPayload,
  isTestDataEnv,
  sanitizeVendorName,
  isVendorNotFoundMessage,
  isUsableCashfreeVendorStatus,
  isVendorIdConflictMessage,
  getVendor,
  createVendor,
  splitOrder,
  ensureEasySplitVendor,
};
