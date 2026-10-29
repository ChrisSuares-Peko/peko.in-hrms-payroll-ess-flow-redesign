/**
 * Razorpay refund for the payment MS (admin refunds, eSIM bulk auto-refund). Twin of
 * cashfreeGateway.cancelPGTransaction — same inputs, same write-back and emails, only the
 * gateway call differs. Callers go through utils/pgRefund.js, which picks by the gateway tag.
 */
const { default: axios } = require("axios");
const { updateOneOrder, findOneOrder } = require("../models/use-cases/order");
const { findServiceOperatorByAccessKey } = require("./checkAndFetchServiceDetails");
const { customLog } = require("./loggerHelper");
const operatorsData = require("./operatorsData.json");
const { refundFailure, refundInitiated } = require("./emailTemplate/billpayments");
const emailer = require("./emailer");
const { findByName } = require("../models/use-cases/settings");
const { partnerLogos } = require("./partnerLogos");
const { fetchPartnerDetails } = require("../models/use-cases/systemUser");
const { resolveEmailTemplate } = require("../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("./emailTemplateKeys");
const { v2LayoutVariables } = require("./emailTemplate/sharedLayout");

const RAZORPAY_ACCESS_KEY = operatorsData["razorpayPaymentGateway"]["accessKey"];
const RAZORPAY_GATEWAY = "RAZORPAY";
const API_BASE = "https://api.razorpay.com/v1";
const REFUND_STATUS_MAP = { pending: "PENDING", processed: "SUCCESS", failed: "FAILED" };
const RETRYABLE = new Set(["Refund failed", "FAILED"]);

// Same vendor row paymentGateway uses: optional1 = key_id, optional2 = key_secret.
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

const cancelRazorpayTransaction = async (corporateTxnId, requestedAmount, displayAmount, logTraceId) => {
  let refundAmount = 0;
  let emailAmount = 0;
  let serviceProvider, serviceCategory;
  let paymentBodyData = {};

  try {
    const orderDetails = await findOneOrder({ corporateTxnId });
    if (!orderDetails) {
      return { status: false, message: "Order details not found" };
    }
    serviceProvider = orderDetails.serviceOperator?.serviceProvider;
    serviceCategory = orderDetails.serviceOperator?.serviceCategory;

    try {
      const parsedResponse = orderDetails?.paymentModeResponse ? JSON.parse(orderDetails.paymentModeResponse) : {};
      paymentBodyData = parsedResponse?.pgResponse ?? parsedResponse;
    } catch (parseError) {
      customLog(logTraceId, "error", { message: "Invalid paymentModeResponse JSON in order details", corporateTxnId, error: parseError });
      return { status: false, message: "Invalid payment response details" };
    }

    const paymentId = paymentBodyData?.payment_id;
    const paidAmount = Number(paymentBodyData?.payment_amount || 0);
    if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
      return { status: false, message: "Invalid refund amount" };
    }
    // Refund the requested amount (capped at the captured amount). With none passed, default to
    // this row's PG share (bulk batches share one capture across many rows), else the full capture.
    const requested = Number(requestedAmount);
    const perItemPgAmount = Math.floor(Number(paymentBodyData?.pgAmount) * 100) / 100;
    const defaultAmount = Number.isFinite(perItemPgAmount) && perItemPgAmount > 0 ? Math.min(perItemPgAmount, paidAmount) : paidAmount;
    refundAmount = Number.isFinite(requested) && requested > 0 ? Math.min(requested, paidAmount) : defaultAmount;
    // Customer-facing amount may differ from the gateway leg (e.g. split PG + Wallet); default to the gateway amount.
    const requestedDisplay = Number(displayAmount);
    emailAmount = Number.isFinite(requestedDisplay) && requestedDisplay > 0 ? requestedDisplay : refundAmount;
    if (!paymentId) {
      return { status: false, message: "Payment id not found for refund" };
    }
    if (paymentBodyData?.refundStatus && !RETRYABLE.has(paymentBodyData.refundStatus)) {
      return { status: true, message: "Refund already initiated", refundStatus: paymentBodyData.refundStatus };
    }

    // Razorpay rejects a reused receipt, so a retry after a failed refund gets a fresh one.
    const receipt = `refund_${corporateTxnId}${paymentBodyData?.refundStatus ? `_r${Date.now()}` : ""}`;
    customLog(logTraceId, "info", { message: "Initiating Razorpay refund", paymentId, refundAmount, corporateTxnId }, "VENDOR");

    const refund = await refundRazorpayPayment({
      paymentId,
      amountRupees: refundAmount,
      receipt,
      notes: { corporateTxnId: String(corporateTxnId) },
    });
    customLog(logTraceId, "info", { message: "Razorpay refund response", response: refund }, "VENDOR");

    // Synchronous SUCCESS is not settlement; the refund webhook confirms it, as with Cashfree.
    // Instant refunds can settle (webhook → SUCCESS) before this write lands — never clobber that.
    const refundStatus = refund.refund_status === "SUCCESS" ? "INITIATED" : refund.refund_status;
    if (await refundAlreadySettled(corporateTxnId)) {
      return { status: true, refundStatus: "SUCCESS", message: "Refund initiated" };
    }
    paymentBodyData.refundStatus = refundStatus;
    paymentBodyData.refundResults = [refund];
    await updateOneOrder(corporateTxnId, { paymentModeResponse: JSON.stringify(paymentBodyData) });

    try {
      const corporateEmail = orderDetails?.credential?.email;
      if (corporateEmail) {
        await paymentRefundInitiatedEmailInternal({
          name: orderDetails?.credential?.name || orderDetails?.credential?.username || "Corporate",
          email: corporateEmail,
          amount: emailAmount,
          transactionId: corporateTxnId,
          serviceProvider,
          typeOfService: serviceCategory,
          registeredBy: orderDetails?.credential?.registeredBy,
        });
      } else {
        customLog(logTraceId, "info", { message: "Corporate email not found in orderDetails, skipping refund initiated email", corporateTxnId });
      }
    } catch (emailError) {
      customLog(logTraceId, "error", { message: "Error while sending refund initiated email", error: emailError });
    }

    return { status: true, refundStatus, message: "Refund initiated" };
  } catch (error) {
    const errorBody = errorBodyOf(error);
    customLog(logTraceId, "error", { message: "Razorpay refund failed", error: errorBody, corporateTxnId }, "VENDOR");

    try {
      const orderDetails = await findOneOrder({ corporateTxnId });
      if (orderDetails?.paymentModeResponse) {
        let failedPaymentBodyData = {};
        try {
          failedPaymentBodyData = JSON.parse(orderDetails.paymentModeResponse);
        } catch (_) {
          failedPaymentBodyData = {};
        }
        failedPaymentBodyData.refundResults = [error?.response?.data ?? null];
        failedPaymentBodyData.refundStatus = "Refund failed";
        await updateOneOrder(corporateTxnId, { paymentModeResponse: JSON.stringify(failedPaymentBodyData) });
      }
    } catch (updateError) {
      customLog(logTraceId, "error", { message: "Error updating order after refund failure", error: updateError });
    }

    try {
      await paymentRefundFailureEmailInternal({ amount: emailAmount, transactionId: corporateTxnId, serviceProvider, typeOfService: serviceCategory });
    } catch (emailError) {
      customLog(logTraceId, "error", { message: "Error while sending refund failure email", error: emailError });
    }

    return { status: false, message: "Something went wrong", error: error?.response?.data };
  }
};

