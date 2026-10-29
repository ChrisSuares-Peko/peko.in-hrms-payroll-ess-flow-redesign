const { updateOneOrder, findOneOrder } = require("../models/use-cases/order");
const { findServiceOperatorByAccessKey } = require("./checkAndFetchServiceDetails");
const { customLog } = require("./loggerHelper");
const { default: axios } = require("axios");
const operatorsData = require("./operatorsData.json");
const { refundFailure, refundInitiated } = require("./emailTemplates/common");
const accessKey = operatorsData["cashFreePaymentGateway"]["accessKey"];
const emailer = require("./emailer");
const { findByName } = require("../models/use-cases/setting");
const paymentGatewayOrders = require("../models/entities/paymentGatewayOrders");
const { partnerLogos } = require("./partnerLogos");
const { fetchPartnerDetails } = require("../models/use-cases/systemUser");
const { resolveEmailTemplate } = require("../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("./emailTemplateKeys");
const { v2LayoutVariables } = require("./emailTemplate/sharedLayout");
const { refundAirpayOrder, refundAirpayEarlyExit } = require("./airpayRefunds");
const { isMswipePayment, requestMswipeManualRefund } = require("./mswipeManualRefund");
const { requestMswipeEarlyExitRefund } = require("./mswipeEarlyExitRefund");
const { inAppCancel } = require("./corporateCardsClient");
const { CORPORATE_CARD_GATEWAY } = require("../constants/corporateCardPayment");
const { corporateCardReceipt } = require("./paymentModeKind");

/**
 * Merge a fresh Cashfree payment array into the existing paymentGatewayOrders.paymentResponse
 * while preserving any audit metadata (e.g. earlyExitRefund) that refundCashfreeDirect may
 * have written.
 *
 * Returns the stringified value to store. Callers should use this in place of
 * `JSON.stringify(paymentResponse)` whenever updating paymentGatewayOrders.paymentResponse.
 *
 *   const merged = await buildMergedPaymentResponse(paymentRefId, paymentResponseArray);
 *   await paymentGatewayOrders.update({ paymentResponse: merged }, { where: { paymentRefId } });
 */
exports.buildMergedPaymentResponse = async (paymentRefId, newValue) => {
  try {
    const existing = await paymentGatewayOrders.findOne({ where: { paymentRefId } });
    if (existing?.paymentResponse) {
      try {
        const parsed = JSON.parse(existing.paymentResponse);
        // If existing is the wrapped form (object with audit keys), refresh the
        // cashfreePaymentResponse field but keep the audit keys (earlyExitRefund, etc).
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && parsed.earlyExitRefund) {
          return JSON.stringify({ ...parsed, cashfreePaymentResponse: newValue });
        }
      } catch (_) { /* not JSON or unparseable — fall through to overwrite */ }
    }
  } catch (_) { /* lookup failed — fall through to overwrite */ }
  return JSON.stringify(newValue);
};

