/**
 * Razorpay refund for the purchase MS — twin of cashFreeGateway.cancelPGTransaction for orders
 * paid through Razorpay (same inputs, write-back and emails; refunds by payment id). Callers go
 * through utils/pgRefund.js, which picks by the gateway tag stored on the order.
 */
const { default: axios } = require("axios");
const { updateOneOrder, findOneOrder } = require("../models/use-cases/order");
const { findServiceOperatorByAccessKey } = require("./checkAndFetchServiceDetails");
const { customLog } = require("./loggerHelper");
const operatorsData = require("./operatorsData.json");
const { refundFailure, refundInitiated } = require("./emailTemplate/common");
const emailer = require("./emailer");
const { findByName } = require("../models/use-cases/setting");
const { resolveEmailTemplate } = require("../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("./emailTemplateKeys");
const { v2LayoutVariables } = require("./emailTemplate/sharedLayout");

const RAZORPAY_ACCESS_KEY = operatorsData["razorpayPaymentGateway"]["accessKey"];
const RAZORPAY_GATEWAY = "RAZORPAY";
const API_BASE = "https://api.razorpay.com/v1";
const REFUND_STATUS_MAP = { pending: "PENDING", processed: "SUCCESS", failed: "FAILED" };
const RETRYABLE = new Set(["Refund failed", "FAILED"]);

const loadRazorpayCredentials = async () => {
  const row = await findServiceOperatorByAccessKey(RAZORPAY_ACCESS_KEY);
  if (!row || Object.prototype.hasOwnProperty.call(row, "error")) return null;
  const keyId = row.vendor?.optional1;
  const keySecret = row.vendor?.optional2;
  return keyId && keySecret ? { keyId, keySecret } : null;
};

const normalizeRazorpayRefund = (r) => ({
  gateway: RAZORPAY_GATEWAY,
  refund_id: r.receipt || r.id,
  razorpay_refund_id: r.id,
  payment_id: r.payment_id,
  refund_status: REFUND_STATUS_MAP[r.status] || String(r.status || "").toUpperCase(),
  refund_amount: Number(r.amount || 0) / 100,
  refund_currency: r.currency || "INR",
  refund_speed: r.speed_processed || r.speed_requested || null,
  refund_note: r.notes?.reason || r.notes?.corporateTxnId || null,
  created_at: r.created_at ? new Date(r.created_at * 1000).toISOString() : null,
});

// Razorpay refunds by payment id; `receipt` is the per-payment idempotency key.
const refundRazorpayPayment = async ({ paymentId, amountRupees, receipt, notes, speed = "normal" }) => {
  const creds = await loadRazorpayCredentials();
  if (!creds) throw new Error("Razorpay credentials not configured");
  const response = await axios({
    method: "POST",
    url: `${API_BASE}/payments/${paymentId}/refund`,
    auth: { username: creds.keyId, password: creds.keySecret },
    headers: { "Content-Type": "application/json" },
    data: { amount: Math.round(Number(amountRupees) * 100), speed, receipt, notes },
  });
  return normalizeRazorpayRefund(response.data);
};

const errorBodyOf = (error) => error?.response?.data ?? error?.response ?? error?.message ?? error;

const refundAlreadySettled = async (corporateTxnId) => {
  try {
    const fresh = await findOneOrder({ corporateTxnId });
    const parsed = fresh?.paymentModeResponse ? JSON.parse(fresh.paymentModeResponse) : {};
    return (parsed?.pgResponse ?? parsed)?.refundStatus === "SUCCESS";
  } catch (_) {
    return false;
  }
};

/** Same contract as cashFreeGateway.cancelPGTransaction(corporateTxnId, { refundAmount?, reason? }). */
const cancelRazorpayTransaction = async (corporateTxnId, opts = {}) => {
  let refundAmount = 0;
  let serviceProvider, serviceCategory;
  let paymentBodyData = {};
  const requestedRefund = Number(opts.refundAmount);
  const isPartialRefund = Number.isFinite(requestedRefund) && requestedRefund > 0;

  try {
    const orderDetails = await findOneOrder({ corporateTxnId });
    if (!orderDetails) return { status: false, message: "Order details not found" };
    serviceProvider = orderDetails.serviceOperator?.serviceProvider;
    serviceCategory = orderDetails.serviceOperator?.serviceCategory;

    try {
      const parsed = orderDetails.paymentModeResponse ? JSON.parse(orderDetails.paymentModeResponse) : {};
      paymentBodyData = parsed?.pgResponse ?? parsed;
    } catch (_) {
      return { status: false, message: "Invalid payment response details" };
    }

    const paymentId = paymentBodyData?.payment_id;
    const capturedAmount = Number(paymentBodyData?.payment_amount || 0);
    // Never refund more than Razorpay actually captured.
    refundAmount = isPartialRefund ? Number(Math.min(requestedRefund, capturedAmount).toFixed(2)) : capturedAmount;
    if (refundAmount <= 0) return { status: false, message: "Invalid refund amount" };
    if (!paymentId) return { status: false, message: "Payment id not found for refund" };
    if (paymentBodyData?.refundStatus && !RETRYABLE.has(paymentBodyData.refundStatus)) {
      return { status: true, message: "Refund already initiated", refundStatus: paymentBodyData.refundStatus };
    }

    // Partial refunds keep their own receipt; a retry after a failed refund needs a fresh one.
    const base = isPartialRefund ? `refund_${corporateTxnId}_partial` : `refund_${corporateTxnId}`;
    const receipt = `${base}${paymentBodyData?.refundStatus ? `_r${Date.now()}` : ""}`;
    customLog(null, "info", { message: "Initiating Razorpay refund", paymentId, refundAmount, corporateTxnId }, "VENDOR");

    const refund = await refundRazorpayPayment({
      paymentId,
      amountRupees: refundAmount,
      receipt,
      notes: { corporateTxnId: String(corporateTxnId), reason: String(opts.reason || "").slice(0, 256) },
    });
    customLog(null, "info", { message: "Razorpay refund response", response: refund }, "VENDOR");

    // Instant refunds can settle (webhook → SUCCESS) before this write lands — never clobber that.
    if (await refundAlreadySettled(corporateTxnId)) {
      return { status: true, refundStatus: "SUCCESS", message: "Refund successful" };
    }
    paymentBodyData.refundStatus = refund.refund_status === "SUCCESS" ? "INITIATED" : refund.refund_status;
    paymentBodyData.refundResults = [refund];
    await updateOneOrder(corporateTxnId, { paymentModeResponse: JSON.stringify(paymentBodyData) });

    try {
      const corporateEmail = orderDetails?.credential?.email;
      if (corporateEmail) {
        await paymentRefundInitiatedEmailInternal({
          name: orderDetails?.credential?.name || orderDetails?.credential?.username || "Corporate",
          email: corporateEmail,
          amount: refundAmount,
          transactionId: corporateTxnId,
          serviceProvider,
          typeOfService: serviceCategory,
        });
      } else {
        customLog(null, "info", { message: "Corporate email not found in orderDetails, skipping refund initiated email", corporateTxnId });
      }
    } catch (emailError) {
      customLog(null, "error", { message: "Error while sending refund initiated email", error: emailError });
    }

    return { status: true, refundStatus: refund.refund_status, message: "Refund successful" };
  } catch (error) {
    const errorBody = errorBodyOf(error);
    customLog(null, "error", { message: "Razorpay refund failed", error: errorBody, corporateTxnId }, "VENDOR");

    try {
      const orderDetails = await findOneOrder({ corporateTxnId });
      if (orderDetails?.paymentModeResponse) {
        let failed = {};
        try { failed = JSON.parse(orderDetails.paymentModeResponse); } catch (_) { failed = {}; }
        failed.refundResults = [error?.response?.data ?? null];
        failed.refundStatus = "Refund failed";
        await updateOneOrder(corporateTxnId, { paymentModeResponse: JSON.stringify(failed) });
      }
    } catch (updateError) {
      customLog(null, "error", { message: "Error updating order after refund failure", error: updateError });
    }

    try {
      await paymentRefundFailureEmailInternal({ amount: refundAmount, transactionId: corporateTxnId, serviceProvider, typeOfService: serviceCategory });
    } catch (emailError) {
      customLog(null, "error", { message: "Error while sending refund failure email", error: emailError });
    }

    return { status: false, message: "Something went wrong", error: error?.response?.data };
  }
};

async function paymentRefundFailureEmailInternal({ amount, transactionId, serviceProvider, typeOfService }) {
  const resp = await findByName({ name: "pekoWebsite" });
  const email = resp.emails;
  const params = { name: "Admin", amount, transactionId, serviceProvider, typeOfService };
  const resolved = await resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.REFUND_FAILED,
    service: EMAIL_TEMPLATE_SERVICES.PURCHASE_REFUND,
    variables: { name: params.name, amount, transactionId, ...v2LayoutVariables(undefined) },
    fallback: () => refundFailure(params),
    fallbackSubject: "Refund Failed",
  });
  await emailer.email(email, resolved.subject, resolved.html);
}

async function paymentRefundInitiatedEmailInternal({ name, email, amount, transactionId, serviceProvider, typeOfService }) {
  const params = { name: name || "Corporate", amount, transactionId, serviceProvider, typeOfService };
  const resolved = await resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.REFUND_INITIATED,
    service: EMAIL_TEMPLATE_SERVICES.PURCHASE_REFUND,
    variables: { name: params.name, amount, transactionId, serviceProvider: serviceProvider || "", typeOfService: typeOfService || "", ...v2LayoutVariables(undefined) },
    fallback: () => refundInitiated(params),
    fallbackSubject: "Refund Initiated",
  });
  await emailer.email(email, resolved.subject, resolved.html);
}

module.exports = { RAZORPAY_ACCESS_KEY, RAZORPAY_GATEWAY, loadRazorpayCredentials, refundRazorpayPayment, cancelRazorpayTransaction };
