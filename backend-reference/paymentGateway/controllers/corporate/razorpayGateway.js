const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const paymentGatewayOrders = require("../../models/entities/paymentGatewayOrders");
const walletEntity = require("../../models/entities/wallet");
const { ORDER_KIND } = require("../../constants/orderKind");
const operatorsData = require("../../utils/operatorsData.json");
const { customLog } = require("../../utils/loggerHelper");
const { getValue } = require("../../utils/cacheDataMethods");
const { findOneOrder, updateOneOrder } = require("../../models/use-cases/order");
const { updateOneTransaction } = require("../../models/use-cases/transaction");
const { findUserDetails } = require("../../utils/jwtToken");
const { notifyPGPaymentConfirmed } = require("../../utils/pusherNotification");
const { resolveRefundOrderStatus } = require("../../utils/refundOrderStatus");
const { sendOndcRefundCreditedEmail } = require("../../services/ondcPaymentNotify");
const {
  findOrCreateWebhookEvent,
  markWebhookProcessed,
  markWebhookFailed,
} = require("../../models/use-cases/webhookEvent");
const {
  RAZORPAY_GATEWAY,
  loadRazorpayCredentials,
  createRazorpayOrder,
  fetchRazorpayOrderPayments,
  deriveOrderStatus,
  verifyCheckoutSignature,
  verifyWebhookSignature,
  normalizeRazorpayRefund,
  razorpayErrorBody,
} = require("../../utils/razorpayGateway");
const { resolveServicePaymentHandler, dispatchServicePayment } = require("../../services/dispatchServicePayment");
const { resolveProviderCode } = require("../../utils/pgProvider");

const GENERIC_ERROR_MESSAGE = "We’re experiencing a temporary issue. Please try again later. If the problem continues, contact us at reach@peko.one.";
const WEBHOOK_SOURCE = "razorpay";
const RAZORPAY_CODE = "RAZORPAY";

const toContact = (mobile) => {
  const digits = String(mobile || "").replace(/\D/g, "");
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  return local.length === 10 ? `+91${local}` : "";
};

const extractPaymentMode = (payments) => {
  const first = Array.isArray(payments) ? payments[0] : null;
  return first?.payment_group || first?.payment_method?.card?.card_type || null;
};

const walletBalanceOf = async (credentialId) => {
  const walletData = await walletEntity.findOne({ where: { credentialId }, attributes: ["balance"] });
  return walletData?.balance ?? null;
};

const serviceTypeOf = (accessKey) =>
  Object.values(operatorsData).find((op) => op.accessKey === accessKey)?.type || null;

const parsePaymentData = (orderDetails) => {
  try {
    return JSON.parse(orderDetails.paymentData || "{}");
  } catch (_) {
    return {};
  }
};