const cancelCorporateCardTransaction = async ({ corporateTxnId, orderDetails, paymentBodyData, serviceProvider, serviceCategory }) => {
  const refundAmount = Number(paymentBodyData?.pgAmount || paymentBodyData?.amount || 0);
  if (
    paymentBodyData?.refundStatus &&
    paymentBodyData?.refundStatus !== "Refund failed" &&
    paymentBodyData?.refundStatus !== "FAILED"
  ) {
    return { status: true, message: "Refund already initiated", refundStatus: paymentBodyData.refundStatus };
  }

  const paymentRefId = String(paymentBodyData?.paymentRefId || corporateTxnId);
  customLog(null, "info", { message: "Initiating corporate card cancel redeem", paymentRefId, refundAmount, corporateTxnId }, "VENDOR");
  const cancel = await inAppCancel({ paymentRefId }, { logTraceId: null });
  const receipt = cancel.ok ? cancel.data : null;

  if (!receipt?.cancelled) {
    const message = receipt?.reason || cancel.message || "Card refund failed";
    customLog(null, "error", { message: "Corporate card cancel redeem failed", paymentRefId, corporateTxnId, cardStatus: receipt?.status || null, reason: message }, "VENDOR");
    await updateOneOrder(corporateTxnId, {
      paymentModeResponse: JSON.stringify({ ...paymentBodyData, refundStatus: "Refund failed", refundResults: [receipt || { reason: cancel.reason || null }] }),
    });
    try {
      await paymentRefundFailureEmailInternal({ amount: refundAmount, transactionId: corporateTxnId, serviceProvider, typeOfService: serviceCategory });
    } catch (emailError) {
      customLog(null, "error", { message: "Error while sending refund failure email", error: emailError });
    }
    return { status: false, message };
  }

  // Cancel Redeem credits the card at once; INITIATED keeps every reader of refundStatus on the path it already knows.
  const refundStatus = "INITIATED";
  await updateOneOrder(corporateTxnId, {
    paymentModeResponse: JSON.stringify({ ...paymentBodyData, refundStatus, refundResults: [receipt] }),
  });
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
    }
  } catch (emailError) {
    customLog(null, "error", { message: "Error while sending refund initiated email", error: emailError });
  }
  return { status: true, refundStatus, message: receipt.duplicate ? "Refund already initiated" : "Refund initiated" };
};

