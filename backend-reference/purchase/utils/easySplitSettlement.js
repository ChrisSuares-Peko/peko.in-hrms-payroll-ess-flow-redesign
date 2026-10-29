/**
 * Cashfree Easy Split "Defer Settlement" — controls WHEN a split already written
 * against an order may settle to the vendor.
 *
 *   PUT {deferBaseUrl}/api/v2/easy-split/orders/{orderId}/settlement-eligibility/vendors/{vendorId}
 *   { "settlementEligibilityDateUpdate": "YYYY-MM-DD HH:MM:SS" }
 *
 * Why it exists: the split is written at on_confirm with disable_split:true. Without
 * deferring, Cashfree settles on the vendor's cycle (merchant default when
 * schedule_option was omitted at create — T+21 on our PG; or an explicit ID if set).
 * That can still land before the ONDC return window closes, with no reverse path.
 *
 * Kept out of easySplit.js because this is a different API generation (/api/v2, no
 * x-api-version) on a DIFFERENT HOST. Credentials and the on/off switch still come
 * from there, so only one module knows the `cashfree_ondc` operator row.
 */

const { default: axios } = require("axios");

const { customLog } = require("./loggerHelper");
const { resolveConfig, isEasySplitEnabled, getEasySplitSettings } = require("./easySplit");
const { recordSellerPayoutAttempt } = require("../models/use-cases/ondc_seller_payout");

const MASK_FIELDS = ["x-client-secret", "X-Client-Secret", "clientSecret"];

const log = (logTraceId, level, data) =>
  customLog(logTraceId, level, { scope: "easySplit", flow: "settlementEligibility", ...data }, "VENDOR", MASK_FIELDS);

/**
 * Cashfree rejects a date past the account ceiling with "Settlement eligibility
 * cannot be beyond max_eligibity_date" (their misspelling). Not transient — it means
 * deferMaxDays exceeds the account's "Defer by Days", so it gets its own reason slug
 * rather than being retried blindly.
 */
const MAX_ELIGIBILITY_EXCEEDED = "MAX_ELIGIBILITY_EXCEEDED";

// Anchored on the stable part of the phrase, not their misspelt token.
const isMaxEligibilityError = (message) =>
  String(message || "").toLowerCase().includes("settlement eligibility cannot be beyond");

const errorContext = (error) => ({
  httpStatus: error?.response?.status ?? null,
  cashfreeCode: error?.response?.data?.code ?? error?.response?.data?.subCode ?? null,
  cashfreeMessage: error?.response?.data?.message ?? error?.response?.data?.error_description ?? null,
  cashfreeBody: error?.response?.data ?? null,
  error: error?.message ?? String(error),
});

/**
 * The v2 defer API is NOT on the split API's host:
 *   split  sandbox.cashfree.com | api.cashfree.com
 *   defer  test.cashfree.com    | api.cashfree.com
 * `deferBaseUrl` in ONDC_EASY_SPLIT overrides if Cashfree moves it again.
 */
const resolveDeferBaseUrl = (splitBaseUrl, settings = {}) => {
  if (settings.deferBaseUrl) return String(settings.deferBaseUrl).replace(/\/+$/, "");
  const base = String(splitBaseUrl || "").replace(/\/+$/, "");
  return base ? base.replace("://sandbox.cashfree.com", "://test.cashfree.com") : null;
};

/**
 * Cashfree wants `YYYY-MM-DD HH:MM:SS` with no zone marker, read as IST. Built by
 * hand from the +05:30 shifted epoch — toISOString() slicing would silently send
 * UTC and settle sellers 5.5h early; toLocaleString() varies by ICU build.
 */
const formatCashfreeDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const ist = new Date(d.getTime() + 5.5 * 3600000);
  const p = (n) => String(n).padStart(2, "0");
  return `${ist.getUTCFullYear()}-${p(ist.getUTCMonth() + 1)}-${p(ist.getUTCDate())}` +
    ` ${p(ist.getUTCHours())}:${p(ist.getUTCMinutes())}:${p(ist.getUTCSeconds())}`;
};

const headersFor = ({ clientId, clientSecret }) => ({
  "X-Client-Id": clientId,
  "X-Client-Secret": clientSecret,
  "Content-Type": "application/json",
});

/** The ledger is evidence, never a precondition — a failed insert must not abort a payout. */
const ledger = async (row, logTraceId) => {
  try {
    await recordSellerPayoutAttempt(row);
  } catch (err) {
    log(logTraceId, "error", {
      step: "ledger",
      message: "Could not append to the ondcSellerPayouts ledger — the Cashfree call is unaffected",
      action: row?.action,
      transactionId: row?.transactionId,
      error: err?.message || String(err),
    });
  }
};

/**
 * Move a vendor's settlement-eligibility date for one order. Never throws —
 * settlement timing must not fail an order confirmation or abort a sweep mid-pass.
 * Every outcome is logged and appended to the ondcSellerPayouts ledger.
 *
 * @param {'PARK'|'NARROW'|'RELEASE'} params.action why we are moving it
 * @param {Object} [params.config]   pre-resolved resolveConfig(), to avoid a re-read per row
 * @param {Object} [params.settings] pre-resolved getEasySplitSettings()
 * @returns {Promise<{status:boolean, reason?:string, message?:string, httpStatus?:number, eligibilityDate?:Date}>}
 */