// POST /payment-gateway/razorpay-gateway/create-order (after validateAmount)
exports.createOrder = asyncHandler(async (req, res, next) => {
  const serviceAccessKey = req.body.accessKey;
  const supported = Array.isArray(req.body.orderGroups)
    || resolveServicePaymentHandler({ accessKey: serviceAccessKey, body: req.body });
  if (!supported) {
    return next(new ErrorResponse("This service is not available on this payment gateway", 400));
  }
  // The admin's payment_methods rows decide the gateway; the FE's choice is not trusted.
  const providerAccessKey = serviceAccessKey || (Array.isArray(req.body.orderGroups) ? "esim" : null);
  const provider = await resolveProviderCode({ partnerId: req.user.registeredBy, accessKey: providerAccessKey });
  if (provider !== RAZORPAY_CODE) {
    return next(new ErrorResponse("This service is not enabled on this payment gateway", 400));
  }

  const creds = await loadRazorpayCredentials();
  if (!creds) {
    customLog(req?.LogTraceId, "error", { message: "Razorpay credentials missing on razorpay_pg vendor row" });
    return next(new ErrorResponse("Payment gateway not configured", 500));
  }

  const amount = Number(parseFloat(req.body.pgAmount).toFixed(2));
  if (!Number.isFinite(amount) || amount < 1) {
    return next(new ErrorResponse("Invalid payment amount", 400));
  }

  const paymentRefId = new Date().valueOf();
  const receipt = `${req.user.role === "CORPORATE_SUB_USER" ? "pekoSub" : "peko"}_${paymentRefId}`;
  const persistedPaymentData = {
    ...req.body,
    paymentRefId,
    receipt,
    gateway: RAZORPAY_GATEWAY,
    userId: req.user.id,
    corporateId: req.user.corporateId,
    role: req.user.role,
    ...(req.user.role === "CORPORATE_SUB_USER" && {
      subCorporateId: req.user.subCorporateId,
      subCorporateUsername: req.user.subCorporateUsername,
    }),
  };
  await paymentGatewayOrders.create({
    paymentRefId,
    orderKind: ORDER_KIND.PAYMENT_GATEWAY,
    paymentData: JSON.stringify(persistedPaymentData),
    status: "PENDING",
    credentialId: req.user.id,
  });

  try {
    const order = await createRazorpayOrder({
      creds,
      amountRupees: amount,
      receipt,
      notes: {
        paymentRefId: String(paymentRefId),
        accessKey: String(serviceAccessKey || (Array.isArray(req.body.orderGroups) ? "esim" : "")),
        corporateId: String(req.user.corporateId ?? ""),
        userId: String(req.user.id),
      },
    });
    await paymentGatewayOrders.update(
      { status: "ORDERED", referenceNo: order.id },
      { where: { paymentRefId } }
    );
    customLog(req?.LogTraceId, "info", {
      message: "Razorpay order created",
      paymentRefId,
      razorpayOrderId: order.id,
      amount,
      accessKey: serviceAccessKey,
    }, "VENDOR");

    return res.status(201).json({
      status: true,
      message: "Order created successfully",
      responseCode: "000",
      data: {
        amount,
        orderId: paymentRefId,
        razorpayOrderId: order.id,
        keyId: creds.keyId,
        currency: "INR",
        prefill: {
          name: req.user.name || "",
          email: req.user.email || "",
          contact: toContact(req.user.mobileNo || req.user.mobile),
        },
      },
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "Razorpay order creation failed",
      paymentRefId,
      error: razorpayErrorBody(error),
    }, "VENDOR");
    return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 501));
  }
});

// Bulk eSIM settles per item (no orders row under paymentRefId); the worker's Redis keys are the result.
const respondBulkEsimIfReady = async ({ req, res, paymentBodyData, paymentRefId }) => {
  const isMultiVendor = Array.isArray(paymentBodyData.orderGroups);
  const isEsim = ["esim", "esim_tunz"].includes(paymentBodyData.accessKey) || isMultiVendor;
  const totalQty = isMultiVendor
    ? paymentBodyData.orderGroups.reduce((s, g) => s + (g.orders || []).reduce((a, o) => a + (Number(o.quantity) || 0), 0), 0)
    : (paymentBodyData.orders || []).reduce((s, o) => s + (Number(o.quantity) || 0), 0);
  if (!isEsim || totalQty <= 1) return false;

  const redisKeyOrKeys = isMultiVendor
    ? paymentBodyData.orderGroups.map((_, i) => `esim:payment:order:${paymentRefId}:vendor${i}`)
    : `esim:payment:order:${paymentRefId}`;
  const keys = Array.isArray(redisKeyOrKeys) ? redisKeyOrKeys : [redisKeyOrKeys];
  const cached = await Promise.all(keys.map((k) => getValue(k)));
  if (!cached.every((v) => v !== null && v !== undefined)) return false;

  res.status(200).json({
    status: true,
    message: "Payment Successful",
    responseCode: "000",
    data: {
      bulkPaymentData: redisKeyOrKeys,
      corporateFinalBalance: await walletBalanceOf(req.user.id),
      paymentMode: paymentBodyData.paymentMode || null,
    },
  });
  return true;
};

