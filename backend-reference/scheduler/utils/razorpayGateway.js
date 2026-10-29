/**
 * Razorpay refund for the scheduler — twin of cashFreeGateway.cancelPGTransaction for orders
 * paid through Razorpay (same status gate and write-back; refunds by payment id, capped at
 * what was captured). Callers go through utils/pgRefund.js, which picks by the gateway tag.
 */
const { default: axios } = require("axios");
const { findOneOrder, updateOneOrder } = require("../models/use-cases/order");
const { findServiceOperatorByAccessKey } = require("./checkAndFetchServiceDetails");
const { customLog } = require("./loggerHelper");
const operatorsData = require("./operatorsData.json");

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

const refundAlreadySettled = async (corporateTxnId) => {
  try {
    const fresh = await findOneOrder({ corporateTxnId });
    const parsed = fresh?.paymentModeResponse ? JSON.parse(fresh.paymentModeResponse) : {};
    return (parsed?.pgResponse ?? parsed)?.refundStatus === "SUCCESS";
  } catch (_) {
    return false;
  }
};

/** Same contract as cashFreeGateway.cancelPGTransaction(req, corporateTxnId, refundAmount). */
const cancelRazorpayTransaction = async (req, corporateTxnId, refundAmount) => {
  try {
    const orderDetails = await findOneOrder({ corporateTxnId });
    if (!orderDetails) return { status: false, message: "Order details not found" };

    let paymentBodyData = {};
    try {
      paymentBodyData = orderDetails.paymentModeResponse ? JSON.parse(orderDetails.paymentModeResponse) : {};
    } catch (_) {
      return { status: false, message: "Invalid payment response details" };
    }
    if (orderDetails.status !== "SUCCESS") return { status: false, message: "Order status is not success" };

    const paymentId = paymentBodyData?.payment_id;
    const captured = Number(paymentBodyData?.payment_amount || 0);
    const requested = Number(refundAmount);
    const amount = Number.isFinite(requested) && requested > 0 ? Math.min(requested, captured) : captured;
    if (!paymentId) return { status: false, message: "Payment id not found for refund" };
    if (!Number.isFinite(amount) || amount <= 0) return { status: false, message: "Invalid refund amount" };
    if (paymentBodyData?.refundStatus && !RETRYABLE.has(paymentBodyData.refundStatus)) {
      return { status: true, message: "Refund already initiated", refundStatus: paymentBodyData.refundStatus };
    }

    const receipt = `refund_${corporateTxnId}${paymentBodyData?.refundStatus ? `_r${Date.now()}` : ""}`;
    customLog(req?.LogTraceId, "info", { message: "Initiating Razorpay refund", paymentId, refundAmount: amount, corporateTxnId }, "VENDOR");
    const refund = await refundRazorpayPayment({ paymentId, amountRupees: amount, receipt, notes: { corporateTxnId: String(corporateTxnId) } });
    customLog(req?.LogTraceId, "info", { message: "Razorpay refund response", response: refund }, "VENDOR");

    // Instant refunds can settle (webhook → SUCCESS) before this write lands — never clobber that.
    if (await refundAlreadySettled(corporateTxnId)) {
      return { status: true, refundStatus: "SUCCESS", message: "Refund successfull" };
    }
    paymentBodyData.refundStatus = refund.refund_status === "SUCCESS" ? "INITIATED" : refund.refund_status;
    paymentBodyData.refundResults = [refund];
    await updateOneOrder(corporateTxnId, { paymentModeResponse: JSON.stringify(paymentBodyData) });

    return { status: true, refundStatus: refund.refund_status, message: "Refund successfull" };
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Razorpay refund failed", error: error?.response?.data ?? error?.message ?? error, corporateTxnId }, "VENDOR");
    try {
      const orderDetails = await findOneOrder({ corporateTxnId });
      if (orderDetails?.paymentModeResponse) {
        const failed = JSON.parse(orderDetails.paymentModeResponse);
        failed.refundResults = [error?.response?.data ?? null];
        failed.refundStatus = "Refund failed";
        await updateOneOrder(corporateTxnId, { paymentModeResponse: JSON.stringify(failed) });
      }
    } catch (updateError) {
      customLog(req?.LogTraceId, "error", { message: "Error updating order after refund failure", error: updateError });
    }
    return { status: false, message: "Something went wrong", error: error?.response?.data };
  }
};

module.exports = { RAZORPAY_ACCESS_KEY, RAZORPAY_GATEWAY, loadRazorpayCredentials, refundRazorpayPayment, cancelRazorpayTransaction };