exports.cancelPGTransaction = async (corporateTxnId) => {
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
      const parsedResponse = orderDetails?.paymentModeResponse
        ? JSON.parse(orderDetails.paymentModeResponse)
        : {};
      paymentBodyData = parsedResponse?.pgResponse ?? parsedResponse;
      // Only a corporate card receipt is unwrapped from a stored list; a Cashfree list is left exactly as before.
      if (corporateCardReceipt(paymentBodyData)) paymentBodyData = corporateCardReceipt(paymentBodyData);
    } catch (parseError) {
      customLog(null, "error", {
        message: "Invalid paymentModeResponse JSON in order details",
        corporateTxnId,
        error: parseError,
      });
      return { status: false, message: "Invalid payment response details" };
    }

    // Paid on a corporate card: the refund is a Pine Labs Cancel Redeem through corporateCard, not Cashfree.
    // Every caller that refunds a failed service reaches this one branch, so none of them know the difference.
    if (paymentBodyData?.gateway === CORPORATE_CARD_GATEWAY) {
      return cancelCorporateCardTransaction({ corporateTxnId, orderDetails, paymentBodyData, serviceProvider, serviceCategory });
    }

    const order_id = paymentBodyData?.order_id;
    // Prefer the per-item PG share stored by createPGTransaction. For bulk orders one
    // Cashfree payment funds many order rows, so payment_amount is the WHOLE batch -
    // refunding it for a single failed item would refund the entire batch. Floor to
    // 2 decimals so the sum of per-item refunds can never exceed the payment, and
    // clamp to payment_amount so the refund is never larger than what was paid.
    const paymentAmount = Number(paymentBodyData?.payment_amount || 0);
    const perItemPgAmount = Math.floor(Number(paymentBodyData?.pgAmount) * 100) / 100;
    refundAmount = Number.isFinite(perItemPgAmount) && perItemPgAmount > 0
      ? Math.min(perItemPgAmount, paymentAmount)
      : paymentAmount;
    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      return { status: false, message: "Invalid refund amount" };
    }
    if (!order_id) {
      return { status: false, message: "Order id not found for refund" };
    }
    if (
      paymentBodyData?.refundStatus &&
      paymentBodyData?.refundStatus !== "Refund failed" &&
      paymentBodyData?.refundStatus !== "FAILED"
    ) {
      return { status: true, message: "Refund already initiated", refundStatus: paymentBodyData.refundStatus };
    }

    // Airpay white-label payments are refunded through Airpay
    if (paymentBodyData?.gateway === "AIRPAY") {
      return await refundAirpayOrder({ corporateTxnId, orderDetails, paymentBodyData, refundAmount, serviceProvider, serviceCategory });
    }

    if (isMswipePayment(paymentBodyData)) {
      const customer = orderDetails.credential;
      return await requestMswipeManualRefund({
        corporateTxnId,
        paymentBodyData,
        refundAmount,
        saveOrder: (fields) => updateOneOrder(corporateTxnId, fields),
        sendMail: ({ to, subject, html }) => emailer.email({ to, subject, body: html }),
        notifyCustomer: customer?.email
          ? () => paymentRefundInitiatedEmailInternal({
            name: customer.name || customer.username || "Corporate",
            email: customer.email,
            amount: refundAmount,
            transactionId: corporateTxnId,
            serviceProvider,
            typeOfService: serviceCategory,
            registeredBy: customer.registeredBy,
          })
          : undefined,
      });
    }

    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
    customLog(null, "info", { serviceDetails, message: "from cancel pgt transaction" });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return { status: false, message: serviceDetails.error };
    }

    const clientId = orderDetails.serviceOperator?.paymentclientid ?? serviceDetails.vendor.optional1;
    const clientSecret = orderDetails.serviceOperator?.paymentclientsecret ?? serviceDetails.vendor.optional2;
    const baseUrl = serviceDetails.vendor.apiUrl;
    const version = serviceDetails.vendor.optional3;
    if (!clientId || !clientSecret || !baseUrl || !version) {
      return { status: false, message: "Missing Cashfree configuration for refund" };
    }

    const refundBody = {
      refund_id: `refund_${corporateTxnId}`,
      refund_amount: refundAmount,
      refund_note: corporateTxnId.toString(),
      // refund_speed, //STANDARD, INSTANT
    };

    const config = {
      method: "POST",
      url: `${baseUrl}/pg/orders/${order_id}/refunds`,
      headers: {
        "x-api-version": version,
        "x-client-id": clientId,
        "x-client-secret": clientSecret,
        "Content-Type": "application/json",
      },
      data: refundBody,
    };

    customLog(null, "info", { message: "Initiating Cashfree refund", orderId: order_id, refundAmount, corporateTxnId }, "VENDOR");

    const response = await axios(config);

    customLog(null, "info", {
      message: "Cashfree refund response",
      response: response?.data,
    }, "VENDOR");

    const vendorRefundStatus = response?.data?.refund_status;
    const refundStatus = vendorRefundStatus === "SUCCESS" ? "INITIATED" : vendorRefundStatus;
    paymentBodyData.refundStatus = refundStatus;
    paymentBodyData.refundResults = [response?.data];

    await updateOneOrder(corporateTxnId, {
      paymentModeResponse: JSON.stringify(paymentBodyData),
    });

    try {
      const corporateEmail = orderDetails?.credential?.email;
      const corporateName = orderDetails?.credential?.name || orderDetails?.credential?.username || "Corporate";
      const registeredBy = orderDetails?.credential?.registeredBy;

      if (corporateEmail) {
        await paymentRefundInitiatedEmailInternal({
          name: corporateName,
          email: corporateEmail,
          amount: refundAmount,
          transactionId: corporateTxnId,
          serviceProvider,
          typeOfService: serviceCategory,
          registeredBy,
        });
      } else {
        customLog(null, "info", {
          message: "Corporate email not found in orderDetails, skipping refund initiated email",
          corporateTxnId,
        });
      }
    } catch (emailError) {
      customLog(null, "error", {
        message: "Error while sending refund initiated email",
        error: emailError,
      });
    }

    return {
      status: true,
      refundStatus,
      message: "Refund initiated",
    };
  } catch (error) {
    customLog(null, "error", {
      message: "Cashfree refund failed",
      error: error?.response?.data ?? error?.response ?? error?.message ?? error,
      corporateTxnId,
    }, "VENDOR");

    try {
      const orderDetails = await findOneOrder({ corporateTxnId });
      if (orderDetails?.paymentModeResponse) {
        let failedPaymentBodyData = {};
        try {
          failedPaymentBodyData = JSON.parse(orderDetails.paymentModeResponse);
        } catch (parseError) {
          failedPaymentBodyData = {};
        }
        failedPaymentBodyData.refundResults = [error?.response?.data];
        failedPaymentBodyData.refundStatus = "Refund failed";
        await updateOneOrder(corporateTxnId, {
          paymentModeResponse: JSON.stringify(failedPaymentBodyData),
        });
      }
    } catch (updateError) {
      customLog(null, "error", { message: "Error updating order after refund failure", error: updateError });
    }

    try {
      await paymentRefundFailureEmailInternal({
        amount: refundAmount,
        transactionId: corporateTxnId,
        serviceProvider,
        typeOfService: serviceCategory,
      });
    } catch (emailError) {
      customLog(null, "error", {
        message: "Error while sending refund failure email",
        error: emailError,
      });
    }

    return {
      status: false,
      message: "Something went wrong",
      error: error?.response?.data,
    };
  }
};

