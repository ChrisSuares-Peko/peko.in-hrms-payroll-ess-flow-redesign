const { default: axios } = require('axios');
const { customLog } = require('./loggerHelper');
const serviceOperators = require('../models/entities/serviceOperator');
const vendor = require('../models/entities/vendor');
const orders = require('../models/entities/order');
const operatorsData = require('./operatorsData.json');
const emailer = require('./emailer');
const { isMswipePayment, requestMswipeManualRefund } = require('./mswipeManualRefund');

const CASHFREE_ACCESS_KEY = operatorsData['cashFreePaymentGateway']['accessKey'];
const WHATSAPP_ACCESS_KEY = operatorsData['whatsAppForBusiness']['accessKey'];
const CASHFREE_SUBSCRIPTIONS_ACCESS_KEY = operatorsData['cashFreeSubscriptions']['accessKey'];

exports.cancelPGTransaction = async (corporateTxnId, refundAmount) => {
    try {
        const orderDetails = await orders.findOne({
            where: { corporateTxnId },
            include: [{ model: serviceOperators, attributes: ['paymentclientid', 'paymentclientsecret'] }],
        });
        if (!orderDetails) {
            return { status: false, message: 'Order details not found' };
        }

        let paymentBodyData = {};
        try {
            paymentBodyData = orderDetails.paymentModeResponse
                ? JSON.parse(orderDetails.paymentModeResponse)
                : {};
        } catch {
            return { status: false, message: 'Invalid payment response details' };
        }

        const order_id = paymentBodyData?.order_id
            || paymentBodyData?.pgResponse?.[0]?.order_id
            || paymentBodyData?.[0]?.order_id;
        const payment_amount = Number(paymentBodyData?.payment_amount || 0);
        const amountToRefund = refundAmount != null ? Number(refundAmount) : payment_amount;

        if (!order_id) {
            return { status: false, message: 'Cashfree order_id not found in paymentModeResponse' };
        }
        if (!Number.isFinite(amountToRefund) || amountToRefund <= 0) {
            return { status: false, message: 'Invalid refund amount' };
        }
        if (
            paymentBodyData?.refundStatus &&
            paymentBodyData.refundStatus !== 'Refund failed' &&
            paymentBodyData.refundStatus !== 'FAILED'
        ) {
            return { status: true, message: 'Refund already initiated', refundStatus: paymentBodyData.refundStatus };
        }

        if (isMswipePayment(paymentBodyData)) {
            return await requestMswipeManualRefund({
                corporateTxnId,
                paymentBodyData,
                refundAmount: amountToRefund,
                saveOrder: (fields) => orders.update(fields, { where: { corporateTxnId } }),
                sendMail: ({ to, subject, html }) => emailer.email(to, subject, html),
            });
        }

        const serviceOperator = await serviceOperators.findOne({
            where: { accessKey: CASHFREE_ACCESS_KEY },
            include: [{ model: vendor }],
        });
        if (!serviceOperator) {
            return { status: false, message: 'Cashfree service configuration not found' };
        }

        const clientId = orderDetails.serviceOperator?.paymentclientid ?? serviceOperator.vendor?.optional1;
        const clientSecret = orderDetails.serviceOperator?.paymentclientsecret ?? serviceOperator.vendor?.optional2;
        const baseUrl = serviceOperator.vendor?.apiUrl;
        const version = serviceOperator.vendor?.optional3;

        if (!clientId || !clientSecret || !baseUrl || !version) {
            return { status: false, message: 'Missing Cashfree credentials' };
        }

        const refundBody = {
            refund_id: `refund_${corporateTxnId}`,
            refund_amount: amountToRefund,
            refund_note: corporateTxnId.toString(),
        };

        customLog(null, 'info', { message: 'Initiating Cashfree refund', order_id, amountToRefund, corporateTxnId }, 'VENDOR');

        const response = await axios({
            method: 'POST',
            url: `${baseUrl}/pg/orders/${order_id}/refunds`,
            headers: {
                'x-api-version': version,
                'x-client-id': clientId,
                'x-client-secret': clientSecret,
                'Content-Type': 'application/json',
            },
            data: refundBody,
        });

        customLog(null, 'info', { message: 'Cashfree refund response', response: response?.data }, 'VENDOR');

        const vendorRefundStatus = response?.data?.refund_status;
        const refundStatus = vendorRefundStatus === "SUCCESS" ? "INITIATED" : vendorRefundStatus;
        paymentBodyData.refundStatus = refundStatus;
        paymentBodyData.refundResults = [response?.data];
        await orders.update(
            { paymentModeResponse: JSON.stringify(paymentBodyData) },
            { where: { corporateTxnId } }
        );

        return { status: true, refundStatus: response?.data?.refund_status, message: 'Refund initiated successfully' };
    } catch (error) {
        customLog(null, 'error', {
            message: 'Cashfree refund failed',
            error: error?.response?.data ?? error?.message ?? error,
            corporateTxnId,
        }, 'VENDOR');

        try {
            const orderDetails = await orders.findOne({ where: { corporateTxnId } });
            if (orderDetails?.paymentModeResponse) {
                let failedData = {};
                try { failedData = JSON.parse(orderDetails.paymentModeResponse); } catch { /**/ }
                failedData.refundStatus = 'Refund failed';
                failedData.refundResults = [error?.response?.data];
                await orders.update(
                    { paymentModeResponse: JSON.stringify(failedData) },
                    { where: { corporateTxnId } }
                );
            }
        } catch { /**/ }

        return { status: false, message: 'Cashfree refund failed', error: error?.response?.data };
    }
};

