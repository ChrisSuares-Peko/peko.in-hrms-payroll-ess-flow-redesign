/**
 * Razorpay twins of cashfreeGateway.cancelPGTransaction / refundCashfreeDirect. Same inputs,
 * same write-back into orders.paymentModeResponse / paymentGatewayOrders.paymentResponse,
 * same emails — only the gateway call differs. Callers go through utils/pgRefund.js, which
 * picks this or the Cashfree implementation from the gateway tag stored on the order.
 */
const { updateOneOrder, findOneOrder } = require("../models/use-cases/order");
const { customLog } = require("./loggerHelper");
const { refundFailure, refundInitiated } = require("./emailTemplates/common");
const emailer = require("./emailer");
const { findByName } = require("../models/use-cases/setting");
const paymentGatewayOrders = require("../models/entities/paymentGatewayOrders");
const { partnerLogos } = require("./partnerLogos");
const { fetchPartnerDetails } = require("../models/use-cases/systemUser");
const { resolveEmailTemplate } = require("../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("./emailTemplateKeys");
const { v2LayoutVariables } = require("./emailTemplate/sharedLayout");
const { refundRazorpayPayment, razorpayErrorBody } = require("./razorpayGateway");

const RETRYABLE = new Set(["Refund failed", "FAILED"]);

const refundAlreadySettled = async (corporateTxnId) => {
  try {
    const fresh = await findOneOrder({ corporateTxnId });
    const parsed = fresh?.paymentModeResponse ? JSON.parse(fresh.paymentModeResponse) : {};
    return (parsed?.pgResponse ?? parsed)?.refundStatus === "SUCCESS";
  } catch (_) {
    return false;
  }
};

/** Full refund of the PG leg of an orders row paid through Razorpay. */
exports.cancelRazorpayTransaction = async (corporateTxnId) => {
  let refundAmount = 0;
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
      customLog(null, "error", { message: "Invalid paymentModeResponse JSON in order details", corporateTxnId, error: parseError });
      return { status: false, message: "Invalid payment response details" };
    }

    const paymentId = paymentBodyData?.payment_id;
    // Per-item PG share for bulk orders (one payment funds many rows), capped at what was paid.
    const paymentAmount = Number(paymentBodyData?.payment_amount || 0);
    const perItemPgAmount = Math.floor(Number(paymentBodyData?.pgAmount) * 100) / 100;
    refundAmount = Number.isFinite(perItemPgAmount) && perItemPgAmount > 0
      ? Math.min(perItemPgAmount, paymentAmount)
      : paymentAmount;
    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      return { status: false, message: "Invalid refund amount" };
    }
    if (!paymentId) {
      return { status: false, message: "Payment id not found for refund" };
    }
    if (paymentBodyData?.refundStatus && !RETRYABLE.has(paymentBodyData.refundStatus)) {
      return { status: true, message: "Refund already initiated", refundStatus: paymentBodyData.refundStatus };
    }

    // Razorpay rejects a reused receipt, so a retry after a failed refund gets a fresh one.
    const receipt = `refund_${corporateTxnId}${paymentBodyData?.refundStatus ? `_r${Date.now()}` : ""}`;
    customLog(null, "info", { message: "Initiating Razorpay refund", paymentId, refundAmount, corporateTxnId }, "VENDOR");

    const refund = await refundRazorpayPayment({
      paymentId,
      amountRupees: refundAmount,
      receipt,
      notes: { corporateTxnId: String(corporateTxnId) },
    });
    customLog(null, "info", { message: "Razorpay refund response", response: refund }, "VENDOR");

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
          amount: refundAmount,
          transactionId: corporateTxnId,
          serviceProvider,
          typeOfService: serviceCategory,
          registeredBy: orderDetails?.credential?.registeredBy,
        });
      } else {
        customLog(null, "info", { message: "Corporate email not found in orderDetails, skipping refund initiated email", corporateTxnId });
      }
    } catch (emailError) {
      customLog(null, "error", { message: "Error while sending refund initiated email", error: emailError });
    }

    return { status: true, refundStatus, message: "Refund initiated" };
  } catch (error) {
    const errorBody = razorpayErrorBody(error);
    customLog(null, "error", { message: "Razorpay refund failed", error: errorBody, corporateTxnId }, "VENDOR");

    try {
      const orderDetails = await findOneOrder({ corporateTxnId });
      if (orderDetails?.paymentModeResponse) {
        let failedPaymentBodyData = {};
        try {
          failedPaymentBodyData = JSON.parse(orderDetails.paymentModeResponse);
        } catch (_) {
          failedPaymentBodyData = {};
        }
        failedPaymentBodyData.refundResults = [errorBody];
        failedPaymentBodyData.refundStatus = "Refund failed";
        await updateOneOrder(corporateTxnId, { paymentModeResponse: JSON.stringify(failedPaymentBodyData) });
      }
    } catch (updateError) {
      customLog(null, "error", { message: "Error updating order after refund failure", error: updateError });
    }

    try {
      await paymentRefundFailureEmailInternal({ amount: refundAmount, transactionId: corporateTxnId, serviceProvider, typeOfService: serviceCategory });
    } catch (emailError) {
      customLog(null, "error", { message: "Error while sending refund failure email", error: emailError });
    }

    return { status: false, message: "Something went wrong", error: errorBody };
  }
};

