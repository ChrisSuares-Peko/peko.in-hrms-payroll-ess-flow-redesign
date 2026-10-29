const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const paymentGatewayOrders = require("../../models/entities/paymentGatewayOrders");
const credential = require("../../models/entities/credential");
const { ORDER_KIND } = require("../../constants/orderKind");
const { customLog } = require("../../utils/loggerHelper");
const { findUserDetails } = require("../../utils/jwtToken");
const { notifyPGPaymentConfirmed } = require("../../utils/pusherNotification");
const { findOneOrder } = require("../../models/use-cases/order");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { isServiceEnabled } = require("../../models/use-cases/disableService");
const { normalizeCustomerMobile } = require("./commonBillHandler");
const { handlePGCallback } = require("./cashFreeGateway");
const mswipe = require("../../utils/gatewayProviders/mswipe");
const {
  isGatewayProviderEligible,
  loadGatewayOperator,
  extractPaymentRefId,
} = require("../../utils/gatewayProviders");

const GENERIC_ERROR_MESSAGE = "Something went wrong. If the issue persists, please contact support at reach@peko.one";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SETTLED_FAILURE_STATUSES = ["FAILURE", "FAILED", "REFUNDED"];
const NOTIFIABLE_ORDER_STATUSES = ["ORDERED", "FAILED"];

const environmentFrontendUrl = () =>
  process.env.NODE_ENV === "production" ? process.env.FRONTEND_PRODUCTION_URL : process.env.FRONTEND_STAGING_URL;

const environmentServerUrl = () =>
  process.env.NODE_ENV === "production" ? process.env.PRODUCTION_URL : process.env.STAGING_URL;

const resolveFrontendUrl = async (registeredBy, logTraceId) => {
  const fallbackUrl = environmentFrontendUrl();
  if (!registeredBy) return fallbackUrl;
  try {
    const partnerDetails = await fetchPartnerDetails(registeredBy);
    const baseUrl = typeof partnerDetails?.baseUrl === "string" ? partnerDetails.baseUrl.trim().replace(/\/+$/, "") : "";
    return baseUrl || fallbackUrl;
  } catch (error) {
    customLog(logTraceId, "error", {
      action: "gatewayProvider:partnerFrontendLookupFailed",
      registeredBy,
      error: error?.message,
    }, "VENDOR");
    return fallbackUrl;
  }
};

const restoreOrderUser = async (paymentBodyData) => {
  const user = await findUserDetails(paymentBodyData.userId);
  if (paymentBodyData.role !== "CORPORATE_SUB_USER") return user;
  return {
    ...user,
    role: paymentBodyData.role,
    subCorporateId: paymentBodyData.subCorporateId,
    subCorporateUsername: paymentBodyData.subCorporateUsername ?? null,
  };
};

const notifySettledPayment = async (userId, paymentRefId, logTraceId) => {
  try {
    const settledTxn = await findOneOrder({ corporateTxnId: paymentRefId });
    let settledStatus = null;
    if (settledTxn?.status === "SUCCESS") {
      settledStatus = "SUCCESS";
    } else if (SETTLED_FAILURE_STATUSES.includes(settledTxn?.status)) {
      settledStatus = "FAILURE";
    }
    if (settledStatus) {
      await notifyPGPaymentConfirmed(userId, null, paymentRefId, null, settledStatus);
    }
  } catch (error) {
    customLog(logTraceId, "error", {
      action: "gatewayProvider:paymentNotifyFailed",
      paymentRefId,
      error: error?.message,
    }, "VENDOR");
  }
};