// Order already settled by a previous /complete or the webhook — answer from our own rows.
const respondAlreadyComplete = async ({ req, res, orderDetails, paymentBodyData, paymentRefId }) => {
  if (await respondBulkEsimIfReady({ req, res, paymentBodyData, paymentRefId })) return undefined;
  let earlyExitRefund = null;
  let storedPayments = null;
  try {
    const parsed = orderDetails.paymentResponse ? JSON.parse(orderDetails.paymentResponse) : null;
    earlyExitRefund = parsed?.earlyExitRefund || null;
    storedPayments = Array.isArray(parsed) ? parsed : parsed?.cashfreePaymentResponse || null;
  } catch (_) { /* paymentResponse not JSON */ }

  const corporateFinalBalance = await walletBalanceOf(req.user.id);
  if (earlyExitRefund) {
    return res.status(400).json({
      status: false,
      data: {
        failed: true,
        corporateTxnId: paymentRefId,
        corporateFinalBalance,
        refundStatus: earlyExitRefund.refundStatus,
        refundAmount: earlyExitRefund.refundAmount,
        reason: earlyExitRefund.reason,
      },
      message: "Payment failed and refund has been initiated.",
      responseCode: "001",
    });
  }

  const txn = await findOneOrder({ corporateTxnId: String(paymentRefId) });
  if (!txn || ["AWAITED", "PENDING", "PROCESSING"].includes(txn.status)) {
    let billDetails = null;
    try {
      billDetails = txn?.orderResponse ? JSON.parse(txn.orderResponse)?.billDetails : null;
    } catch (_) { /* orderResponse missing or malformed */ }
    const serviceType = serviceTypeOf(paymentBodyData.accessKey);
    return res.status(200).json({
      status: true,
      data: {
        processing: true,
        ...(billDetails || {}),
        corporateTxnId: paymentRefId,
        paymentMode: txn?.paymentMode || paymentBodyData.paymentMode || null,
        corporateFinalBalance,
        ...(serviceType && { serviceProvider: serviceType }),
      },
      message: "Payment is processing",
      responseCode: "001",
    });
  }
  if (txn.status === "SUCCESS") {
    return res.status(200).json({
      status: true,
      message: "Payment already processed successfully",
      responseCode: "000",
      data: {
        paymentRefId: orderDetails.paymentRefId,
        corporateTxnId: orderDetails.paymentRefId,
        amount: paymentBodyData.amount,
        accessKey: paymentBodyData.accessKey,
        account: paymentBodyData.account,
        paymentMode: extractPaymentMode(storedPayments) || paymentBodyData.paymentMode || null,
        paymentGatewayResponse: storedPayments,
        corporateFinalBalance,
        ...(paymentBodyData.accessKey === operatorsData["visa"]["accessKey"] && { orderNumber: txn.providerId }),
      },
    });
  }
  return res.status(400).json({
    status: false,
    data: { corporateFinalBalance },
    message: "payment failed",
    responseCode: "001",
  });
};

// Shared by /complete and the webhook: fetch the order's payments from Razorpay, settle
// ORDERED → COMPLETE once (CAS), then hand off to the service handler, which writes the response.
const settleOrder = async ({ req, res, next, orderDetails, paymentBodyData, creds, source }) => {
  const paymentRefId = String(orderDetails.paymentRefId);
  const payments = await fetchRazorpayOrderPayments({
    creds,
    razorpayOrderId: orderDetails.referenceNo,
    receipt: paymentBodyData.receipt,
  });
  const orderStatus = deriveOrderStatus(payments);
  customLog(req?.LogTraceId, "info", {
    message: `Razorpay payments fetched (${source})`,
    paymentRefId,
    razorpayOrderId: orderDetails.referenceNo,
    orderStatus,
    attempts: payments.length,
  }, "VENDOR");

  if (orderStatus === "PENDING") {
    await paymentGatewayOrders.update({ paymentResponse: JSON.stringify(payments) }, { where: { paymentRefId } });
    // corporateTxnId lets the pending page keep polling (authorized-but-uncaptured settles on capture).
    return res.status(200).json({
      status: true,
      data: { pending: true, corporateTxnId: paymentRefId, accessKey: paymentBodyData.accessKey },
      message: "payment pending",
      responseCode: "000",
    });
  }

  if (orderStatus !== "SUCCESS") {
    await paymentGatewayOrders.update(
      { status: "FAILED", paymentResponse: JSON.stringify(payments) },
      { where: { paymentRefId, status: { [Op.ne]: "FAILED" } } }
    );
    if (source === "webhook") {
      return res.status(200).json({ status: true, message: "Event received", responseCode: "001" });
    }
    return next(new ErrorResponse("Payment failed", 502));
  }

  const [affectedCount] = await paymentGatewayOrders.update(
    { status: "COMPLETE", paymentResponse: JSON.stringify(payments) },
    { where: { paymentRefId, status: "ORDERED" } }
  );
  if (affectedCount === 0) {
    customLog(req?.LogTraceId, "info", { message: `Razorpay settle (${source}): lost CAS race, order already claimed`, paymentRefId });
    if (source === "webhook") {
      return res.status(200).json({ status: true, message: "Payment already being processed", responseCode: "000" });
    }
    const refreshed = await paymentGatewayOrders.findOne({ where: { paymentRefId } });
    return respondAlreadyComplete({ req, res, orderDetails: refreshed, paymentBodyData, paymentRefId });
  }

  req.body = { ...paymentBodyData, corporateTxnId: paymentRefId, paymentGatewayResponse: payments };
  try {
    await dispatchServicePayment({ req, res, next, paymentRefId });
  } catch (paymentError) {
    customLog(req?.LogTraceId, "error", {
      message: `Razorpay settle (${source}): service dispatch error`,
      error: paymentError?.message ?? paymentError,
      paymentRefId,
      accessKey: paymentBodyData.accessKey,
    }, "VENDOR");
    await paymentGatewayOrders.update(
      { status: "FAILED", paymentResponse: JSON.stringify(payments) },
      { where: { paymentRefId } }
    );
    if (source === "webhook") return res.status(500).json({ status: false, message: "Payment processing failed" });
    return next(new ErrorResponse("Payment processing failed", 500));
  }

  if (source === "webhook") {
    try {
      const settledTxn = await findOneOrder({ corporateTxnId: paymentRefId });
      const settledStatus = settledTxn?.status === "SUCCESS"
        ? "SUCCESS"
        : ["FAILURE", "FAILED", "REFUNDED"].includes(settledTxn?.status) ? "FAILURE" : null;
      if (settledStatus) await notifyPGPaymentConfirmed(paymentBodyData.userId, null, paymentRefId, null, settledStatus);
    } catch (notifyError) {
      customLog(req?.LogTraceId, "error", { message: "Razorpay webhook: Pusher notify failed", paymentRefId, error: notifyError?.message }, "VENDOR");
    }
  }
  return undefined;
};