async function paymentRefundFailureEmailInternal({ amount, transactionId, serviceProvider, typeOfService }) {
  const resp = await findByName({ name: "pekoWebsite" });
  const email = resp.emails;
  const partnerData = await partnerLogos();
  const resolved = await resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.REFUND_FAILED,
    service: EMAIL_TEMPLATE_SERVICES.REFUND,
    variables: {
      name: "Admin",
      amount,
      transactionId,
      branding: partnerData?.branding || "Peko",
      website: partnerData?.website || "https://www.peko.one",
      ...v2LayoutVariables(partnerData),
    },
    fallback: () => refundFailure({ name: "Admin", amount, transactionId, serviceProvider, typeOfService }),
    fallbackSubject: "Refund Failed",
  });
  await emailer.email(email, resolved.subject, resolved.html);
}

async function paymentRefundInitiatedEmailInternal({ name, email, amount, transactionId, serviceProvider, typeOfService, registeredBy }) {
  const partnerData = registeredBy ? await fetchPartnerDetails(registeredBy) : await partnerLogos();
  const resolved = await resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.REFUND_INITIATED,
    service: EMAIL_TEMPLATE_SERVICES.REFUND,
    variables: {
      name: name || "Corporate",
      amount,
      branding: partnerData?.branding || "Peko",
      website: partnerData?.website || "https://www.peko.one",
      ...v2LayoutVariables(partnerData),
    },
    fallback: () => refundInitiated({ name: name || "Corporate", amount, transactionId, serviceProvider, typeOfService, partnerDetails: partnerData }),
    fallbackSubject: "Refund Initiated",
  });
  await emailer.email(email, resolved.subject, resolved.html);
}

module.exports = {
  RAZORPAY_ACCESS_KEY,
  RAZORPAY_GATEWAY,
  loadRazorpayCredentials,
  refundRazorpayPayment,
  cancelRazorpayTransaction,
};