/**
 * Refund a Cashfree payment WITHOUT requiring an orders-table record.
 *
 * Use this for early-exit refunds in any service flow (BBPS, telecom, travel, e-sim, etc.)
 * where the request is rejected before createPGTransaction runs — so cancelPGTransaction
 * cannot look up the order to refund.
 *
 * Accepts either:
 *   1) Explicit args: { orderId, refundAmount, corporateTxnId, reason, serviceType, logTraceId }
 *   2) An Express `req` object: { req, reason, serviceType } — pulls order_id / payment_amount /
 *      corporateTxnId from req.body.paymentGatewayResponse[0] + req.body.corporateTxnId
 *      and uses req.LogTraceId. No-op if paymentGatewayResponse is absent.
 *
 * `reason` is a free-text label describing why the refund was triggered (logged + persisted).
 * `serviceType` is optional; defaults to "Early-exit refund" in the ops failure email.
 *
 * Side effects beyond the Cashfree refund API:
 *   - Writes `earlyExitRefund` metadata to paymentGatewayOrders.paymentResponse so the
 *     refund is auditable from our DB (Cashfree confirms the order as COMPLETE, so this
 *     is the only DB trace of the failed attempt + refund).
 *   - On refund-API failure, emails ops via paymentRefundFailureEmailInternal.
 */
