const qs = require('querystring');
const axios = require('axios');
const crypto = require('crypto');
const { customLog } = require('./loggerHelper');
const { findServiceOperatorByAccessKey } = require('./checkAndFetchServiceDetails');
const operatorsData = require('./operatorsData.json');
const paymentGatewayOrders = require('../models/entities/paymentGatewayOrders');
const { findOneOrder, updateOneOrder } = require('../models/use-cases/order');
const { refundFailure, refundInitiated } = require('./emailTemplates/common');
const emailer = require('./emailer');
const { findByName } = require('../models/use-cases/setting');
const { v4: uuidv4 } = require('uuid');
const { partnerLogos } = require('./partnerLogos');
const { fetchPartnerDetails } = require('../models/use-cases/systemUser');
const { resolveEmailTemplate } = require('../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('./emailTemplateKeys');
const { v2LayoutVariables } = require('./emailTemplate/sharedLayout');
const accessKey = operatorsData["ccAvenuePaymentGateway"]["accessKey"];

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

exports.encrypt = encrypt;
exports.decrypt = decrypt;

async function paymentRefundInitiatedEmailInternal({ name, email, amount, transactionId, serviceProvider, typeOfService, registeredBy }) {
    const partnerData = registeredBy ? await fetchPartnerDetails(registeredBy) : await partnerLogos();
    const resolved = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.REFUND_INITIATED,
        service: EMAIL_TEMPLATE_SERVICES.REFUND,
        variables: {
            name: name || 'Corporate',
            amount,
            branding: partnerData?.branding || 'Peko',
            website: partnerData?.baseUrl || 'https://peko.one/in',
            ...v2LayoutVariables(partnerData),
        },
        fallback: () => refundInitiated({
            name: name || "Corporate",
            amount,
            transactionId,
            serviceProvider,
            typeOfService,
        }, partnerData),
        fallbackSubject: 'Refund Initiated',
    });
    await emailer.email({ to: email, subject: resolved.subject, body: resolved.html });
}

async function paymentRefundFailureEmailInternal({ amount, transactionId, serviceProvider, typeOfService }) {

    const resp = await findByName({ name: "pekoWebsite" })
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
            website: partnerData?.baseUrl || 'https://peko.one/in',
            ...v2LayoutVariables(partnerData),
        },
        fallback: () => refundFailure({
            name: "Admin",
            amount,
            transactionId: transactionId,
            serviceProvider,
            typeOfService,
        }),
        fallbackSubject: 'Refund Failed',
    });
    await emailer.email({ to: email, subject: resolved.subject, body: resolved.html });
}

/**
 * Unified CCAvenue refund handler — covers two scenarios:
 *
 * Scenario 1 — Post-order refund (default, earlyExit: false):
 *   Called after the orders table row was created (e.g. admin-initiated refund or BBPS failure
 *   after service dispatch). Updates paymentResponse.refundStatus / refundResults and sends
 *   a customer refund-initiated email on success or an ops failure email on error.
 *
 * Scenario 2 — Early-exit refund (earlyExit: true):
 *   Called when service dispatch fails BEFORE the orders table row is created. Writes an
 *   earlyExitRefund marker into paymentGatewayOrders.paymentResponse so the /complete polling
 *   endpoint can surface the failure to the frontend. Sends an ops failure email on error.
 *
 */
