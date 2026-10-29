/**
 * Gateway-agnostic refund entry point (travel MS). Same signature as cashFreeGateway;
 * the gateway tag stored on the order decides which implementation runs. Cashfree rows
 * carry no tag, so they keep the Cashfree path.
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

exports.cancelPGTransaction = async (corporateTxnId, refundAmount) =>
  (await gatewayOfOrder(corporateTxnId)) === RAZORPAY_GATEWAY
    ? cancelRazorpayTransaction(corporateTxnId, refundAmount)
    : cashfree.cancelPGTransaction(corporateTxnId, refundAmount);
