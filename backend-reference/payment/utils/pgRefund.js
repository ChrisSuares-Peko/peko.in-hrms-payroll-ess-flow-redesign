/**
 * Gateway-agnostic refund entry point (payment MS). Same signature as
 * cashfreeGateway.cancelPGTransaction; the gateway tag stored on the order decides which
 * implementation runs. Cashfree rows carry no tag, so they keep the Cashfree path.
 */
const cashfree = require("./cashfreeGateway");
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

exports.cancelPGTransaction = async (corporateTxnId, requestedAmount, displayAmount, logTraceId) =>
  (await gatewayOfOrder(corporateTxnId)) === RAZORPAY_GATEWAY
    ? cancelRazorpayTransaction(corporateTxnId, requestedAmount, displayAmount, logTraceId)
    : cashfree.cancelPGTransaction(corporateTxnId, requestedAmount, displayAmount, logTraceId);