exports.createOrder = asyncHandler(async (req, res, next) => {
  const serviceAccessKey = req.body.accessKey;
  const { provider } = mswipe;
  const isEligible = isGatewayProviderEligible({
    accessKey: serviceAccessKey,
    billerId: req.body.billerId,
    isOndc: req.body.isOndc,
    isSubscriptionMandate: Boolean(req.body.isWhatsAppSubscription || req.body.isEcommerceSubscription),
  });
  if (!isEligible) {
    customLog(req?.LogTraceId, "error", {
      action: "gatewayProvider:createOrderNotAllowed",
      accessKey: serviceAccessKey,
      partnerId: req.user.registeredBy ?? null,
    }, "VENDOR");
    return next(new ErrorResponse("This payment method is not available for this service.", 400));
  }
  if (!(await isServiceEnabled(req.user.id, provider))) {
    return next(new ErrorResponse("This service is disabled for your account", 403));
  }

  const credentials = mswipe.paymentCredentials(await loadGatewayOperator(provider));
  if (!credentials) {
    customLog(req?.LogTraceId, "error", {
      action: "gatewayProvider:notConfigured",
      provider,
      accessKey: serviceAccessKey,
    }, "VENDOR");
    return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 503));
  }

  const pgAmount = Number(req.body.pgAmount);
  if (!Number.isFinite(pgAmount) || pgAmount <= 0) {
    return next(new ErrorResponse("Please enter a valid amount", 400));
  }

  const paymentRefId = String(Date.now());
  const email = String(req.user.email ?? "").trim();
  const order = {
    paymentRefId,
    amount: pgAmount.toFixed(2),
    customer: {
      name: req.user.name ?? "",
      mobileNo: normalizeCustomerMobile(req.user.mobileNo || req.user.mobile),
      email: EMAIL_PATTERN.test(email) ? email : "",
    },
    returnUrl: `${environmentServerUrl()}/api/v1/webhook/mswipe/payment-gateway/mswipe/return?orderId=${paymentRefId}`,
    note: serviceAccessKey,
  };
  const missingDetails = mswipe.missingOrderDetails(order);
  if (missingDetails) {
    return next(new ErrorResponse(missingDetails, 400));
  }

  const requestBody = { ...req.body };
  delete requestBody.gatewayOrder;
  const persistedPaymentData = {
    ...requestBody,
    paymentRefId,
    userId: req.user.id,
    corporateId: req.user.corporateId,
    role: req.user.role || null,
    ...(req.user.role === "CORPORATE_SUB_USER" && {
      subCorporateId: req.user.subCorporateId,
      subCorporateUsername: req.user.subCorporateUsername || null,
    }),
  };
  await paymentGatewayOrders.create({
    paymentRefId,
    orderKind: ORDER_KIND.PAYMENT_GATEWAY,
    pgProvider: provider,
    paymentData: JSON.stringify(persistedPaymentData),
    credentialId: req.user.id,
  });

  try {
    const { paymentUrl, reference, providerOrderId } = await mswipe.createOrder({
      credentials,
      order,
      logTraceId: req?.LogTraceId,
    });
    await paymentGatewayOrders.update(
      {
        status: "ORDERED",
        referenceNo: reference,
        paymentData: JSON.stringify({ ...persistedPaymentData, gatewayOrder: { providerOrderId, reference } }),
      },
      { where: { paymentRefId, status: "PENDING" } }
    );
    customLog(req?.LogTraceId, "info", {
      action: "gatewayProvider:orderCreated",
      provider,
      paymentRefId,
      providerOrderId,
      accessKey: serviceAccessKey,
      amount: order.amount,
    }, "VENDOR");
    return res.status(201).json({
      status: true,
      data: { amount: order.amount, orderId: paymentRefId, paymentUrl },
      message: "Order created successfully",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      action: "gatewayProvider:createOrderFailed",
      provider,
      paymentRefId,
      accessKey: serviceAccessKey,
      error: error?.message,
      httpStatus: error?.response?.status,
      responseData: error?.response?.data,
    }, "VENDOR");
    await paymentGatewayOrders.update({ status: "FAILED" }, { where: { paymentRefId, status: "PENDING" } });
    return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 502));
  }
});

exports.handleReturn = async (req, res) => {
  const { provider } = mswipe;
  const fallbackUrl = environmentFrontendUrl();
  const paymentRefId = extractPaymentRefId(req.query?.orderId);
  try {
    const orderDetails = paymentRefId
      ? await paymentGatewayOrders.findOne({
        where: { paymentRefId, pgProvider: provider },
        include: [{ model: credential, attributes: ["registeredBy"] }],
      })
      : null;
    if (!orderDetails) {
      customLog(req?.LogTraceId, "error", {
        action: "gatewayProvider:returnOrderNotFound",
        provider,
        orderId: req.query?.orderId ?? null,
      }, "VENDOR");
      return res.redirect(303, `${fallbackUrl}/payments/payment-failure`);
    }
    const frontendUrl = await resolveFrontendUrl(orderDetails.credential?.registeredBy, req?.LogTraceId);
    return res.redirect(303, `${frontendUrl}/payments/mswipe-processing?orderId=${paymentRefId}`);
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      action: "gatewayProvider:returnFailed",
      provider,
      orderId: req.query?.orderId ?? null,
      error: error?.message,
    }, "VENDOR");
    return res.redirect(303, `${fallbackUrl}/payments/payment-failure`);
  }
};

exports.handleNotification = async (req, res) => {
  const { provider } = mswipe;
  const notification = mswipe.parseNotification(req.body);
  const paymentRefId = extractPaymentRefId(notification.paymentRefId);
  customLog(req?.LogTraceId, "info", {
    action: "gatewayProvider:notificationReceived",
    provider,
    paymentRefId,
    providerOrderId: notification?.providerOrderId ?? null,
    status: notification?.status ?? null,
  }, "VENDOR");
  const acknowledge = () => res.status(200).json({ status: true, message: "Event received" });
  if (!paymentRefId) return acknowledge();

  try {
    const orderDetails = await paymentGatewayOrders.findOne({ where: { paymentRefId, pgProvider: provider } });
    if (!orderDetails || !NOTIFIABLE_ORDER_STATUSES.includes(orderDetails.status)) {
      return acknowledge();
    }
    const paymentBodyData = JSON.parse(orderDetails.paymentData);
    if (!paymentBodyData?.userId) {
      customLog(req?.LogTraceId, "error", {
        action: "gatewayProvider:notificationWithoutUser",
        provider,
        paymentRefId,
      }, "VENDOR");
      return acknowledge();
    }

    req.user = await restoreOrderUser(paymentBodyData);
    req.body = { ORDERID: paymentRefId };
    await handlePGCallback(req, res, (error) => {
      customLog(req?.LogTraceId, "error", {
        action: "gatewayProvider:notificationNotSettled",
        provider,
        paymentRefId,
        error: error?.message,
      }, "VENDOR");
      if (!res.headersSent) acknowledge();
    });
    await notifySettledPayment(paymentBodyData.userId, paymentRefId, req?.LogTraceId);
    return undefined;
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      action: "gatewayProvider:notificationFailed",
      provider,
      paymentRefId,
      error: error?.message,
    }, "VENDOR");
    if (!res.headersSent) acknowledge();
    return undefined;
  }
};