// Cancels a WhatsApp subscription's Cashfree mandate so no future charges fire. clientId/clientSecret
// come STRICTLY from the WhatsApp serviceOperator (paymentclientid/paymentclientsecret); the Cashfree
// connection (apiUrl + x-api-version) comes from the shared cashfree gateway vendor. Best-effort:
// returns { status, message } and never throws.
exports.cancelWhatsAppSubscriptionMandate = async (vendorSubscriptionId, traceId = null) => {
    try {
        if (!vendorSubscriptionId) {
            return { status: false, message: 'No vendorSubscriptionId to cancel' };
        }

        // Cashfree connection (base URL + x-api-version) from the subscriptions merchant the mandate
        // was created on; clientId/clientSecret strictly from the WhatsApp serviceOperator.
        const baseOperator = await serviceOperators.findOne({
            where: { accessKey: CASHFREE_SUBSCRIPTIONS_ACCESS_KEY },
            include: [{ model: vendor }],
        });
        const waOperator = await serviceOperators.findOne({
            where: { accessKey: WHATSAPP_ACCESS_KEY },
            attributes: ['paymentclientid', 'paymentclientsecret'],
            raw: true,
        });

        const baseUrl = baseOperator?.vendor?.apiUrl;
        const version = baseOperator?.vendor?.optional3;
        const clientId = waOperator?.paymentclientid;
        const clientSecret = waOperator?.paymentclientsecret;

        if (!baseUrl || !version || !clientId || !clientSecret) {
            return { status: false, message: 'Missing WhatsApp Cashfree credentials' };
        }

        const response = await axios({
            method: 'POST',
            url: `${baseUrl}/pg/subscriptions/${vendorSubscriptionId}/manage`,
            headers: {
                'x-api-version': version,
                'x-client-id': clientId,
                'x-client-secret': clientSecret,
                'Content-Type': 'application/json',
            },
            data: { action: 'CANCEL', subscription_id: vendorSubscriptionId },
        });

        customLog(traceId, 'info', { message: 'WhatsApp Cashfree mandate cancel response', vendorSubscriptionId, response: response?.data }, 'VENDOR');
        return { status: true, message: 'WhatsApp Cashfree mandate cancelled', data: response?.data };
    } catch (error) {
        customLog(traceId, 'error', {
            message: 'WhatsApp Cashfree mandate cancel failed',
            vendorSubscriptionId,
            error: error?.response?.data ?? error?.message ?? error,
        }, 'VENDOR');
        return { status: false, message: 'WhatsApp Cashfree mandate cancel failed', error: error?.response?.data };
    }
};
