/**
 * Gateway-agnostic refund entry point (purchase MS). Same signatures as cashFreeGateway;
 * the gateway tag stored on the order decides which implementation runs. Cashfree rows carry
 * no tag, so they keep the Cashfree path (incl. ONDC, which stays on Cashfree/Easy Split).
 */
const cashfree = require("./cashFreeGateway");
const { cancelRazorpayTransaction, RAZORPAY_GATEWAY } = require("./razorpayGateway");
const { findOneOrder } = require("../models/use-cases/order");

const gatewayOfOrder = async (corporateTxnId) => {
  try {
    const order = await findOneOrder({ corporateTxnId });
    const parsed = order?.paymentModeResponse ? JSON.parse(order.paymentModeResponse) : {};
    return (parsed?.pgResponse ?? parsed)?.gateway ?? null;
  } catch (_) {
    return null;
  }
};

exports.cancelPGTransaction = async (corporateTxnId, opts = {}) =>
  (await gatewayOfOrder(corporateTxnId)) === RAZORPAY_GATEWAY
    ? cancelRazorpayTransaction(corporateTxnId, opts)
    : cashfree.cancelPGTransaction(corporateTxnId, opts);

// ONDC seller-attributed refunds are Cashfree Easy Split only.
exports.refundOndcOrderPayment = cashfree.refundOndcOrderPayment;
