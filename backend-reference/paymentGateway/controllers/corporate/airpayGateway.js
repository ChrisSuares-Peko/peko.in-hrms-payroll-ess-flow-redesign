const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const paymentGatewayOrders = require("../../models/entities/paymentGatewayOrders");
const credential = require("../../models/entities/credential");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const walletEntity = require("../../models/entities/wallet");
const { ORDER_KIND } = require("../../constants/orderKind");
const { findOneOrder } = require("../../models/use-cases/order");
const { getValue } = require("../../utils/cacheDataMethods");
const { findUserDetails } = require("../../utils/jwtToken");
const { notifyPGPaymentConfirmed } = require("../../utils/pusherNotification");
const { dispatchAirpayPayment } = require("./airpayServiceDispatch");
const {
  AIRPAY,
  buildCheckoutForm,
  parseCallbackPayload,
  paymentRefIdFromAirpayOrderId,
  toPaymentStatus,
  fetchAirpayPayments,
} = require("../../utils/airpayGateway");

// AIRPAY_CALLBACK_BASE_URL lets local runs return to localhost / a tunnel instead of the deployed API
const BACKEND_URL = process.env.AIRPAY_CALLBACK_BASE_URL
  || (process.env.NODE_ENV === "production" ? process.env.PRODUCTION_URL : process.env.STAGING_URL);
const GENERIC_ERROR_MESSAGE = "We’re experiencing a temporary issue. Please try again later. If the problem continues, contact us at reach@peko.one.";

const toBuyerName = (fullName) => {
  const parts = String(fullName || "").replace(/[^a-zA-Z0-9 ]/g, " ").trim().split(/\s+/).filter(Boolean);
  const firstName = (parts[0] || "Customer").slice(0, 50);
  const lastName = (parts.slice(1).join(" ") || firstName).slice(0, 50);
  return { firstName, lastName };
};

// Airpay needs 8-15 digits; keep the last 10 of an Indian number
// Airpay requires buyer_email (3-50 chars); a missing or longer one fails the whole checkout, so fall back to support
const AIRPAY_FALLBACK_EMAIL = "reach@peko.one";
const toBuyerEmail = (email) => {
  const value = String(email || "").trim();
  return value.length >= 3 && value.length <= 50 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : AIRPAY_FALLBACK_EMAIL;
};

