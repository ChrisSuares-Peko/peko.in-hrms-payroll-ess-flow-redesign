/**
 * Cashfree Easy Split "Defer Settlement" — RELEASE path for the scheduler sweep.
 *
 * Same PUT as purchase/utils/easySplitSettlement.js. PARK and NARROW stay in
 * purchase (event-driven). Do not invent a third host or credential source.
 *
 * Ledger writes go to ondcSellerPayouts via raw SQL (purchase owns that table;
 * this app must not sequelize.define a partial mirror — see ondcCategory.js).
 */

const { default: axios } = require("axios");
const { QueryTypes } = require("sequelize");

const { customLog } = require("./loggerHelper");
const { resolveConfig, isEasySplitEnabled, getEasySplitSettings } = require("./easySplit");
const ondcOrders = require("../models/entities/ondc_order");

const MASK_FIELDS = ["x-client-secret", "X-Client-Secret", "clientSecret"];

const log = (logTraceId, level, data) =>
  customLog(logTraceId, level, { scope: "easySplit", flow: "settlementEligibility", ...data }, "VENDOR", MASK_FIELDS);

const MAX_ELIGIBILITY_EXCEEDED = "MAX_ELIGIBILITY_EXCEEDED";

const isMaxEligibilityError = (message) =>
  String(message || "").toLowerCase().includes("settlement eligibility cannot be beyond");

const errorContext = (error) => ({
  httpStatus: error?.response?.status ?? null,
  cashfreeCode: error?.response?.data?.code ?? error?.response?.data?.subCode ?? null,
  cashfreeMessage: error?.response?.data?.message ?? error?.response?.data?.error_description ?? null,
  cashfreeBody: error?.response?.data ?? null,
  error: error?.message ?? String(error),
});

const resolveDeferBaseUrl = (splitBaseUrl, settings = {}) => {
  if (settings.deferBaseUrl) return String(settings.deferBaseUrl).replace(/\/+$/, "");
  const base = String(splitBaseUrl || "").replace(/\/+$/, "");
  return base ? base.replace("://sandbox.cashfree.com", "://test.cashfree.com") : null;
};

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

const ledger = async (row, logTraceId) => {
  try {
    await ondcOrders.sequelize.query(
      `INSERT INTO ondcSellerPayouts
        (ondcOrderId, transactionId, paymentRef, gatewayOrderId, splitVendorId,
         amount, action, requestedEligibilityDate, status, httpStatus, responseBody,
         error, logTraceId, createdAt, updatedAt)
       VALUES
        (:ondcOrderId, :transactionId, :paymentRef, :gatewayOrderId, :splitVendorId,
         :amount, :action, :requestedEligibilityDate, :status, :httpStatus, :responseBody,
         :error, :logTraceId, NOW(), NOW())`,
      {
        replacements: {
          ondcOrderId: row.ondcOrderId ?? null,
          transactionId: row.transactionId != null ? String(row.transactionId) : null,
          paymentRef: row.paymentRef != null ? String(row.paymentRef) : null,
          gatewayOrderId: row.gatewayOrderId != null ? String(row.gatewayOrderId) : null,
          splitVendorId: row.splitVendorId ?? null,
          amount: row.amount ?? null,
          action: row.action,
          requestedEligibilityDate: row.requestedEligibilityDate ?? null,
          status: row.status,
          httpStatus: row.httpStatus ?? null,
          responseBody: row.responseBody != null ? JSON.stringify(row.responseBody) : null,
          error: row.error ?? null,
          logTraceId: row.logTraceId ?? null,
        },
        type: QueryTypes.INSERT,
      }
    );
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
