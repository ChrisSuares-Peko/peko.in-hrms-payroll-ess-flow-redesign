/**
 * Gateway-agnostic refund entry point (officeAndBusiness). Same signature as cashfreeGateway;
 * the gateway tag stored on the order decides which implementation runs. Cashfree rows carry
 * no tag, so they keep the Cashfree path.
 */
const cashfree = require('./cashfreeGateway');
const { cancelRazorpayTransaction, RAZORPAY_GATEWAY } = require('./razorpayGateway');
const orders = require('../models/entities/order');

const gatewayOfOrder = async (corporateTxnId) => {
    try {
        const order = await orders.findOne({ where: { corporateTxnId }, attributes: ['paymentModeResponse'] });
        const parsed = order?.paymentModeResponse ? JSON.parse(order.paymentModeResponse) : {};
        return (parsed?.pgResponse ?? parsed)?.gateway ?? null;
    } catch {
        return null;
    }
};

exports.cancelPGTransaction = async (corporateTxnId, refundAmount) =>
    (await gatewayOfOrder(corporateTxnId)) === RAZORPAY_GATEWAY
        ? cancelRazorpayTransaction(corporateTxnId, refundAmount)
        : cashfree.cancelPGTransaction(corporateTxnId, refundAmount);

// WhatsApp mandates are Cashfree Subscriptions only.
exports.cancelWhatsAppSubscriptionMandate = cashfree.cancelWhatsAppSubscriptionMandate;