const toBuyerPhone = (mobile) => {
  const digits = String(mobile || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : "0000000000";
};

// The buyer's own site origin (sent by the FE) so Airpay returns them where they are logged in.
// https only; localhost allowed outside production for local runs.
const toReturnOrigin = (value) => {
  try {
    const url = new URL(String(value || ""));
    const isLocal = ["localhost", "127.0.0.1"].includes(url.hostname) && process.env.NODE_ENV !== "production";
    return url.protocol === "https:" || isLocal ? url.origin : null;
  } catch (_) {
    return null;
  }
};

const orderIdPrefixFor = (role) => (role === "CORPORATE_SUB_USER" ? "pekoSub" : "peko");

const readWalletBalance = async (credentialId) => {
  const walletData = await walletEntity.findOne({ where: { credentialId }, attributes: ["balance"] });
  return walletData?.balance ?? null;
};

// POST /api/v1/corporate/:id/payment-gateway/airpay-gateway/create-order
// Which white-label uses Airpay is decided by its FE build (VITE_AIRPAY_ENABLED); no partner check here by choice.
exports.createOrder = asyncHandler(async (req, res, next) => {
  const { returnOrigin, ...orderBody } = req.body;
  // Bills stay on CCAvenue; ONDC split settlement is Cashfree-only
  if (req.body.billerId || req.body.isOndc) {
    return next(new ErrorResponse("This payment method is not available for this order.", 400));
  }

  const paymentRefId = new Date().valueOf();
  const amount = parseFloat(req.body.pgAmount).toFixed(2);
  if (!(Number(amount) > 0)) {
    return next(new ErrorResponse("Invalid payment amount", 400));
  }

  await paymentGatewayOrders.create({
    paymentRefId,
    orderKind: ORDER_KIND.PAYMENT_GATEWAY,
    paymentData: JSON.stringify({
      ...orderBody,
      gateway: AIRPAY,
      airpayReturnOrigin: toReturnOrigin(returnOrigin),
      paymentRefId,
      userId: req.user.id,
      corporateId: req.user.corporateId,
      role: req.user.role || null,
      ...(req.user.role === "CORPORATE_SUB_USER" && {
        subCorporateId: req.user.subCorporateId,
        subCorporateUsername: req.user.subCorporateUsername || null,
      }),
    }),
  });

  try {
    const checkout = await buildCheckoutForm({
      orderIdPrefix: orderIdPrefixFor(req.user.role),
      paymentRefId,
      amount,
      buyer: {
        email: toBuyerEmail(req.user.email),
        phone: toBuyerPhone(req.user.mobileNo || req.user.mobile),
        ...toBuyerName(req.user.name),
      },
      // Must be on the domain registered with Airpay
      returnUrl: `${BACKEND_URL}/api/v1/webhook/airpay/payment-gateway/airpay/response`,
    });
    await paymentGatewayOrders.update({ status: "ORDERED" }, { where: { paymentRefId } });

    customLog(req?.LogTraceId, "info", { message: "Airpay order created", paymentRefId, amount, accessKey: req.body.accessKey }, "VENDOR");
    return res.status(201).json({
      status: true,
      data: { amount, orderId: paymentRefId, checkout },
      message: "Order created successfully",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Airpay create-order failed", paymentRefId, error: error?.response?.data ?? error?.message }, "VENDOR");
    await paymentGatewayOrders.update({ status: "FAILED" }, { where: { paymentRefId } });
    return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 501));
  }
});

// Answer for an order that has already been claimed (COMPLETE) — same shapes the Cashfree /complete returns
const respondForCompletedOrder = async (req, res, orderDetails, paymentData) => {
  const paymentRefId = orderDetails.paymentRefId;
  const corporateFinalBalance = await readWalletBalance(req.user.id);
  let gatewayResponse = {};
  try {
    gatewayResponse = JSON.parse(orderDetails.paymentResponse || "{}") || {};
  } catch (_) { /* not JSON */ }

  const isBulkEsim = Array.isArray(paymentData.orderGroups)
    || (["esim", "esim_tunz"].includes(paymentData.accessKey) && (paymentData.orders || []).reduce((s, o) => s + (Number(o.quantity) || 0), 0) > 1);
  if (isBulkEsim) {
    const keys = Array.isArray(paymentData.orderGroups)
      ? paymentData.orderGroups.map((_, i) => `esim:payment:order:${paymentRefId}:vendor${i}`)
      : [`esim:payment:order:${paymentRefId}`];
    const cached = await Promise.all(keys.map((key) => getValue(key)));
    if (cached.every((value) => value !== null && value !== undefined)) {
      return res.status(200).json({
        status: true,
        message: "Payment Successful",
        responseCode: "000",
        data: { bulkPaymentData: keys.length > 1 ? keys : keys[0], corporateFinalBalance, paymentMode: paymentData.paymentMode || null },
      });
    }
  }

  if (gatewayResponse.earlyExitRefund) {
    return res.status(400).json({
      status: false,
      data: {
        failed: true,
        corporateTxnId: paymentRefId,
        corporateFinalBalance,
        refundStatus: gatewayResponse.earlyExitRefund.refundStatus,
        refundAmount: gatewayResponse.earlyExitRefund.refundAmount,
        reason: gatewayResponse.earlyExitRefund.reason,
      },
      message: "Payment failed and refund has been initiated.",
      responseCode: "001",
    });
  }

  const txn = await findOneOrder({ corporateTxnId: String(paymentRefId) });
  if (!txn || ["AWAITED", "PENDING", "PROCESSING"].includes(txn.status)) {
    return res.status(200).json({
      status: true,
      data: { processing: true, corporateTxnId: paymentRefId, paymentMode: txn?.paymentMode || paymentData.paymentMode || null, corporateFinalBalance },
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
        paymentRefId,
        corporateTxnId: paymentRefId,
        amount: paymentData.amount,
        accessKey: paymentData.accessKey,
        account: paymentData.account,
        paymentMode: paymentData.paymentMode || null,
        corporateFinalBalance,
        ...(txn.providerId && { orderNumber: txn.providerId }),
      },
    });
  }
  return res.status(400).json({ status: false, data: { failed: true, corporateFinalBalance }, message: "payment failed", responseCode: "001" });
};