exports.refundCCAvenueTransaction = async (corporateTxnId, options = {}) => {

    let { reason, paymentResponse, refundAmount, logTraceId = uuidv4(), isRefundWithoutOrder = false } = options;
    const pgOrder = await paymentGatewayOrders.findOne({ where: { paymentRefId: String(corporateTxnId) } });
    if (!paymentResponse) {
        paymentResponse = pgOrder.paymentResponse ? JSON.parse(pgOrder.paymentResponse) : {};
    }
    refundAmount = refundAmount ? parseFloat(refundAmount) : Number(paymentResponse.order_amt);
    try {
        if (!pgOrder) {
            return { status: false, message: "Order details not found" };
        }

        const paymentData = JSON.parse(pgOrder.paymentData || '{}');

        if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
            return { status: false, message: "Invalid refund amount" };
        }

        const referenceNo = paymentResponse.reference_no
        if (!referenceNo) {
            return { status: false, message: "CCAvenue reference number not found for refund" };
        }

        // Idempotency guard — skip if a non - failed refund is already recorded
        if (
            paymentResponse?.refundStatus &&
            paymentResponse?.refundStatus !== "Refund failed" &&
            paymentResponse?.refundStatus !== "FAILED"
        ) {
            return { status: true, message: "Refund already initiated", refundStatus: paymentResponse.refundStatus };
        }

        // Resolve gateway credentials
        const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
        if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
            return { status: false, message: serviceDetails.error };
        }

        const serviceAccessKey = paymentData.accessKey ?? null;
        const individualServiceDetails = serviceAccessKey ? await findServiceOperatorByAccessKey(serviceAccessKey) : null;

        let WORKING_KEY, ACCESS_CODE;
        if (individualServiceDetails?.paymentclientid) {
            WORKING_KEY = individualServiceDetails.paymentclientid.split('_')[1];
            ACCESS_CODE = individualServiceDetails.paymentclientsecret ?? serviceDetails.vendor.optional2;
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
        customLog(logTraceId, "info", { message: "Initiating CCAvenue refund", referenceNo, refundAmount, corporateTxnId, encRequest, ACCESS_CODE }, "VENDOR");

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

        // CCAvenue always returns a query-string body regardless of response_type
        const parsedResponse = qs.parse(String(response.data).trim());
        const { status, enc_response } = parsedResponse;

        if (String(status) === "1") {
            throw new Error(enc_response || "CCAvenue refund API error");
        }

        const refundResult = JSON.parse(decrypt(enc_response, WORKING_KEY));
        const refundData = refundResult.Refund_Order_Result ?? refundResult;
        customLog(logTraceId, "info", { message: "CCAvenue refund response", response: refundData }, "VENDOR");

        const isSuccess = String(refundData.refund_status) === "0";
        const reasonLower = (refundData.reason || "").toLowerCase();
        const alreadyRefunded = !isSuccess && (
            reasonLower.includes("duplicate merchant") ||
            reasonLower.includes("multiple refund not allowed")
        );
        const refundStatus = (isSuccess || alreadyRefunded) ? "SUCCESS" : "Refund failed";

        if (isRefundWithoutOrder) {
            paymentResponse.earlyExitRefund = {
                reason: reason || null,
                initiatedAt: new Date().toISOString(),
                refundStatus: (isSuccess || alreadyRefunded) ? "SUCCESS" : "FAILED",
                refundAmount,
                response: refundData,
            };
        } else {
            paymentResponse.refundStatus = refundStatus;
            paymentResponse.refundResults = [refundData];
            await updateOneOrder(corporateTxnId, {
                paymentModeResponse: JSON.stringify(paymentResponse),
            });
        }

        await paymentGatewayOrders.update(
            { paymentResponse: JSON.stringify(paymentResponse) },
            { where: { paymentRefId: String(corporateTxnId) } }
        );

        if (!isSuccess && !alreadyRefunded) {
            throw new Error(refundData.reason || "CCAvenue refund failed");
        }

        if (alreadyRefunded) {
            customLog(logTraceId, "info", { message: "CCAvenue refund already exists for this order, treating as INITIATED", corporateTxnId, reason: refundData.reason });
        }

        // Success email — Scenario 1 only (customer notification)
        try {
            if (!isRefundWithoutOrder) {
                const orderRecord = await findOneOrder({ corporateTxnId: String(corporateTxnId) });
                const corporateEmail = orderRecord?.credential?.email;
                const corporateName = orderRecord?.credential?.name
                const registeredBy = orderRecord?.credential?.registeredBy;
                if (corporateEmail) {
                    await paymentRefundInitiatedEmailInternal({
                        name: corporateName,
                        email: corporateEmail,
                        amount: refundAmount,
                        transactionId: corporateTxnId,
                        serviceProvider: orderRecord?.serviceOperator?.serviceProvider,
                        typeOfService: orderRecord?.serviceOperator?.serviceCategory,
                        registeredBy,
                    });
                } else {
                    customLog(null, "info", {
                        message: "Corporate email not found in orderDetails, skipping refund initiated email",
                        corporateTxnId,
                    });
                }
            }
        } catch (emailError) {
            customLog(logTraceId, "error", { message: "Error sending CCAvenue refund initiated email", error: emailError });
        }

        return { status: true, refundStatus, message: "Refund initiated" };

    } catch (error) {
        customLog(logTraceId, "error", {
            message: "CCAvenue refund failed",
            error: error?.response?.data ?? error?.message ?? error,
            corporateTxnId,
        }, "VENDOR");

        let failedPaymentResponse = {};
        try { failedPaymentResponse = JSON.parse(pgOrder?.paymentResponse || '{}'); } catch (_) { /* ignore */ }
        failedPaymentResponse.earlyExitRefund = {
            reason: reason || null,
            initiatedAt: new Date().toISOString(),
            refundStatus: "FAILED",
            refundAmount: Number(refundAmount) || 0,
            response: error?.response?.data,
        };

        await paymentGatewayOrders.update(
            { paymentResponse: JSON.stringify(failedPaymentResponse) },
            { where: { paymentRefId: corporateTxnId } }
        );
        if (!isRefundWithoutOrder) {
            try {
                const orderDetails = await findOneOrder({ corporateTxnId });
                if (orderDetails?.paymentModeResponse) {
                    let failedPaymentBodyData = {};
                    try {
                        failedPaymentBodyData = JSON.parse(orderDetails.paymentModeResponse);
                    } catch (parseError) {
                        failedPaymentBodyData = {};
                    }
                    failedPaymentBodyData.refundResults = [error?.response?.data];
                    failedPaymentBodyData.refundStatus = "Refund failed";
                    await updateOneOrder(corporateTxnId, {
                        paymentModeResponse: JSON.stringify(failedPaymentBodyData),
                    });
                }
                await paymentRefundFailureEmailInternal({
                    amount: refundAmount,
                    transactionId: corporateTxnId,
                    serviceProvider: orderDetails.serviceOperator?.serviceProvider,
                    typeOfService: orderDetails.serviceOperator?.serviceCategory,
                });
            } catch (updateError) {
                customLog(null, "error", { message: "Error updating order after refund failure", error: updateError });
            }
        }

        return { status: false, message: "Something went wrong", error: error?.response?.data };
    }
};

