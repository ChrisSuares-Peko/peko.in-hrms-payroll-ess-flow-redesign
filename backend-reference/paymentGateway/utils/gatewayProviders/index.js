const { findServiceOperatorByAccessKey } = require("../checkAndFetchServiceDetails");
const { customLog } = require("../loggerHelper");
const operatorsData = require("../operatorsData.json");
const paymentGatewayOrders = require("../../models/entities/paymentGatewayOrders");
const { GATEWAY_PROVIDER } = require("../../constants/gatewayProviders");
const mswipe = require("./mswipe");

const GATEWAY_PROVIDERS = Object.freeze({
  [GATEWAY_PROVIDER.MSWIPE]: mswipe,
});

const OFFICE_SUPPLIES_ACCESS_KEY = operatorsData["e-commerce"].accessKey;
const BBPS_ACCESS_KEY_PREFIX = "bbps_";

const getGatewayProvider = (provider) =>
  typeof provider === "string" && Object.prototype.hasOwnProperty.call(GATEWAY_PROVIDERS, provider)
    ? GATEWAY_PROVIDERS[provider]
    : null;

const getOrderGatewayProvider = (orderDetails) => getGatewayProvider(orderDetails?.pgProvider);

const isGatewayProviderEligible = ({ accessKey, billerId, isOndc, isSubscriptionMandate }) => {
  const key = accessKey == null ? "" : String(accessKey).trim();
  return (
    key !== "" &&
    !key.startsWith(BBPS_ACCESS_KEY_PREFIX) &&
    key !== OFFICE_SUPPLIES_ACCESS_KEY &&
    !billerId &&
    !isOndc &&
    !isSubscriptionMandate
  );
};

const loadGatewayOperator = async (provider) => {
  const operator = await findServiceOperatorByAccessKey(provider);
  return operator && !Object.prototype.hasOwnProperty.call(operator, "error") ? operator : null;
};

const verifyGatewayOrder = async ({ orderDetails, paymentBodyData, logTraceId }) => {
  const provider = orderDetails?.pgProvider ?? null;
  const paymentRefId = String(orderDetails?.paymentRefId);
  const gateway = getGatewayProvider(provider);
  const reference = orderDetails?.referenceNo || paymentBodyData?.gatewayOrder?.reference || null;
  const credentials = gateway ? gateway.paymentCredentials(await loadGatewayOperator(provider)) : null;
  if (!credentials || !reference) {
    customLog(logTraceId, "error", {
      action: "gatewayProvider:verificationUnavailable",
      provider,
      paymentRefId,
      hasCredentials: Boolean(credentials),
      hasReference: Boolean(reference),
    }, "VENDOR");
    return { orderStatus: "PENDING", paymentResponse: { gateway: provider, reason: "verificationUnavailable" } };
  }

  try {
    return await gateway.verifyOrder({
      credentials,
      reference,
      paymentRefId,
      expectedAmount: paymentBodyData?.pgAmount,
      logTraceId,
    });
  } catch (error) {
    customLog(logTraceId, "error", {
      action: "gatewayProvider:statusLookupFailed",
      provider,
      paymentRefId,
      error: error?.message,
      httpStatus: error?.response?.status,
      responseData: error?.response?.data,
    }, "VENDOR");
    return { orderStatus: "PENDING", paymentResponse: { gateway: provider, reason: "statusLookupFailed" } };
  }
};

const wasDeclinedByGateway = (orderDetails) => {
  try {
    const stored = JSON.parse(orderDetails?.paymentResponse || "null");
    return stored?.gateway === orderDetails?.pgProvider && stored?.orderStatus === "FAILURE";
  } catch {
    return false;
  }
};

const reopenPaidGatewayOrder = async ({ orderDetails, paymentBodyData, logTraceId }) => {
  if (orderDetails?.status !== "FAILED" || !wasDeclinedByGateway(orderDetails)) return orderDetails;
  const { orderStatus } = await verifyGatewayOrder({ orderDetails, paymentBodyData, logTraceId });
  if (orderStatus !== "SUCCESS") return orderDetails;

  const paymentRefId = String(orderDetails.paymentRefId);
  const [reopenedCount] = await paymentGatewayOrders.update(
    { status: "ORDERED" },
    { where: { paymentRefId, status: "FAILED" } }
  );
  customLog(logTraceId, "info", {
    action: "gatewayProvider:paidOrderReopened",
    provider: orderDetails.pgProvider,
    paymentRefId,
    reopenedCount,
  }, "VENDOR");
  return (await paymentGatewayOrders.findOne({ where: { paymentRefId } })) ?? orderDetails;
};

const extractPaymentRefId = (value) => {
  const match = String(value ?? "").trim().match(/^\d+/);
  return match ? match[0] : null;
};

module.exports = {
  getGatewayProvider,
  getOrderGatewayProvider,
  isGatewayProviderEligible,
  loadGatewayOperator,
  verifyGatewayOrder,
  reopenPaidGatewayOrder,
  extractPaymentRefId,
};
