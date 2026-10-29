const qs = require('querystring');
const axios = require('axios');
const crypto = require('crypto');
const { updateOneOrder, findOneOrder } = require('../models/use-cases/order');
const { findServiceOperatorByAccessKey } = require('./checkAndFetchServiceDetails');
const { customLog } = require('./loggerHelper');
const operatorsData = require('./operatorsData.json');
const paymentGatewayOrders = require('../models/entities/paymentGatewayOrders');
const { refundFailure, refundInitiated } = require('./emailTemplate/billpayments');
const emailer = require('./emailer');
const { findByName } = require('../models/use-cases/settings');
const { partnerLogos } = require('./partnerLogos');
const { fetchPartnerDetails } = require('../models/use-cases/systemUser');
const { resolveEmailTemplate } = require('../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('./emailTemplateKeys');
const { v2LayoutVariables } = require('./emailTemplate/sharedLayout');

const accessKey = operatorsData['ccAvenuePaymentGateway']['accessKey'];

const IV = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f]);

function encrypt(plainText, workingKey) {
    const key = crypto.createHash('md5').update(workingKey).digest();
    const cipher = crypto.createCipheriv('aes-128-cbc', key, IV);
    let encoded = cipher.update(plainText, 'utf8', 'hex');
    encoded += cipher.final('hex');
    return encoded;
}

function decrypt(encText, workingKey) {
    const key = crypto.createHash('md5').update(workingKey).digest();
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, IV);
    let decoded = decipher.update(encText, 'hex', 'utf8');
    decoded += decipher.final('utf8');
    return decoded;
}

async function paymentRefundInitiatedEmailInternal({ name, email, amount, transactionId, serviceProvider, typeOfService, registeredBy }) {
    const partnerData = registeredBy ? await fetchPartnerDetails(registeredBy) : await partnerLogos();
    const resolved = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.REFUND_INITIATED,
        service: EMAIL_TEMPLATE_SERVICES.REFUND,
        variables: {
            name: name || 'Corporate',
            amount,
            branding: partnerData?.branding || 'Peko',
            website: partnerData?.website || 'https://www.peko.one',
            ...v2LayoutVariables(partnerData),
        },
        fallback: () => refundInitiated({ name: name || 'Corporate', amount, transactionId, serviceProvider, typeOfService, partnerDetails: partnerData }),
        fallbackSubject: 'Refund Initiated',
    });
    await emailer.email(email, resolved.subject, resolved.html);
}

async function paymentRefundFailureEmailInternal({ amount, transactionId, serviceProvider, typeOfService }) {
    const resp = await findByName({ name: "pekoWebsite" });
    const email = resp.emails;
    const partnerData = await partnerLogos();
    const resolved = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.REFUND_FAILED,
        service: EMAIL_TEMPLATE_SERVICES.REFUND,
        variables: {
            name: 'Admin',
            amount,
            transactionId,
            branding: partnerData?.branding || 'Peko',
            website: partnerData?.website || 'https://www.peko.one',
            ...v2LayoutVariables(partnerData),
        },
        fallback: () => refundFailure({ name: 'Admin', amount, transactionId, serviceProvider, typeOfService, partnerDetails: partnerData }),
        fallbackSubject: 'Refund Failed',
    });
    await emailer.email(email, resolved.subject, resolved.html);
}

/**
 * Refund a CCAvenue payment from the payment MS (manual admin refund).
 * Mirrors cancelPGTransaction (Cashfree) in interface:
 *   cancelCcAvenueTransaction(corporateTxnId, requestedAmount, displayAmount, logTraceId)
 *
 * `requestedAmount`  — the PG leg to refund (may be less than total for split PG+Wallet).
 * `displayAmount`    — customer-facing amount shown in email (may differ for split payments).
 */