const setSettlementEligibility = async ({
  gatewayOrderId, vendorId, date, action,
  ondcOrderId = null, transactionId = null, paymentRef = null, amount = null,
  config, settings, logTraceId,
} = {}) => {
  const base = {
    ondcOrderId, transactionId, paymentRef, gatewayOrderId,
    splitVendorId: vendorId, amount,
    action: action || "UNKNOWN",
    requestedEligibilityDate: date instanceof Date ? date : date ? new Date(date) : null,
    logTraceId,
  };

  const skip = async (reason, message) => {
    log(logTraceId, reason === "disabled" || reason === "hold_disabled" ? "info" : "error", {
      step: "eligibility-skip",
      message: message || `Settlement eligibility not set — ${reason}`,
      action, gatewayOrderId, vendorId, transactionId, reason,
    });
    await ledger({ ...base, status: "SKIPPED", error: reason }, logTraceId);
    return { status: false, reason, message };
  };

  if (!gatewayOrderId) return skip("no_gateway_order_id", "No Cashfree order id — cannot address the split");
  if (!vendorId) return skip("no_vendor_id", "No Easy Split vendor id — nothing to defer");

  const formatted = formatCashfreeDate(date);
  if (!formatted) return skip("invalid_date", `Unusable eligibility date: ${String(date)}`);

  const tunables = settings || (await getEasySplitSettings(logTraceId));
  if (tunables.payoutHoldEnabled === false) {
    return skip("hold_disabled", "payoutHoldEnabled is false — leaving Cashfree's default schedule alone");
  }
  if (!(await isEasySplitEnabled(logTraceId))) {
    return skip("disabled", "Easy Split is switched off — no settlement timing to control");
  }

  const cfg = config || (await resolveConfig(logTraceId));
  if (cfg.error) return skip("config", cfg.error);
  const deferBase = resolveDeferBaseUrl(cfg.baseUrl, tunables);
  if (!deferBase) return skip("config", "Could not resolve the defer-settlement base URL");

  const url = `${deferBase}/api/v2/easy-split/orders/${encodeURIComponent(gatewayOrderId)}` +
    `/settlement-eligibility/vendors/${encodeURIComponent(vendorId)}`;
  const body = { settlementEligibilityDateUpdate: formatted };

  log(logTraceId, "info", {
    step: "eligibility-request",
    message: "Easy Split SET settlement eligibility — request about to send",
    method: "PUT", url, action, gatewayOrderId, vendorId, transactionId, requestPayload: body,
  });

  try {
    const response = await axios({ method: "PUT", url, headers: headersFor(cfg), data: body });
    const data = response?.data || {};
    const httpStatus = response?.status ?? 200;
    // Cashfree answers {status:"OK"}; an explicit non-OK inside a 2xx is a failure.
    const ok = !data.status || String(data.status).toUpperCase() === "OK";

    log(logTraceId, ok ? "info" : "error", {
      step: "eligibility-response",
      message: ok
        ? "Easy Split SET settlement eligibility — SUCCESS"
        : "Easy Split SET settlement eligibility — 2xx with a non-OK body",
      url, action, gatewayOrderId, vendorId, transactionId, httpStatus,
      requestPayload: body, responseBody: data,
    });
    await ledger({
      ...base, status: ok ? "OK" : "FAILED", httpStatus, responseBody: data,
      error: ok ? null : data.message || "non_ok_body",
    }, logTraceId);

    return ok
      ? { status: true, httpStatus, eligibilityDate: base.requestedEligibilityDate }
      : { status: false, reason: "non_ok_body", message: data.message || null, httpStatus };
  } catch (error) {
    const ctx = errorContext(error);
    const gatewayMessage = ctx.cashfreeMessage || ctx.error;
    const reason = isMaxEligibilityError(gatewayMessage) ? MAX_ELIGIBILITY_EXCEEDED : "request_failed";

    log(logTraceId, "error", {
      step: "eligibility-response",
      message: reason === MAX_ELIGIBILITY_EXCEEDED
        ? "Easy Split SET settlement eligibility — REJECTED: date beyond the account's max eligibility. " +
          "deferMaxDays exceeds the 'Defer by Days' on the cashfree_ondc account — lower it to match."
        : "Easy Split SET settlement eligibility — FAILED",
      url, action, gatewayOrderId, vendorId, transactionId,
      requestPayload: body, deferMaxDays: tunables.deferMaxDays ?? null, reason, ...ctx,
    });
    await ledger({
      ...base, status: "FAILED", httpStatus: ctx.httpStatus,
      responseBody: ctx.cashfreeBody, error: `${reason}: ${gatewayMessage}`,
    }, logTraceId);

    return { status: false, reason, message: gatewayMessage, httpStatus: ctx.httpStatus };
  }
};

module.exports = {
  MAX_ELIGIBILITY_EXCEEDED,
  formatCashfreeDate,
  resolveDeferBaseUrl,
  isMaxEligibilityError,
  setSettlementEligibility,
};
