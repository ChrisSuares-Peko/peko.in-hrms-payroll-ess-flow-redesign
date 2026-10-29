const axios = require("axios");
const { customLog } = require("./loggerHelper");

// Same internal endpoint and shared secret paymentGateway uses for corporate card payments. The admin refund
// of a card-paid order is a Pine Labs Cancel Redeem, and corporateCard owns that call.
const CANCEL_PATH = "/api/v1/webhook/paymentgateway/corporate-cards/in-app/cancel";
const TIMEOUT_MS = 45000;

const gatewayBaseUrl = () => {
  const raw = process.env.CORPORATE_CARDS_INTERNAL_URL
    || (process.env.NODE_ENV === "staging" ? process.env.STAGING_URL : process.env.PRODUCTION_URL);
  return String(raw || "").replace(/\/+$/, "");
};

// Never throws. ok:true carries corporateCard's receipt (cancelled, status, reason...).
const inAppCancel = async ({ paymentRefId }, { logTraceId } = {}) => {
  const secret = process.env.CARD_PURCHASE_CALLBACK_SECRET;
  const baseUrl = gatewayBaseUrl();
  if (!secret || !baseUrl) {
    customLog(logTraceId, "error", { message: "[CorporateCards] in-app cancel not configured", hasSecret: Boolean(secret), hasBaseUrl: Boolean(baseUrl) });
    return { ok: false, reason: "NOT_CONFIGURED", message: "Card refunds are not configured" };
  }
  try {
    const response = await axios.post(`${baseUrl}${CANCEL_PATH}`, { paymentRefId }, {
      headers: { "x-card-purchase-secret": secret, "x-request-id": logTraceId || undefined },
      timeout: TIMEOUT_MS,
    });
    return { ok: true, data: response?.data?.data ?? null, message: response?.data?.message ?? null };
  } catch (error) {
    customLog(logTraceId, "error", {
      message: "[CorporateCards] in-app cancel failed",
      paymentRefId,
      status: error?.response?.status,
      error: error?.response?.data || error.message,
    });
    return { ok: false, reason: "UNREACHABLE", status: error?.response?.status ?? null, message: error?.response?.data?.message || "Card service is unavailable" };
  }
};

module.exports = { inAppCancel };