// Fetch live order status from CCAvenue Status API (orderStatusTracker, version 2.0).
// Returns the parsed status object (unwrapped from Order_Status_Result if present).
// Throws on network / API-level failure.
exports.checkCcAvenueOrderStatus = async (paymentRefId, WORKING_KEY, ACCESS_CODE, baseUrl) => {
    const statusPayload = JSON.stringify({ order_no: paymentRefId, version: "2.0" });
    const encRequest = encrypt(statusPayload, WORKING_KEY);

    customLog(null, "info", { message: "Calling CCAvenue order status API", paymentRefId, encRequest, WORKING_KEY, ACCESS_CODE }, "VENDOR");

    const response = await axios({
        method: "POST",
        url: `${baseUrl}/apis/servlet/DoWebTrans`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        data: qs.stringify({
            enc_request: encRequest,
            access_code: ACCESS_CODE,
            request_type: "JSON",
            response_type: "JSON",
            command: "orderStatusTracker",
            version: "2.0",
        }),
    });

    const parsedResponse = qs.parse(String(response.data).trim());
    const { status, enc_response } = parsedResponse;

    if (String(status) === "1") {
        throw new Error(enc_response || "CCAvenue order status API error");
    }

    const statusResult = JSON.parse(decrypt(enc_response, WORKING_KEY));
    customLog(null, "info", { message: "CCAvenue order status response", response: statusResult }, "VENDOR");

    return statusResult;
};