// Verifies with Airpay, claims the order (ORDERED → COMPLETE, once) and runs the service handler.
// Shared by /complete (buyer present) and the IPN (buyer gone). Returns false when it did not respond.
const verifyAndFulfil = async (req, res, next, orderDetails, paymentData) => {
  const paymentRefId = orderDetails.paymentRefId;
  const orderIdPrefix = orderIdPrefixFor(paymentData.role);
  const payments = await fetchAirpayPayments({ paymentRefId, orderIdPrefix, logTraceId: req?.LogTraceId });
  const payment = payments[0];

  if (payment.payment_status === "PENDING") {
    res.status(200).json({ status: true, data: { pending: true, corporateTxnId: paymentRefId }, message: "payment pending", responseCode: "000" });
    return true;
  }
  if (payment.payment_status !== "SUCCESS") {
    await paymentGatewayOrders.update(
      { status: "FAILED", paymentResponse: JSON.stringify(payments) },
      { where: { paymentRefId, status: "ORDERED" } }
    );
    res.status(400).json({ status: false, data: { failed: true, corporateTxnId: paymentRefId }, message: "Payment failed", responseCode: "001" });
    return true;
  }

  const [claimed] = await paymentGatewayOrders.update(
    { status: "COMPLETE", referenceNo: payment.cf_payment_id, paymentResponse: JSON.stringify(payments) },
    { where: { paymentRefId, status: "ORDERED" } }
  );
  if (claimed === 0) {
    // The other path (/complete or IPN) is already fulfilling this order
    return false;
  }

  // airpayReturnOrigin is only for the return redirect; keep it away from the service handlers
  const serviceBody = { ...paymentData };
  delete serviceBody.airpayReturnOrigin;
  req.body = { ...serviceBody, corporateTxnId: paymentRefId, paymentGatewayResponse: payments };
  try {
    await dispatchAirpayPayment(req, res, next, { gatewayOrderCreatedAt: orderDetails.createdAt });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Airpay service dispatch failed", paymentRefId, error: error?.message }, "VENDOR");
    if (!res.headersSent) next(new ErrorResponse("Payment processing failed", 500));
  }

  // Failed fulfilment is refunded inside the service handler: the shared refund helpers route Airpay orders to Airpay
  const settledTxn = await findOneOrder({ corporateTxnId: String(paymentRefId) });
  const settledStatus = settledTxn?.status === "SUCCESS" ? "SUCCESS" : ["FAILURE", "FAILED", "REFUNDED"].includes(settledTxn?.status) ? "FAILURE" : null;
  if (settledStatus) {
    await notifyPGPaymentConfirmed(paymentData.userId, null, paymentRefId, null, settledStatus).catch(() => {});
  }
  return true;
};

const findAirpayOrder = async (paymentRefId) => {
  const orderDetails = await paymentGatewayOrders.findOne({ where: { paymentRefId: String(paymentRefId) } });
  if (!orderDetails) return {};
  let paymentData = {};
  try {
    paymentData = JSON.parse(orderDetails.paymentData || "{}");
  } catch (_) { /* malformed */ }
  return paymentData.gateway === AIRPAY ? { orderDetails, paymentData } : {};
};

// POST /api/v1/corporate/:id/payment-gateway/airpay-gateway/complete
exports.completePayment = asyncHandler(async (req, res, next) => {
  const { orderDetails, paymentData } = await findAirpayOrder(req.body.orderId);
  if (!orderDetails || String(paymentData.userId) !== String(req.user.id)) {
    return next(new ErrorResponse("Order details not found", 400));
  }
  if (orderDetails.status === "COMPLETE") {
    return respondForCompletedOrder(req, res, orderDetails, paymentData);
  }
  if (orderDetails.status === "FAILED") {
    return res.status(400).json({ status: false, data: { failed: true, corporateTxnId: orderDetails.paymentRefId }, message: "Payment failed", responseCode: "001" });
  }
  if (orderDetails.status !== "ORDERED") {
    return next(new ErrorResponse("Unauthorised payment request", 401));
  }

  const responded = await verifyAndFulfil(req, res, next, orderDetails, paymentData);
  if (!responded && !res.headersSent) {
    const fresh = await paymentGatewayOrders.findOne({ where: { paymentRefId: orderDetails.paymentRefId } });
    return respondForCompletedOrder(req, res, fresh, paymentData);
  }
  return undefined;
});

