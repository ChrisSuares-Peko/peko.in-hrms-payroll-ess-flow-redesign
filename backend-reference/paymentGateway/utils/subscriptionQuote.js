const paymentGatewayOrders = require("../models/entities/paymentGatewayOrders");
const { ORDER_KIND } = require("../constants/orderKind");
const { customLog } = require("./loggerHelper");

const resolveSubscriptionQuote = async (vendorSubscriptionId, traceId = null) => {
  try {
    const authOrder = await paymentGatewayOrders.findOne({
      where: { vendorSubscriptionId: String(vendorSubscriptionId), orderKind: ORDER_KIND.SUBSCRIPTION_AUTH },
      attributes: ["paymentData", "createdAt"],
      order: [["createdAt", "DESC"]],
      raw: true,
    });
    if (!authOrder) {
      customLog(traceId, "error", { message: "Subscription AUTH order not found — pricing as of now", action: "subscription:quote:orderMissing", vendorSubscriptionId });
      return { quotedAt: null, creditCurrentGroupPlan: true };
    }
    let storedQuotedAt = null;
    try {
      const orderData = typeof authOrder.paymentData === "string" ? JSON.parse(authOrder.paymentData) : authOrder.paymentData;
      storedQuotedAt = orderData?.quotedAt || null;
    } catch (parseError) {
      storedQuotedAt = null;
    }
    return storedQuotedAt
      ? { quotedAt: storedQuotedAt, creditCurrentGroupPlan: true }
      : { quotedAt: authOrder.createdAt || null, creditCurrentGroupPlan: false };
  } catch (error) {
    customLog(traceId, "error", { message: "Subscription quote lookup failed — pricing as of now", action: "subscription:quote:lookupFailed", vendorSubscriptionId, error: error?.message });
    return { quotedAt: null, creditCurrentGroupPlan: true };
  }
};

module.exports = { resolveSubscriptionQuote };