/**
 * Early-exit refund before an orders row exists (same contract as refundCashfreeDirect):
 * explicit { paymentId, refundAmount, corporateTxnId, reason, serviceType, logTraceId } or
 * { req, reason, serviceType } reading req.body.paymentGatewayResponse[0] + req.body.corporateTxnId.
 */
exports.refundRazorpayDirect = async (args = {}) => {
  let paymentId = args.paymentId;
  let refundAmount = args.refundAmount;
  let corporateTxnId = args.corporateTxnId;
  const reason = args.reason;
  const serviceType = args.serviceType;
  let logTraceId = args.logTraceId;

  if (args.req) {
    const pgResp = args.req.body?.paymentGatewayResponse?.[0];
    if (!pgResp) {
      return { status: false, skipped: true, message: "No paymentGatewayResponse on request" };
    }
    paymentId = paymentId ?? pgResp.payment_id;
    refundAmount = refundAmount ?? Number(pgResp.payment_amount || 0);
    corporateTxnId = corporateTxnId ?? args.req.body?.corporateTxnId;
    logTraceId = logTraceId ?? args.req?.LogTraceId;
  }

  let refundResult;
  try {
    if (!paymentId) return { status: false, message: "Razorpay payment_id missing" };
    const amount = Number(refundAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { status: false, message: "Invalid refund amount" };
    }
    if (!corporateTxnId) return { status: false, message: "corporateTxnId missing" };

    customLog(logTraceId, "info", {
      message: "Initiating direct Razorpay refund (early-exit, no orders row)",
      paymentId, refundAmount: amount, corporateTxnId, reason, serviceType,
    }, "VENDOR");

    const refund = await refundRazorpayPayment({
      paymentId,
      amountRupees: amount,
      receipt: `refund_${corporateTxnId}_${Date.now()}`,
      notes: { corporateTxnId: String(corporateTxnId), reason: String(reason || "").slice(0, 256) },
    });
    customLog(logTraceId, "info", { message: "Direct Razorpay refund response", response: refund, corporateTxnId }, "VENDOR");

    refundResult = { status: true, refundStatus: refund.refund_status, message: "Refund initiated", data: refund };
  } catch (error) {
    const errorBody = razorpayErrorBody(error);
    customLog(logTraceId, "error", { message: "Direct Razorpay refund failed", error: errorBody, corporateTxnId }, "VENDOR");
    try {
      await paymentRefundFailureEmailInternal({
        amount: refundAmount,
        transactionId: corporateTxnId,
        serviceProvider: reason || "Early-exit refund",
        typeOfService: serviceType || "Early-exit refund",
      });
    } catch (emailError) {
      customLog(logTraceId, "error", { message: "Error sending refund failure email", error: emailError });
    }
    refundResult = { status: false, message: "Refund failed", error: errorBody };
  }

  // Same audit trail handlePGCallback/completePayment read to surface failure on polling.
  if (corporateTxnId) {
    try {
      const paymentRefId = String(corporateTxnId);
      const existing = await paymentGatewayOrders.findOne({ where: { paymentRefId } });
      let wrapper = {};
      if (existing?.paymentResponse) {
        try {
          const parsed = JSON.parse(existing.paymentResponse);
          if (Array.isArray(parsed)) wrapper = { cashfreePaymentResponse: parsed };
          else if (parsed && typeof parsed === "object") wrapper = parsed;
        } catch (_) { /* invalid JSON — start fresh */ }
      }
      wrapper.earlyExitRefund = {
        reason: reason || null,
        initiatedAt: new Date().toISOString(),
        refundStatus: refundResult?.refundStatus || (refundResult?.status ? "INITIATED" : "FAILED"),
        refundAmount: Number(refundAmount) || 0,
        razorpayPaymentId: paymentId || null,
        response: refundResult?.data ?? refundResult?.error ?? null,
      };
      await paymentGatewayOrders.update({ paymentResponse: JSON.stringify(wrapper) }, { where: { paymentRefId } });
    } catch (writeErr) {
      customLog(logTraceId, "error", { message: "Failed to write earlyExitRefund metadata to paymentGatewayOrders", corporateTxnId, error: writeErr?.message }, "VENDOR");
    }
  }

  return refundResult;
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
      website: partnerData?.baseUrl || "https://peko.one/in",
      ...v2LayoutVariables(partnerData),
    },
    fallback: () => refundFailure({ name: "Admin", amount, transactionId, serviceProvider, typeOfService }),
    fallbackSubject: "Refund Failed",
  });
  await emailer.email({ to: email, subject: resolved.subject, body: resolved.html });
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
      website: partnerData?.baseUrl || "https://peko.one/in",
      ...v2LayoutVariables(partnerData),
    },
    fallback: () => refundInitiated({ name: name || "Corporate", amount, transactionId, serviceProvider, typeOfService }, partnerData),
    fallbackSubject: "Refund Initiated",
  });
  await emailer.email({ to: email, subject: resolved.subject, body: resolved.html });
}