// Audit trail of what Airpay posted; status itself always comes from the verify API
const storeCallback = async ({ payment, hashValid }, source, logTraceId) => {
  const paymentRefId = paymentRefIdFromAirpayOrderId(payment?.orderid);
  const { orderDetails } = paymentRefId ? await findAirpayOrder(paymentRefId) : {};
  if (!orderDetails) {
    customLog(logTraceId, "error", { message: `Airpay ${source}: order not found`, orderid: payment?.orderid }, "VENDOR");
    return null;
  }
  if (!hashValid) {
    customLog(logTraceId, "error", { message: `Airpay ${source}: ap_SecureHash mismatch`, paymentRefId, payment }, "VENDOR");
  }
  if (orderDetails.status === "ORDERED") {
    await paymentGatewayOrders.update(
      {
        referenceNo: payment.ap_transactionid || null,
        paymentResponse: JSON.stringify({ airpayCallback: { payment, hashValid, source, receivedAt: new Date().toISOString() } }),
      },
      { where: { paymentRefId, status: "ORDERED" } }
    );
  }
  return paymentRefId;
};

// The site the buyer paid from; falls back to the partner's baseUrl for orders without one
const resolveFrontendUrl = async (paymentRefId) => {
  const envUrl = process.env.NODE_ENV === "production" ? process.env.FRONTEND_PRODUCTION_URL : process.env.FRONTEND_STAGING_URL;
  try {
    const { paymentData } = paymentRefId ? await findAirpayOrder(paymentRefId) : {};
    const returnOrigin = toReturnOrigin(paymentData?.airpayReturnOrigin);
    if (returnOrigin) return returnOrigin;
    const buyer = paymentData?.userId ? await credential.findByPk(paymentData.userId, { attributes: ["registeredBy"] }) : null;
    if (!buyer?.registeredBy) return envUrl;
    const partner = await fetchPartnerDetails(buyer.registeredBy);
    return partner?.baseUrl || envUrl;
  } catch (_) {
    return envUrl;
  }
};

const buildRedirectPage = (url) =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><script>window.location.replace(${JSON.stringify(url)});</script></body></html>`;

// POST /api/v1/webhook/airpay/payment-gateway/airpay/response — Airpay returns the whole tab here after payment.
// Hands the buyer to the frontend processing page; the result itself always comes from /complete.
exports.handleResponse = async (req, res) => {
  let paymentRefId = null;
  try {
    const parsed = await parseCallbackPayload(req.body);
    customLog(req?.LogTraceId, "info", { message: "Airpay return received", payment: parsed.payment, hashValid: parsed.hashValid }, "VENDOR");
    paymentRefId = await storeCallback(parsed, "return", req?.LogTraceId);
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Airpay return handling failed", error: error?.message }, "VENDOR");
  }
  const frontendUrl = await resolveFrontendUrl(paymentRefId);
  const target = paymentRefId
    ? `${frontendUrl}/payments/airpay-processing?orderId=${paymentRefId}`
    : `${frontendUrl}/payments/payment-failure`;
  return res.send(buildRedirectPage(target));
};

// POST /api/v1/webhook/airpay/payment-gateway/airpay/ipn — server-to-server; fulfils orders whose buyer never came back.
exports.handleIpn = async (req, res, next) => {
  try {
    const parsed = await parseCallbackPayload(req.body);
    customLog(req?.LogTraceId, "info", { message: "Airpay IPN received", payment: parsed.payment, hashValid: parsed.hashValid }, "VENDOR");
    const paymentRefId = await storeCallback(parsed, "ipn", req?.LogTraceId);
    if (!paymentRefId || !parsed.hashValid || toPaymentStatus(parsed.payment.transaction_status) !== "SUCCESS") {
      return res.status(200).json({ status: true, message: "Event received" });
    }

    const { orderDetails, paymentData } = await findAirpayOrder(paymentRefId);
    if (orderDetails?.status !== "ORDERED" || !paymentData.userId) {
      return res.status(200).json({ status: true, message: "Event received" });
    }
    req.user = await findUserDetails(paymentData.userId);
    const responded = await verifyAndFulfil(req, res, next, orderDetails, paymentData);
    if (!responded && !res.headersSent) {
      return res.status(200).json({ status: true, message: "Already being processed" });
    }
    return undefined;
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Airpay IPN handling failed", error: error?.message }, "VENDOR");
    if (res.headersSent) return undefined;
    return res.status(200).json({ status: false, message: "Event received" });
  }
};