// POST /payment-gateway/razorpay-gateway/complete { ORDERID, razorpay_payment_id?, razorpay_order_id?, razorpay_signature? }
exports.completePayment = asyncHandler(async (req, res, next) => {
  const paymentRefId = String(req.body.ORDERID || "");
  const orderDetails = await paymentGatewayOrders.findOne({ where: { paymentRefId } });
  if (!orderDetails) return next(new ErrorResponse("Order details not found", 400));

  const paymentBodyData = parsePaymentData(orderDetails);
  if (paymentBodyData.gateway !== RAZORPAY_GATEWAY) {
    return next(new ErrorResponse("Order does not belong to this payment gateway", 400));
  }
  if (String(paymentBodyData.userId) !== String(req.user.id)) {
    customLog(req?.LogTraceId, "error", { message: "Razorpay complete: user mismatch", paymentRefId, expected: paymentBodyData.userId, got: req.user.id });
    return next(new ErrorResponse("Unauthorized", 403));
  }

  if (orderDetails.status === "COMPLETE") {
    return respondAlreadyComplete({ req, res, orderDetails, paymentBodyData, paymentRefId });
  }
  if (orderDetails.status !== "ORDERED") {
    return res.status(400).json({
      status: false,
      data: { failed: true, corporateFinalBalance: await walletBalanceOf(req.user.id) },
      message: "Payment failed",
      responseCode: "001",
    });
  }

  const creds = await loadRazorpayCredentials();
  if (!creds) return next(new ErrorResponse("Payment gateway not configured", 500));

  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
  if (razorpay_signature) {
    const matchesOrder = !razorpay_order_id || razorpay_order_id === orderDetails.referenceNo;
    const valid = matchesOrder && verifyCheckoutSignature({
      creds,
      razorpayOrderId: orderDetails.referenceNo,
      razorpayPaymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    if (!valid) {
      customLog(req?.LogTraceId, "error", { message: "Razorpay checkout signature mismatch", paymentRefId, razorpay_order_id, razorpay_payment_id }, "VENDOR");
      return next(new ErrorResponse("Payment verification failed", 400));
    }
  }

  try {
    return await settleOrder({ req, res, next, orderDetails, paymentBodyData, creds, source: "callback" });
  } catch (error) {
    // Transient (Razorpay fetch/DB): the order stays ORDERED so the pending page's poll or the
    // webhook can still settle it. Marking it FAILED here would refund a good capture later.
    customLog(req?.LogTraceId, "error", { message: "Error in Razorpay completePayment", paymentRefId, error: razorpayErrorBody(error) }, "VENDOR");
    return res.status(200).json({
      status: true,
      data: { processing: true, corporateTxnId: paymentRefId, accessKey: paymentBodyData.accessKey },
      message: "payment processing",
      responseCode: "000",
    });
  }
});

const findOrderForPayment = async (payment) => {
  const byRef = payment?.notes?.paymentRefId
    ? await paymentGatewayOrders.findOne({ where: { paymentRefId: String(payment.notes.paymentRefId) } })
    : null;
  if (byRef) return byRef;
  return payment?.order_id
    ? paymentGatewayOrders.findOne({ where: { referenceNo: payment.order_id, orderKind: ORDER_KIND.PAYMENT_GATEWAY } })
    : null;
};

const onPaymentCaptured = async ({ req, res, next, payment, creds }) => {
  const orderDetails = await findOrderForPayment(payment);
  if (!orderDetails) {
    customLog(req?.LogTraceId, "error", { message: "Razorpay webhook: no order for payment", paymentId: payment?.id, razorpayOrderId: payment?.order_id }, "VENDOR");
    return res.status(200).json({ status: false, message: "Order details not found", responseCode: "002" });
  }
  const paymentBodyData = parsePaymentData(orderDetails);
  const paymentRefId = String(orderDetails.paymentRefId);
  if (paymentBodyData.gateway !== RAZORPAY_GATEWAY) {
    return res.status(200).json({ status: false, message: "Not a Razorpay order", responseCode: "002" });
  }

  if (orderDetails.status === "COMPLETE") {
    return res.status(200).json({ status: true, message: "Payment already processed", responseCode: "000" });
  }
  if (orderDetails.status === "FAILED") {
    // Captured after we failed the order (a retry inside the checkout). Same as Cashfree: ops refund it.
    customLog(req?.LogTraceId, "error", { message: "Razorpay webhook: capture landed on a FAILED order — needs manual refund", paymentRefId, paymentId: payment.id, amount: payment.amount }, "VENDOR");
    return res.status(200).json({ status: true, message: "Capture noted", responseCode: "001" });
  }
  if (orderDetails.status !== "ORDERED") {
    return res.status(200).json({ status: false, message: "Order not awaiting payment", responseCode: "002" });
  }
  if (!paymentBodyData.userId) {
    customLog(req?.LogTraceId, "error", { message: "Razorpay webhook: userId missing in paymentData; left ORDERED for reconciliation", paymentRefId }, "VENDOR");
    return res.status(200).json({ status: false, message: "Webhook acknowledged; awaiting reconciliation", responseCode: "001" });
  }

  // findUserDetails has no sub-user fields; the create-order body persisted them.
  req.user = {
    ...(await findUserDetails(paymentBodyData.userId)),
    role: paymentBodyData.role,
    subCorporateId: paymentBodyData.subCorporateId,
    subCorporateUsername: paymentBodyData.subCorporateUsername,
  };
  return settleOrder({ req, res, next, orderDetails, paymentBodyData, creds, source: "webhook" });
};

// Refund settled/failed — same bookkeeping as the Cashfree refund webhook, keyed on
// notes.corporateTxnId instead of parsing the refund id. Refunds without that note
// (e.g. Razorpay's own uncaptured-payment auto-refunds) are not ours to record.
const onRefundEvent = async ({ req, res, refundEntity }) => {
  const traceId = req?.LogTraceId;
  const corporateTxnId = refundEntity?.notes?.corporateTxnId;
  if (!corporateTxnId) {
    return res.status(200).json({ status: false, message: "Refund not linked to an order", responseCode: "002" });
  }
  const refund = normalizeRazorpayRefund(refundEntity);
  const orderDetails = await findOneOrder({ corporateTxnId });
  if (!orderDetails) {
    return res.status(200).json({ status: false, message: "Order details not found", responseCode: "002" });
  }

  let paymentBodyData = {};
  try {
    paymentBodyData = orderDetails?.paymentModeResponse ? JSON.parse(orderDetails.paymentModeResponse) : {};
  } catch (_) {
    paymentBodyData = {};
  }
  if (paymentBodyData.refundStatus === "SUCCESS") {
    return res.status(200).json({ status: true, message: "Refund already processed", responseCode: "000" });
  }

  const priorResults = Array.isArray(paymentBodyData.refundResults) ? paymentBodyData.refundResults : [];
  const refundsById = new Map(priorResults.filter((r) => r?.refund_id).map((r) => [r.refund_id, r]));
  refundsById.set(refund.refund_id, refund);
  paymentBodyData.refundResults = [...refundsById.values()];
  paymentBodyData.refundStatus = refund.refund_status;

  const nextStatus = resolveRefundOrderStatus({
    refundId: refund.refund_id,
    refundResults: paymentBodyData.refundResults,
    capturedAmount: paymentBodyData.payment_amount,
    currentStatus: orderDetails.status,
  });
  await updateOneOrder(corporateTxnId, {
    paymentModeResponse: JSON.stringify(paymentBodyData),
    ...(nextStatus ? { status: nextStatus } : {}),
  });

  sendOndcRefundCreditedEmail({ refund, corporateTxnId, logTraceId: traceId }).catch(() => {});
  if (refund.refund_status === "SUCCESS") {
    const refundedAmount = paymentBodyData.refundResults
      .filter((r) => r?.refund_status === "SUCCESS")
      .reduce((sum, r) => sum + Number(r?.refund_amount || 0), 0);
    await updateOneTransaction(corporateTxnId, { refundedAmount });
    customLog(traceId, "info", { message: "Refunded amount written to transaction", corporateTxnId, refundedAmount }, "VENDOR");
  }
  return res.status(200).json({ status: true, responseCode: "000" });
};

// POST /api/v1/webhook/razorpay/payment-gateway/razorpay — one endpoint for every event.
// Non-2xx makes Razorpay retry with backoff for 24h and then disable the webhook, so only
// a genuine processing error returns 500; everything else is acknowledged.
exports.handleWebhook = async (req, res, next) => {
  const traceId = req?.LogTraceId;
  const signature = req.headers["x-razorpay-signature"];
  const eventId = req.headers["x-razorpay-event-id"];
  const event = req.body?.event;
  const payload = req.body?.payload || {};
  const payment = payload.payment?.entity || null;
  const refundEntity = payload.refund?.entity || null;

  let record;
  let creds;
  try {
    creds = await loadRazorpayCredentials();
    if (!creds?.webhookSecret) {
      customLog(traceId, "error", { message: "Razorpay webhook secret missing (razorpay_pg vendor.optional3)" }, "VENDOR");
      return res.status(400).json({ status: false, responseCode: "002" });
    }
    if (!verifyWebhookSignature({ rawBody: req.rawBody, signature, webhookSecret: creds.webhookSecret })) {
      customLog(traceId, "error", { message: "Razorpay webhook signature invalid", event, eventId }, "VENDOR");
      return res.status(400).json({ status: false, responseCode: "002" });
    }
    customLog(traceId, "info", { message: "Razorpay webhook received", event, eventId, paymentId: payment?.id, refundId: refundEntity?.id }, "VENDOR");

    const idempotencyKey = `razorpay_${eventId || `${event}_${payment?.id || refundEntity?.id || Date.now()}`}`;
    let created;
    try {
      [record, created] = await findOrCreateWebhookEvent({
        idempotencyKey,
        eventType: event || "unknown",
        payload: req.body,
        merchantPaymentId: payment?.id || refundEntity?.payment_id || null,
        webhookContext: event || null,
        webhookSource: WEBHOOK_SOURCE,
      });
    } catch (dedupeError) {
      // Two deliveries of the same event racing on the unique idempotencyKey: the other one owns it.
      if (dedupeError?.name === "SequelizeUniqueConstraintError") {
        return res.status(200).json({ status: true, message: "Duplicate event", responseCode: "000" });
      }
      throw dedupeError;
    }
    if (!created && record.status !== "FAILED") {
      return res.status(200).json({ status: true, message: "Duplicate event", responseCode: "000" });
    }
  } catch (setupError) {
    customLog(traceId, "error", { message: "Razorpay webhook setup failed", event, eventId, error: razorpayErrorBody(setupError) }, "VENDOR");
    return res.status(500).json({ status: false, message: "Webhook setup failed" });
  }

  try {
    switch (event) {
      case "payment.captured":
      case "order.paid":
        await onPaymentCaptured({ req, res, next, payment, creds });
        break;
      case "refund.created":
      case "refund.processed":
      case "refund.failed":
      case "refund.speed_changed":
        await onRefundEvent({ req, res, refundEntity });
        break;
      case "payment.failed":
        // Not terminal: the checkout keeps the modal open to retry and a capture can follow.
        // The attempt is kept in webhookEvents; the order stays ORDERED until /complete decides.
        break;
      default:
        break;
    }
    await markWebhookProcessed(record.id);
    if (!res.headersSent) {
      return res.status(200).json({ status: true, message: "Event received", responseCode: "000" });
    }
    return undefined;
  } catch (error) {
    customLog(traceId, "error", { message: "Razorpay webhook processing failed", event, eventId, error: razorpayErrorBody(error) }, "VENDOR");
    await markWebhookFailed(record.id, String(error?.message || error), (record.retryCount || 0) + 1);
    if (!res.headersSent) return res.status(500).json({ status: false, message: "Webhook processing failed" });
    return undefined;
  }
};
