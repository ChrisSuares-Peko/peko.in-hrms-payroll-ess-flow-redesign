/**
 * Gateway-agnostic refund entry point. Service handlers call these exactly as they called
 * cashfreeGateway.cancelPGTransaction / refundCashfreeDirect; the stored gateway tag decides
 * which implementation runs. Cashfree rows carry no tag, so they keep the Cashfree path.
 */
const cashfree = require("./cashfreeGateway");
const razorpay = require("./razorpayRefund");
const { findOneOrder } = require("../models/use-cases/order");
const { RAZORPAY_GATEWAY } = require("./razorpayGateway");

const gatewayOfOrder = async (corporateTxnId) => {
  try {
    const order = await findOneOrder({ corporateTxnId });
    const parsed = order?.paymentModeResponse ? JSON.parse(order.paymentModeResponse) : {};
    return (parsed?.pgResponse ?? parsed)?.gateway ?? null;
  } catch (_) {
    return null;
  }
};

exports.cancelPGTransaction = async (corporateTxnId) =>
  (await gatewayOfOrder(corporateTxnId)) === RAZORPAY_GATEWAY
    ? razorpay.cancelRazorpayTransaction(corporateTxnId)
    : cashfree.cancelPGTransaction(corporateTxnId);

exports.refundCashfreeDirect = async (args = {}) => {
  const gateway = args.gateway ?? args.req?.body?.paymentGatewayResponse?.[0]?.gateway ?? null;
  return gateway === RAZORPAY_GATEWAY
    ? razorpay.refundRazorpayDirect(args)
    : cashfree.refundCashfreeDirect(args);
};

exports.buildMergedPaymentResponse = cashfree.buildMergedPaymentResponse;
