/**
 * Razorpay refund for officeAndBusiness — twin of cashfreeGateway.cancelPGTransaction for
 * orders paid through Razorpay (same inputs and write-back; refunds by payment id).
 * Callers go through utils/pgRefund.js, which picks by the gateway tag stored on the order.
 */
const { default: axios } = require('axios');
const { customLog } = require('./loggerHelper');
const serviceOperators = require('../models/entities/serviceOperator');
const vendor = require('../models/entities/vendor');
const orders = require('../models/entities/order');
const operatorsData = require('./operatorsData.json');

const RAZORPAY_ACCESS_KEY = operatorsData['razorpayPaymentGateway']['accessKey'];
const RAZORPAY_GATEWAY = 'RAZORPAY';
const API_BASE = 'https://api.razorpay.com/v1';
const REFUND_STATUS_MAP = { pending: 'PENDING', processed: 'SUCCESS', failed: 'FAILED' };
const RETRYABLE = new Set(['Refund failed', 'FAILED']);

const loadRazorpayCredentials = async () => {
    const row = await serviceOperators.findOne({ where: { accessKey: RAZORPAY_ACCESS_KEY }, include: [{ model: vendor }] });
    const keyId = row?.vendor?.optional1;
    const keySecret = row?.vendor?.optional2;
    return keyId && keySecret ? { keyId, keySecret } : null;
};

const normalizeRazorpayRefund = (r) => ({
    gateway: RAZORPAY_GATEWAY,
    refund_id: r.receipt || r.id,
    razorpay_refund_id: r.id,
    payment_id: r.payment_id,
    refund_status: REFUND_STATUS_MAP[r.status] || String(r.status || '').toUpperCase(),
    refund_amount: Number(r.amount || 0) / 100,
    refund_currency: r.currency || 'INR',
    refund_speed: r.speed_processed || r.speed_requested || null,
    refund_note: r.notes?.reason || r.notes?.corporateTxnId || null,
    created_at: r.created_at ? new Date(r.created_at * 1000).toISOString() : null,
});

// Razorpay refunds by payment id; `receipt` is the per-payment idempotency key.
const refundRazorpayPayment = async ({ paymentId, amountRupees, receipt, notes, speed = 'normal' }) => {
    const creds = await loadRazorpayCredentials();
    if (!creds) throw new Error('Razorpay credentials not configured');
    const response = await axios({
        method: 'POST',
        url: `${API_BASE}/payments/${paymentId}/refund`,
        auth: { username: creds.keyId, password: creds.keySecret },
        headers: { 'Content-Type': 'application/json' },
        data: { amount: Math.round(Number(amountRupees) * 100), speed, receipt, notes },
    });
    return normalizeRazorpayRefund(response.data);
};

const refundAlreadySettled = async (corporateTxnId) => {
    try {
        const fresh = await orders.findOne({ where: { corporateTxnId }, attributes: ['paymentModeResponse'] });
        const parsed = fresh?.paymentModeResponse ? JSON.parse(fresh.paymentModeResponse) : {};
        return (parsed?.pgResponse ?? parsed)?.refundStatus === 'SUCCESS';
    } catch {
        return false;
    }
};

/** Same contract as cashfreeGateway.cancelPGTransaction(corporateTxnId, refundAmount). */
const cancelRazorpayTransaction = async (corporateTxnId, refundAmount) => {
    try {
        const orderDetails = await orders.findOne({ where: { corporateTxnId } });
        if (!orderDetails) return { status: false, message: 'Order details not found' };

        let paymentBodyData = {};
        try {
            paymentBodyData = orderDetails.paymentModeResponse ? JSON.parse(orderDetails.paymentModeResponse) : {};
        } catch {
            return { status: false, message: 'Invalid payment response details' };
        }

        const paymentId = paymentBodyData?.payment_id || paymentBodyData?.pgResponse?.[0]?.payment_id || paymentBodyData?.[0]?.payment_id;
        const payment_amount = Number(paymentBodyData?.payment_amount || 0);
        const requested = refundAmount != null ? Number(refundAmount) : payment_amount;
        const amountToRefund = Math.min(requested, payment_amount);
        if (!paymentId) return { status: false, message: 'Razorpay payment_id not found in paymentModeResponse' };
        if (!Number.isFinite(amountToRefund) || amountToRefund <= 0) return { status: false, message: 'Invalid refund amount' };
        if (paymentBodyData?.refundStatus && !RETRYABLE.has(paymentBodyData.refundStatus)) {
            return { status: true, message: 'Refund already initiated', refundStatus: paymentBodyData.refundStatus };
        }

        const receipt = `refund_${corporateTxnId}${paymentBodyData?.refundStatus ? `_r${Date.now()}` : ''}`;
        customLog(null, 'info', { message: 'Initiating Razorpay refund', paymentId, amountToRefund, corporateTxnId }, 'VENDOR');
        const refund = await refundRazorpayPayment({ paymentId, amountRupees: amountToRefund, receipt, notes: { corporateTxnId: String(corporateTxnId) } });
        customLog(null, 'info', { message: 'Razorpay refund response', response: refund }, 'VENDOR');

        // Instant refunds can settle (webhook → SUCCESS) before this write lands — never clobber that.
        if (await refundAlreadySettled(corporateTxnId)) {
            return { status: true, refundStatus: 'SUCCESS', message: 'Refund initiated successfully' };
        }
        paymentBodyData.refundStatus = refund.refund_status === 'SUCCESS' ? 'INITIATED' : refund.refund_status;
        paymentBodyData.refundResults = [refund];
        await orders.update({ paymentModeResponse: JSON.stringify(paymentBodyData) }, { where: { corporateTxnId } });

        return { status: true, refundStatus: refund.refund_status, message: 'Refund initiated successfully' };
    } catch (error) {
        customLog(null, 'error', { message: 'Razorpay refund failed', error: error?.response?.data ?? error?.message ?? error, corporateTxnId }, 'VENDOR');
        try {
            const orderDetails = await orders.findOne({ where: { corporateTxnId } });
            if (orderDetails?.paymentModeResponse) {
                let failed = {};
                try { failed = JSON.parse(orderDetails.paymentModeResponse); } catch { /**/ }
                failed.refundStatus = 'Refund failed';
                failed.refundResults = [error?.response?.data ?? null];
                await orders.update({ paymentModeResponse: JSON.stringify(failed) }, { where: { corporateTxnId } });
            }
        } catch { /**/ }
        return { status: false, message: 'Razorpay refund failed', error: error?.response?.data };
    }
};

module.exports = { RAZORPAY_ACCESS_KEY, RAZORPAY_GATEWAY, loadRazorpayCredentials, refundRazorpayPayment, cancelRazorpayTransaction };