exports.refundCashfreeDirect = async (args = {}) => {
  // A corporate card payment: the money sits on the card, not with Cashfree, so the early exit cancels the redeem
  // and leaves the same audit marker on the order.
  const cardReceipt = corporateCardReceipt(args.req?.body?.paymentGatewayResponse);
  if (cardReceipt) {
    return refundCorporateCardEarlyExit({
      cardReceipt,
      corporateTxnId: args.corporateTxnId ?? args.req?.body?.corporateTxnId,
      refundAmount: args.refundAmount ?? Number(cardReceipt.pgAmount || cardReceipt.payment_amount || 0),
      reason: args.reason,
      serviceType: args.serviceType,
      logTraceId: args.logTraceId ?? args.req?.LogTraceId,
    });
  }

  // Normalize args — support both the explicit form and the (req, reason) form.
  let orderId = args.orderId;
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
    orderId = orderId ?? pgResp.order_id;
    refundAmount = refundAmount ?? Number(pgResp.payment_amount || 0);
    corporateTxnId = corporateTxnId ?? args.req.body?.corporateTxnId;
    logTraceId = logTraceId ?? args.req?.LogTraceId;
  }

  // Airpay white-label payments are refunded through Airpay
  if (args.req?.body?.paymentGatewayResponse?.[0]?.gateway === "AIRPAY") {
    return refundAirpayEarlyExit({ pgResp: args.req.body.paymentGatewayResponse[0], corporateTxnId, reason, serviceType, logTraceId });
  }

  if (isMswipePayment(args.req?.body?.paymentGatewayResponse)) {
    return requestMswipeEarlyExitRefund({ req: args.req, corporateTxnId, refundAmount, reason, serviceType, logTraceId });
  }

  let refundResult;
  try {
    if (!orderId) return { status: false, message: "Cashfree order_id missing" };
    const amount = Number(refundAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { status: false, message: "Invalid refund amount" };
    }
    if (!corporateTxnId) return { status: false, message: "corporateTxnId missing" };

    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return { status: false, message: serviceDetails.error };
    }

    const clientId = serviceDetails.vendor.optional1;
    const clientSecret = serviceDetails.vendor.optional2;
    const baseUrl = serviceDetails.vendor.apiUrl;
    const version = serviceDetails.vendor.optional3;
    if (!clientId || !clientSecret || !baseUrl || !version) {
      return { status: false, message: "Missing Cashfree configuration for refund" };
    }

    const refundBody = {
      refund_id: `refund_${corporateTxnId}_${Date.now()}`,
      refund_amount: amount,
      refund_note: reason || corporateTxnId.toString(),
    };

    customLog(logTraceId, "info", {
      message: "Initiating direct Cashfree refund (early-exit, no orders row)",
      orderId,
      refundAmount: amount,
      corporateTxnId,
      reason,
      serviceType,
    }, "VENDOR");

    const response = await axios({
      method: "POST",
      url: `${baseUrl}/pg/orders/${orderId}/refunds`,
      headers: {
        "x-api-version": version,
        "x-client-id": clientId,
        "x-client-secret": clientSecret,
        "Content-Type": "application/json",
      },
      data: refundBody,
    });

    customLog(logTraceId, "info", {
      message: "Direct Cashfree refund response",
      response: response?.data,
      corporateTxnId,
    }, "VENDOR");

    refundResult = {
      status: true,
      refundStatus: response?.data?.refund_status,
      message: "Refund initiated",
      data: response?.data,
    };
  } catch (error) {
    customLog(logTraceId, "error", {
      message: "Direct Cashfree refund failed",
      error: error?.response?.data ?? error?.message ?? error,
      corporateTxnId,
    }, "VENDOR");

    // Notify ops so the refund can be processed manually.
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

    refundResult = {
      status: false,
      message: "Refund failed",
      error: error?.response?.data ?? error?.message,
    };
  }

  await writeEarlyExitMarker({ corporateTxnId, reason, refundAmount, orderId, refundResult, logTraceId });
  return refundResult;
};

// Write the refund trail to paymentGatewayOrders.paymentResponse so it's auditable
// from our DB. handlePGCallback uses this marker to surface failure on /complete polling.
//
// paymentResponse normally holds the Cashfree payment array (set by handlePGCallback).
// We preserve that array under `cashfreePaymentResponse` and add `earlyExitRefund` alongside.
async function writeEarlyExitMarker({ corporateTxnId, reason, refundAmount, orderId, refundResult, logTraceId }) {
  if (!corporateTxnId) return;
  try {
    const paymentRefId = String(corporateTxnId);
    const existing = await paymentGatewayOrders.findOne({ where: { paymentRefId } });

    let wrapper = {};
    if (existing?.paymentResponse) {
      try {
        const parsed = JSON.parse(existing.paymentResponse);
        if (Array.isArray(parsed)) {
          wrapper = { cashfreePaymentResponse: parsed };
        } else if (parsed && typeof parsed === "object") {
          wrapper = parsed;
        }
      } catch (_) { /* invalid JSON — start fresh */ }
    }

    wrapper.earlyExitRefund = {
      reason: reason || null,
      initiatedAt: new Date().toISOString(),
      refundStatus: refundResult?.refundStatus || (refundResult?.status ? "INITIATED" : "FAILED"),
      refundAmount: Number(refundAmount) || 0,
      cashfreeOrderId: orderId || null,
      response: refundResult?.data ?? refundResult?.error ?? null,
    };

    await paymentGatewayOrders.update(
      { paymentResponse: JSON.stringify(wrapper) },
      { where: { paymentRefId } }
    );
  } catch (writeErr) {
    customLog(logTraceId, "error", {
      message: "Failed to write earlyExitRefund metadata to paymentGatewayOrders",
      corporateTxnId,
      error: writeErr?.message,
    }, "VENDOR");
  }
}