exports.cancelCcAvenueTransaction = async (corporateTxnId, requestedAmount, displayAmount, logTraceId) => {
    let refundAmount = 0;
    let emailAmount = 0;
    let serviceProvider, serviceCategory;
    let paymentBodyData = {};

    try {
        const orderDetails = await findOneOrder({ corporateTxnId });
        if (!orderDetails) {
            return { status: false, message: "Order details not found" };
        }

        serviceProvider = orderDetails.serviceOperator?.serviceProvider;
        serviceCategory = orderDetails.serviceOperator?.serviceCategory;

        try {
            const parsedResponse = orderDetails?.paymentModeResponse
                ? JSON.parse(orderDetails.paymentModeResponse)
                : {};
            paymentBodyData = parsedResponse?.pgResponse ?? parsedResponse;
        } catch (parseError) {
            customLog(logTraceId, "error", {
                message: "Invalid paymentModeResponse JSON in order details",
                corporateTxnId,
                error: parseError,
            });
            return { status: false, message: "Invalid payment response details" };
        }

        const referenceNo = paymentBodyData?.reference_no;
        const paidAmount = Number(paymentBodyData?.order_amt || 0);

        if (!referenceNo) {
            return { status: false, message: "CCAvenue reference number not found for refund" };
        }
        if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
            return { status: false, message: "Invalid refund amount" };
        }

        const requested = Number(requestedAmount);
        refundAmount = Number.isFinite(requested) && requested > 0 ? Math.min(requested, paidAmount) : paidAmount;
        const requestedDisplay = Number(displayAmount);
        emailAmount = Number.isFinite(requestedDisplay) && requestedDisplay > 0 ? requestedDisplay : refundAmount;

        if (paymentBodyData?.refundStatus === "SUCCESS") {
            return { status: true, message: "Refund already processed", refundStatus: "SUCCESS" };
        }

        const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
        if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
            return { status: false, message: serviceDetails.error };
        }

        // Resolve working key and access code from the order's service operator (already fetched)
        let WORKING_KEY, ACCESS_CODE;
        if (orderDetails.serviceOperator?.paymentclientid) {
            WORKING_KEY = orderDetails.serviceOperator.paymentclientid.split('_')[1];
            ACCESS_CODE = orderDetails.serviceOperator.paymentclientsecret ?? serviceDetails.vendor.optional2;
        } else {
            WORKING_KEY = serviceDetails.vendor.optional3;
            ACCESS_CODE = serviceDetails.vendor.optional2;
        }

        const baseUrl = serviceDetails.vendor.optional4;

        const refundPayload = JSON.stringify({
            reference_no: referenceNo,
            refund_amount: refundAmount.toFixed(2),
            refund_ref_no: new Date().valueOf()
        });

        const encRequest = encrypt(refundPayload, WORKING_KEY);
        customLog(logTraceId, "info", { message: "Initiating CCAvenue refund (manual)", referenceNo, refundAmount, corporateTxnId, encRequest }, "VENDOR");

        const response = await axios({
            method: "POST",
            url: `${baseUrl}/apis/servlet/DoWebTrans`,
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            data: qs.stringify({
                enc_request: encRequest,
                access_code: ACCESS_CODE,
                request_type: "JSON",
                response_type: "JSON",
                command: "refundOrder",
            }),
        });

        const parsedResponse = qs.parse(String(response.data).trim());
        const { status, enc_response } = parsedResponse;

        if (String(status) === "1") {
            throw new Error(enc_response || "CCAvenue refund API error");
        }

        const refundResult = JSON.parse(decrypt(enc_response, WORKING_KEY));
        const refundData = refundResult.Refund_Order_Result ?? refundResult;
        customLog(logTraceId, "info", { message: "CCAvenue refund response (manual)", response: refundData }, "VENDOR");

        const isSuccess = String(refundData.refund_status) === "0";
        const reasonLower = (refundData.reason || "").toLowerCase();
        const alreadyRefunded = !isSuccess && (
            reasonLower.includes("duplicate merchant") ||
            reasonLower.includes("multiple refund not allowed")
        );
        const refundStatus = (isSuccess || alreadyRefunded) ? "SUCCESS" : "Refund failed";

        paymentBodyData.refundStatus = refundStatus;
        paymentBodyData.refundResults = [refundData];

        await updateOneOrder(corporateTxnId, {
            paymentModeResponse: JSON.stringify(paymentBodyData),
        });

        const pgOrder = await paymentGatewayOrders.findOne({ where: { paymentRefId: String(corporateTxnId) } });
        if (pgOrder) {
            let pgPaymentResponse = {};
            try { pgPaymentResponse = JSON.parse(pgOrder.paymentResponse || '{}'); } catch (parseErr) {
                customLog(logTraceId, "error", { message: "Failed to parse pgOrder paymentResponse", error: parseErr });
            }
            pgPaymentResponse.refundStatus = refundStatus;
            pgPaymentResponse.refundResults = [refundData];
            await paymentGatewayOrders.update(
                { paymentResponse: JSON.stringify(pgPaymentResponse) },
                { where: { paymentRefId: String(corporateTxnId) } }
            );
        }

        if (!isSuccess && !alreadyRefunded) {
            throw new Error(refundData.reason || "CCAvenue refund failed");
        }

        if (alreadyRefunded) {
            customLog(logTraceId, "info", { message: "CCAvenue refund already exists for this order, treating as INITIATED", corporateTxnId, reason: refundData.reason });
        }

        try {
            const corporateEmail = orderDetails?.credential?.email;
            const corporateName = orderDetails?.credential?.name || orderDetails?.credential?.username || "Corporate";
            if (corporateEmail) {
                await paymentRefundInitiatedEmailInternal({
                    name: corporateName,
                    email: corporateEmail,
                    amount: emailAmount,
                    transactionId: corporateTxnId,
                    serviceProvider,
                    typeOfService: serviceCategory,
                    registeredBy: orderDetails?.credential?.registeredBy,
                });
            } else {
                customLog(logTraceId, "info", {
                    message: "Corporate email not found, skipping refund initiated email",
                    corporateTxnId,
                });
            }
        } catch (emailError) {
            customLog(logTraceId, "error", { message: "Error sending CCAvenue refund initiated email", error: emailError });
        }

        return { status: true, refundStatus, message: "Refund initiated" };

    } catch (error) {
        customLog(logTraceId, "error", {
            message: "CCAvenue manual refund failed",
            error: error?.response?.data ?? error?.message ?? error,
            corporateTxnId,
        }, "VENDOR");

        try {
            const orderDetails = await findOneOrder({ corporateTxnId });
            if (orderDetails?.paymentModeResponse) {
                let failedPaymentBodyData = {};
                try { failedPaymentBodyData = JSON.parse(orderDetails.paymentModeResponse); } catch (parseErr) {
                    customLog(logTraceId, "error", { message: "Failed to parse paymentModeResponse in refund error handler", error: parseErr });
                }
                failedPaymentBodyData.refundResults = [error?.response?.data];
                failedPaymentBodyData.refundStatus = "Refund failed";
                await updateOneOrder(corporateTxnId, {
                    paymentModeResponse: JSON.stringify(failedPaymentBodyData),
                });
            }
        } catch (updateError) {
            customLog(null, "error", { message: "Error updating order after CCAvenue refund failure", error: updateError });
        }

        try {
            await paymentRefundFailureEmailInternal({
                amount: emailAmount,
                transactionId: corporateTxnId,
                serviceProvider,
                typeOfService: serviceCategory,
            });
        } catch (emailError) {
            customLog(logTraceId, "error", { message: "Error sending CCAvenue refund failure email", error: emailError });
        }

        return { status: false, message: "Something went wrong", error: error?.response?.data };
    }
};