// Early exit on a corporate card payment: Cancel Redeem through corporateCard, same result shape and audit
// marker as the Cashfree direct refund, same ops mail when it fails.
async function refundCorporateCardEarlyExit({ cardReceipt, corporateTxnId, refundAmount, reason, serviceType, logTraceId }) {
  const paymentRefId = String(cardReceipt.paymentRefId || corporateTxnId || "");
  let refundResult;
  if (!paymentRefId) {
    refundResult = { status: false, message: "corporateTxnId missing" };
  } else {
    customLog(logTraceId, "info", { message: "Initiating corporate card cancel redeem (early-exit, no orders row)", paymentRefId, refundAmount, reason, serviceType }, "VENDOR");
    const cancel = await inAppCancel({ paymentRefId }, { logTraceId });
    const receipt = cancel.ok ? cancel.data : null;
    if (receipt?.cancelled) {
      refundResult = { status: true, refundStatus: "INITIATED", message: "Refund initiated", data: receipt };
    } else {
      customLog(logTraceId, "error", { message: "Corporate card early-exit cancel failed", paymentRefId, cardStatus: receipt?.status || null, reason: receipt?.reason || cancel.message }, "VENDOR");
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
      refundResult = { status: false, message: "Refund failed", error: receipt ?? cancel.message };
    }
  }
  await writeEarlyExitMarker({ corporateTxnId, reason, refundAmount, orderId: null, refundResult, logTraceId });
  return refundResult;
}

async function paymentRefundFailureEmailInternal({ amount, transactionId, serviceProvider, typeOfService }) {

  const resp = await findByName({name: "pekoWebsite"})
  const email = resp.emails;
  const partnerData = await partnerLogos();
  const resolved = await resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.REFUND_FAILED,
    service: EMAIL_TEMPLATE_SERVICES.REFUND,
    variables: {
      name: 'Admin',
      amount,
      transactionId,
      branding: partnerData?.branding || 'Peko',
      website: partnerData?.baseUrl || 'https://peko.one/in',
      ...v2LayoutVariables(partnerData),
    },
    fallback: () => refundFailure({
      name:"Admin",
      amount,
      transactionId: transactionId,
      serviceProvider,
      typeOfService,
    }),
    fallbackSubject: 'Refund Failed',
  });
  await emailer.email({to:email, subject:resolved.subject, body:resolved.html});

}

async function paymentRefundInitiatedEmailInternal({ name, email, amount, transactionId, serviceProvider, typeOfService, registeredBy }) {
  const partnerData = registeredBy ? await fetchPartnerDetails(registeredBy) : await partnerLogos();
  const resolved = await resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.REFUND_INITIATED,
    service: EMAIL_TEMPLATE_SERVICES.REFUND,
    variables: {
      name: name || 'Corporate',
      amount,
      branding: partnerData?.branding || 'Peko',
      website: partnerData?.baseUrl || 'https://peko.one/in',
      ...v2LayoutVariables(partnerData),
    },
    fallback: () => refundInitiated({
      name: name || "Corporate",
      amount,
      transactionId,
      serviceProvider,
      typeOfService,
    }, partnerData),
    fallbackSubject: 'Refund Initiated',
  });
  await emailer.email({to:email, subject:resolved.subject, body:resolved.html});
}
