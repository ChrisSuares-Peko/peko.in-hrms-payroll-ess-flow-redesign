const qs = require('querystring');
const { encrypt: ccavEncrypt, decrypt: ccavDecrypt, checkCcAvenueOrderStatus } = require('../../utils/ccavenueGateway');
const { customLog } = require('../../utils/loggerHelper');
const operatorsData = require("../../utils/operatorsData.json");
const { findServiceOperatorByAccessKey } = require('../../utils/checkAndFetchServiceDetails');
const ErrorResponse = require('../../utils/error-response');
const accessKey = operatorsData["ccAvenuePaymentGateway"]["accessKey"];
const paymentGatewayOrders = require("../../models/entities/paymentGatewayOrders");
const credential = require("../../models/entities/credential");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { checkBillAvenueBalance, notifyBillAvenueLowBalance } = require('../../utils/billAvenueWallet');
const { ORDER_KIND } = require('../../constants/orderKind');
const walletEntity = require("../../models/entities/wallet");
const { findOneOrder } = require('../../models/use-cases/order');
const prepaid = require("./telecomPayments/prepaid");
const giftcards = require("./giftCard");
const { normalizeCustomerMobile, getABiller, commonBillHandler } = require('./commonBillHandler');
const { assertBbpsChannelAmount } = require('../../utils/billPayments_utils');

const GENERIC_ERROR_MESSAGE = "We're experiencing a temporary issue. Please try again later. If the problem continues, contact us at reach@peko.one.";

function buildHtmlRedirect(url) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><script>window.top.location.href=${JSON.stringify(url)};</script></body></html>`;
}


function getEnvFrontendUrl() {
    return process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_PRODUCTION_URL
        : process.env.FRONTEND_STAGING_URL;
}

async function resolveFrontendBaseUrl(registeredBy, envFrontendUrl) {
    if (!registeredBy) {
        return envFrontendUrl;
    }
    try {
        const partnerDetails = await fetchPartnerDetails(registeredBy);
        const configuredBaseUrl = partnerDetails?.baseUrl;
        if (!configuredBaseUrl) {
            customLog(null, 'info', {
                action: 'ccavenue:partnerBaseUrlFallback',
                message: 'CCAvenue handleResponse: partner has no usable baseUrl, using environment URL',
                registeredBy,
                baseUrl: partnerDetails?.baseUrl ?? null,
            });
            return envFrontendUrl;
        }
        return configuredBaseUrl;
    } catch (error) {
        customLog(null, 'error', {
            action: 'ccavenue:partnerBaseUrlLookupFailed',
            message: 'CCAvenue handleResponse: partner baseUrl lookup failed, using environment URL',
            registeredBy,
            error: String(error),
        });
        return envFrontendUrl;
    }
}

// POST /api/v1/corporate/:corporateId/payment-gateway/ccavenue-gateway/initiate
exports.initiatePayment = async (req, res, next) => {
    try {
        const serviceAccessKey = req.body.accessKey;
        const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
        const individualServiceDetails = serviceAccessKey ? await findServiceOperatorByAccessKey(serviceAccessKey) : null;
        const credentialId = req.user.id;
        const packageId = req.user.packageId;
        const corporateUserId = req.user.corporateId;
        // const orderIdPrefix = req.user.role === "CORPORATE_SUB_USER" ? "pekoSub" : "peko";

        if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
            return next(new ErrorResponse(serviceDetails["error"], 400));
        }

        const baseUrl = serviceDetails.vendor.apiUrl;
        let MERCHANT_ID, WORKING_KEY;
        const ACCESS_CODE = individualServiceDetails?.paymentclientsecret ?? serviceDetails.vendor.optional2;
        if (individualServiceDetails?.paymentclientid) {
            const [merchantId, workingKey] = individualServiceDetails.paymentclientid.split('_');
            MERCHANT_ID = merchantId;
            WORKING_KEY = workingKey;
        } else {
            MERCHANT_ID = serviceDetails.vendor.optional1;
            WORKING_KEY = serviceDetails.vendor.optional3;
        }
        // Backend webhook URL — CCAvenue POSTs the encrypted result here after payment
        const serverBaseUrl = process.env.NODE_ENV === 'production'
            ? process.env.PRODUCTION_URL
            : process.env.STAGING_URL;
        const redirectUrl = `${serverBaseUrl}/api/v1/webhook/ccavenue/payment-gateway/ccavenue/response`;

        const paymentRefId = new Date().valueOf();
        const amount = parseFloat(req.body.pgAmount).toFixed(2);
        const mobileNo = normalizeCustomerMobile(req.user.mobileNo)

        if (!MERCHANT_ID || !ACCESS_CODE || !WORKING_KEY || !amount) {
            customLog('CCAvenue credentials not configured in environment', 'error', { ACCESS_CODE, MERCHANT_ID, WORKING_KEY, amount, serviceDetails, individualServiceDetails });
            return res.status(500).json({
                status: 500,
                message: 'Payment gateway not configured',
                data: {},
            });
        }

        const gatewayOptionsSet = new Set();
        if (req.body.billerId) {
            const billerData = await getABiller({
                credentialId,
                packageId,
                corporateUserId,
                billerId: req.body.billerId,
                logTraceId: req?.LogTraceId,
            }) || null;
            const { billerPaymentModes } = billerData || {};
            const paymentModeInfo = billerPaymentModes?.paymentModeInfo || [];
            if (Array.isArray(paymentModeInfo) && paymentModeInfo.length > 0) {
                const upperCasedModes = paymentModeInfo.map((m) =>
                    String(m.paymentMode || "").toUpperCase()
                );
                upperCasedModes.forEach((mode) => {
                    switch (mode) {
                        case "UPI":
                        case "BHARAT QR":
                            gatewayOptionsSet.add("OPTUPI");
                            break;
                        case "DEBIT CARD":
                            gatewayOptionsSet.add("OPTDBCRD");
                            break;
                        case "CREDIT CARD":
                            gatewayOptionsSet.add("OPTCRDC");
                            break;
                        case "INTERNET BANKING":
                            gatewayOptionsSet.add("OPTNBK");
                            break;
                        default:
                            break;
                    }
                });
            }

            const preflightMobile = normalizeCustomerMobile(req.user.mobileNo || req.user.mobile);
            if (!preflightMobile) {
                customLog(req?.LogTraceId, "error", {
                    message: "CCAvenue create-order pre-flight rejection: customer mobile invalid",
                    accessKey: serviceAccessKey,
                    billerId: req.body.billerId,
                }, "VENDOR");
                return next(new ErrorResponse("Valid customer mobile number is required to pay this biller.", 400));
            }
            if (gatewayOptionsSet.size === 0) {
                customLog(req?.LogTraceId, "error", {
                    message: "CCAvenue create-order pre-flight rejection: no biller payment mode maps to a supported checkout option",
                    accessKey: serviceAccessKey,
                    billerId: req.body.billerId,
                }, "VENDOR");
                return next(new ErrorResponse("This biller does not currently support any of the available online payment methods. Please try again later or contact support.", 400));
            }

            const channelLimitMessage = await assertBbpsChannelAmount({
                billerData,
                accessKey: serviceAccessKey,
                amount: req.body.amount,
                ccf1Amount: req.body.ccf1Amount,
                billerId: req.body.billerId,
                logTraceId: req?.LogTraceId,
            });
            if (channelLimitMessage) {
                return next(new ErrorResponse(channelLimitMessage, 400));
            }

            const billAvenueAmount = parseFloat(req.body.amount) + parseFloat(req.body.ccf1Amount ?? 0) / 100;
            if (Number.isFinite(billAvenueAmount) && billAvenueAmount > 0) {
                const vendorCheck = await checkBillAvenueBalance(billAvenueAmount, req?.LogTraceId);
                if (!vendorCheck.sufficient) {
                    customLog(req?.LogTraceId, "error", {
                        message: "BBPS create-order blocked: insufficient BillAvenue vendor wallet balance",
                        required: billAvenueAmount,
                        available: vendorCheck.balance,
                        billerId: req.body.billerId,
                    }, "VENDOR");
                    await notifyBillAvenueLowBalance(vendorCheck, { required: billAvenueAmount, billerId: req.body.billerId }, req?.LogTraceId);
                    return next(new ErrorResponse("This service is temporarily unavailable. Please try again later.", 503));
                }
            }
        }

        const persistedPaymentData = {
            ...req.body,
            paymentRefId,
            userId: req.user.id,
            ...(req.user.role === "CORPORATE_SUB_USER" && {
                role: req.user.role,
                subCorporateId: req.user.subCorporateId,
            }),
        };
        await paymentGatewayOrders.create({
            paymentRefId,
            orderKind: ORDER_KIND.PAYMENT_GATEWAY,
            paymentData: JSON.stringify(persistedPaymentData),
            status: "ORDERED",
            referenceNo: paymentRefId,
            credentialId: req.user.id
        });

        // Derive ignore_payment_option from biller-supported modes.
        // CCAvenue supports multiple values in ignore_payment_option
        // but not in payment_option, so we invert: ignore everything the biller does NOT support.
        const ALL_CCAV_OPTIONS = ['OPTNBK', 'OPTDBCRD', 'OPTCRDC', 'OPTUPI'];
        const ignorePaymentOption = gatewayOptionsSet.size > 0
            ? ALL_CCAV_OPTIONS.filter(opt => !gatewayOptionsSet.has(opt)).join('|')
            : undefined;
        customLog(req?.LogTraceId, "info", {
            message: "Bill payment supported payment methods",
            data: gatewayOptionsSet,
            ignorePaymentOption
        });
        const params = qs.stringify({
            merchant_id: MERCHANT_ID,
            order_id: paymentRefId,
            currency: 'INR',
            amount,
            redirect_url: redirectUrl,
            cancel_url: redirectUrl,
            language: 'EN',
            integration_type: 'iframe_normal',
            billing_name: req.user.name,
            billing_email: req.user.email,
            billing_tel: mobileNo,
            customer_identifier: req.user.username,
            merchant_param5: req.user.registeredBy,
            ...(ignorePaymentOption && { ignore_payment_option: ignorePaymentOption }),
            // billing_address: 'BUILDING NO 55, LANE 2, WESTEND MARG, SAIDULLAJAB. NEAR SAKET METRO STATION, NEW DELHI 110030.',
            // billing_city: "South West Delhi",
            // billing_state: "Delhi",
            // billing_zip: '110030',
            // billing_country: 'India',
            // upiPaymentFlag: "Intent,QR",
            // delivery_name,
            // delivery_address,
            // delivery_city,
            // delivery_state,
            // delivery_zip,
            // delivery_country,
            // delivery_tel,
            // merchant_param1,
            // merchant_param2,
            // merchant_param3,
            // merchant_param4,
            // merchant_param5,
            // promo_code,
        });

        const encRequest = ccavEncrypt(params, WORKING_KEY);
        const iframeUrl = `${baseUrl}/transaction/transaction.do?command=initiateTransaction`
            + `&merchant_id=${MERCHANT_ID}&encRequest=${encRequest}&access_code=${ACCESS_CODE}`;

        return res.status(200).json({
            status: true,
            message: 'Order created successfully',
            data: {
                iframeUrl,
                amount,
                orderId: paymentRefId,
                encRequest,
                MERCHANT_ID,
                ACCESS_CODE   
            },
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", {
            message: "CCAvenue initiatePayment error",
            error: error,
        });
        return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 501));
    }
};

// POST /api/v1/ccavenue/response — CCAvenue POSTs encrypted result here (public, no JWT)
// Stores the payment outcome in DB, then redirects the browser to the frontend processing page.
// The frontend processing page calls /complete (JWT-protected) to dispatch service fulfillment.
exports.handleResponse = async (req, res) => {
    const envFrontendUrl = getEnvFrontendUrl();
    let frontendUrl = envFrontendUrl;

    try {
        const orderDetails = await paymentGatewayOrders.findOne({
            where: { paymentRefId: req.body.orderNo },
            include: [{ model: credential, attributes: ['registeredBy'] }],
        });
        if (!orderDetails) {
            customLog(null, 'error', {
                action: 'ccavenue:responseOrderNotFound',
                message: 'CCAvenue handleResponse: order not found',
                orderNo: req.body.orderNo,
            });
            return res.send(buildHtmlRedirect(`${frontendUrl}/payments/payment-failure`));
        }

        frontendUrl = await resolveFrontendBaseUrl(
            orderDetails.credential?.registeredBy,
            envFrontendUrl
        );

        const encResp = req.body.encResp;
        if (!encResp) {
            customLog(null, 'error', {
                action: 'ccavenue:responseMissingEncResp',
                message: 'CCAvenue handleResponse: missing encResp',
                orderNo: req.body.orderNo,
            });
            return res.send(buildHtmlRedirect(`${frontendUrl}/payments/payment-failure`));
        }

        const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
        if (!serviceDetails || Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            customLog(null, 'error', {
                action: 'ccavenue:responseServiceConfigError',
                message: 'CCAvenue handleResponse: service config error',
                error: serviceDetails?.error ?? 'service operator not found',
            });
            return res.send(buildHtmlRedirect(`${frontendUrl}/payments/payment-failure`));
        }

        const paymentData = JSON.parse(orderDetails.paymentData || '{}');
        const serviceAccessKey = paymentData.accessKey ?? null;
        const individualServiceDetails = serviceAccessKey ? await findServiceOperatorByAccessKey(serviceAccessKey) : null;
        let WORKING_KEY;
        if (individualServiceDetails?.paymentclientid) {
            WORKING_KEY = individualServiceDetails.paymentclientid.split('_')[1];
        } else {
            WORKING_KEY = serviceDetails.vendor.optional3;
        }

        const decrypted = ccavDecrypt(encResp, WORKING_KEY);
        const responseObj = qs.parse(decrypted);
        const { order_status, order_id } = responseObj;
        const paymentRefId = order_id;

        customLog(null, 'info', {
            message: 'CCAvenue payment response received',
            data: responseObj
        });

        if (order_status === 'Aborted') {
            return res.send(buildHtmlRedirect(`${frontendUrl}/payments/payment-failure`));
        }
        // Idempotent: only update if still ORDERED (duplicate CCAvenue callbacks are ignored).
        // PENDING = CCAvenue confirmed payment captured; /complete sets COMPLETE after service dispatch.
        if (orderDetails.status === 'ORDERED') {
            const isSuccess = order_status === 'Success';
            await paymentGatewayOrders.update(
                {
                    status: isSuccess ? 'ORDERED' : 'FAILED',
                    paymentResponse: JSON.stringify(responseObj),
                },
                { where: { paymentRefId, status: 'ORDERED' } }
            );
        }

        // Always send user to processing page — /complete will return the definitive result
        return res.send(
            buildHtmlRedirect(`${frontendUrl}/payments/ccavenue-processing?orderId=${paymentRefId}`)
        );
    } catch (err) {
        customLog(null, 'error', {
            action: 'ccavenue:responseError',
            message: 'CCAvenue handleResponse error',
            orderNo: req.body?.orderNo,
            error: String(err),
        });
        return res.send(buildHtmlRedirect(`${frontendUrl}/payments/payment-failure`));
    }
};

// POST /api/v1/corporate/:corporateId/payment-gateway/ccavenue-gateway/complete (JWT protected)
// Called ONCE by the frontend processing page. Reads the CCAvenue response stored by handleResponse,
// dispatches service fulfillment, and returns the result in the same shape as Cashfree /complete.
// Supported services: prepaid, postpaid, electricity, LPG, broadband, DTH, FASTag, traffic challan, prepaid meter.
exports.completePayment = async (req, res, next) => {
    const { orderId } = req.body;
    const credentialId = req.user.id;
    customLog(null, 'info', { message: `Processing payment for order id${orderId}` });
    try {
        if (!orderId) {
            return next(new ErrorResponse('orderId is required', 400));
        }

        const paymentRefId = String(orderId);
        const orderDetails = await paymentGatewayOrders.findOne({ where: { paymentRefId } });
        if (!orderDetails) {
            return next(new ErrorResponse('Order not found', 404));
        }

        let paymentBodyData;
        try {
            paymentBodyData = JSON.parse(orderDetails.paymentData);
        } catch (_) {
            return next(new ErrorResponse('Invalid order data', 500));
        }
        customLog(null, 'info', { message: `Payment body data`, paymentBodyData });

        // Security: verify the order was created by the authenticated user
        if (String(paymentBodyData.userId) !== String(credentialId)) {
            customLog(req?.LogTraceId, 'error', {
                message: 'CCAvenue completePayment: user mismatch',
                expectedUserId: paymentBodyData.userId,
                requestUserId: credentialId,
                paymentRefId,
            });
            return next(new ErrorResponse('Unauthorized', 403));
        }

        const serviceAccessKey = paymentBodyData.accessKey;

        // Idempotent fast-path: service was already dispatched by a prior /complete call
        if (orderDetails.status === 'COMPLETE') {
            // earlyExitRefund: BBPS handler may have refunded after capturing payment
            let earlyExitRefund = null;
            if (orderDetails.paymentResponse) {
                try {
                    earlyExitRefund = JSON.parse(orderDetails.paymentResponse)?.earlyExitRefund || null;
                } catch (_) { /* paymentResponse not JSON */ }
            }
            if (earlyExitRefund) {
                const walletData = await walletEntity.findOne({ where: { credentialId }, attributes: ['balance'] });
                return res.status(400).json({
                    status: false,
                    data: {
                        failed: true,
                        corporateTxnId: paymentRefId,
                        corporateFinalBalance: walletData?.balance ?? null,
                        refundStatus: earlyExitRefund.refundStatus,
                        refundAmount: earlyExitRefund.refundAmount,
                        reason: earlyExitRefund.reason,
                    },
                    message: 'Payment failed and refund has been initiated.',
                    responseCode: '001',
                });
            }

            const txn = await findOneOrder({ corporateTxnId: String(paymentRefId) });
            if (!txn || txn.status === 'AWAITED' || txn.status === 'PENDING' || txn.status === 'PROCESSING') {
                const walletData = await walletEntity.findOne({ where: { credentialId }, attributes: ['balance'] });
                let billDetails = null;
                try {
                    billDetails = txn?.orderResponse ? JSON.parse(txn.orderResponse)?.billDetails : null;
                } catch (_) { /* orderResponse missing or malformed */ }
                const serviceType = Object.values(operatorsData).find(op => op.accessKey === serviceAccessKey)?.type || null;
                return res.status(200).json({
                    status: true,
                    data: {
                        processing: true,
                        ...(billDetails || {}),
                        corporateTxnId: paymentRefId,
                        paymentMode: txn?.paymentMode || paymentBodyData.paymentMode || null,
                        corporateFinalBalance: walletData?.balance ?? null,
                        ...(serviceType && { serviceProvider: serviceType }),
                    },
                    message: 'Payment is processing',
                    responseCode: '001',
                });
            }

            if (txn.status === 'SUCCESS') {
                const paymentResponse = orderDetails.paymentResponse ? JSON.parse(orderDetails.paymentResponse) : null;
                const walletData = await walletEntity.findOne({ where: { credentialId }, attributes: ['balance'] });
                return res.status(200).json({
                    status: true,
                    message: 'Payment processed successfully',
                    responseCode: '000',
                    data: {
                        paymentRefId: orderDetails.paymentRefId,
                        corporateTxnId: orderDetails.paymentRefId,
                        amount: paymentBodyData.amount,
                        accessKey: paymentBodyData.accessKey,
                        account: paymentBodyData.account,
                        paymentMode: paymentResponse?.payment_mode || paymentBodyData.paymentMode || null,
                        paymentGatewayResponse: paymentResponse,
                        corporateFinalBalance: walletData?.balance ?? null,
                    },
                });
            }

            // FAILURE or REFUNDED
            const walletData = await walletEntity.findOne({ where: { credentialId }, attributes: ['balance'] });
            return res.status(400).json({
                status: false,
                data: { corporateFinalBalance: walletData?.balance ?? null },
                message: 'Payment failed',
                responseCode: '001',
            });
        }

        // Gateway-level failure already stored by handleResponse
        if (orderDetails.status === 'FAILED') {
            const walletData = await walletEntity.findOne({ where: { credentialId }, attributes: ['balance'] });
            return res.status(400).json({
                status: false,
                message: 'Payment failed',
                data: { failed: true, corporateFinalBalance: walletData?.balance ?? null },
            });
        }

        // Concurrent duplicate call — another request already claimed processing
        if (orderDetails.status === 'IN_PROGRESS') {
            return res.status(200).json({
                status: true,
                data: { processing: true },
                message: 'Payment is processing',
            });
        }

        // Normal path: status is ORDERED — call CCAvenue Status API for authoritative result
        const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse('Payment gateway configuration error', 500));
        }

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

        let responseObj;
        try {
            responseObj = await checkCcAvenueOrderStatus(paymentRefId, WORKING_KEY, ACCESS_CODE, baseUrl);
            responseObj.gateway = "CC_AVUNUE"
            responseObj.paymentGatewayName = "CCAvenue"
            // orderStatusTracker doesn't return merchant_param6 (card last-4) or issuing_bank,
            // which BillAvenue requires as mandatory paymentInfo for card txns from 2026-10-01.
            // Carry them forward from the redirect callback that handleResponse already persisted.
            let redirectCallback = null;
            try {
                redirectCallback = orderDetails.paymentResponse ? JSON.parse(orderDetails.paymentResponse) : null;
            } catch (_) { /* prior paymentResponse not JSON */ }
            if (redirectCallback) {
                if (redirectCallback.merchant_param6 && !responseObj.merchant_param6) responseObj.merchant_param6 = redirectCallback.merchant_param6;
                if (redirectCallback.issuing_bank && !responseObj.issuing_bank) responseObj.issuing_bank = redirectCallback.issuing_bank;
                if (redirectCallback.payment_mode && !responseObj.payment_mode) responseObj.payment_mode = redirectCallback.payment_mode;
            }
            await paymentGatewayOrders.update(
                { paymentResponse: JSON.stringify(responseObj) },
                { where: { paymentRefId } }
            );
        } catch (statusErr) {
            customLog(req?.LogTraceId, 'error', { message: 'CCAvenue order status API failed', paymentRefId, error: statusErr });
            return res.status(200).json({
                status: true,
                data: { processing: true },
                message: 'Awaiting payment confirmation from gateway',
            });
        }

        if (!['Successful', 'Shipped'].includes(responseObj.order_status)) {
            await paymentGatewayOrders.update({ status: 'FAILED' }, { where: { paymentRefId } });
            const walletData = await walletEntity.findOne({ where: { credentialId }, attributes: ['balance'] });
            return res.status(400).json({
                status: false,
                message: 'Payment failed',
                data: { failed: true, corporateFinalBalance: walletData?.balance ?? null },
            });
        }

        // CAS: ORDERED → IN_PROGRESS — prevents double-processing on concurrent calls
        const [affectedCount] = await paymentGatewayOrders.update(
            { status: 'IN_PROGRESS' },
            { where: { paymentRefId, status: 'ORDERED' } }
        );
        if (affectedCount === 0) {
            // Lost CAS race — another call already claimed this order; return its current result
            const txn = await findOneOrder({ corporateTxnId: String(paymentRefId) });
            const walletData = await walletEntity.findOne({ where: { credentialId }, attributes: ['balance'] });
            let billDetails = null;
            try {
                billDetails = txn?.orderResponse ? JSON.parse(txn.orderResponse)?.billDetails : null;
            } catch (_) { /* orderResponse missing or malformed */ }
            const serviceType = Object.values(operatorsData).find(op => op.accessKey === serviceAccessKey)?.type || null;
            if (txn?.status === 'SUCCESS') {
                return res.status(200).json({
                    status: true,
                    message: 'Payment already processed successfully',
                    responseCode: '000',
                    data: {
                        paymentRefId,
                        corporateTxnId: paymentRefId,
                        amount: paymentBodyData.amount,
                        accessKey: paymentBodyData.accessKey,
                        account: paymentBodyData.account,
                        paymentMode: responseObj.payment_mode || paymentBodyData.paymentMode || null,
                        paymentGatewayResponse: responseObj,
                        corporateFinalBalance: walletData?.balance ?? null,
                    },
                });
            }
            return res.status(200).json({
                status: true,
                data: {
                    processing: true,
                    ...(billDetails || {}),
                    corporateTxnId: paymentRefId,
                    paymentMode: txn?.paymentMode || paymentBodyData.paymentMode || null,
                    corporateFinalBalance: walletData?.balance ?? null,
                    ...(serviceType && { serviceProvider: serviceType }),
                },
                message: 'Payment is processing',
                responseCode: '001',
            });
        }

        req.body = {
            ...paymentBodyData,
            corporateTxnId: paymentRefId,
            paymentGatewayResponse: responseObj,
        };

        const operator = paymentBodyData.accessKey;
        try {
            switch (operator) {
                case operatorsData['prepaid']['accessKey']:
                    await prepaid.payment(req, res, next);
                    break;
                case operatorsData['postpaid']['accessKey']: {
                    const h = commonBillHandler(operatorsData['postpaid']['accessKey'], operatorsData['postpaid']['category'], operatorsData['postpaid']['type']);
                    await h.payment(req, res, next);
                    break;
                }
                case operatorsData['electricity']['accessKey']: {
                    const h = commonBillHandler(operatorsData['electricity']['accessKey'], operatorsData['electricity']['category'], operatorsData['electricity']['type']);
                    await h.payment(req, res, next);
                    break;
                }
                case operatorsData['lpg']['accessKey']: {
                    const h = commonBillHandler(operatorsData['lpg']['accessKey'], operatorsData['lpg']['category'], operatorsData['lpg']['type']);
                    await h.payment(req, res, next);
                    break;
                }
                case operatorsData['broadband']['accessKey']: {
                    const h = commonBillHandler(operatorsData['broadband']['accessKey'], operatorsData['broadband']['category'], operatorsData['broadband']['type']);
                    await h.payment(req, res, next);
                    break;
                }
                case operatorsData['dth']['accessKey']: {
                    const h = commonBillHandler(operatorsData['dth']['accessKey'], operatorsData['dth']['category'], operatorsData['dth']['type']);
                    await h.payment(req, res, next);
                    break;
                }
                case operatorsData['fastag']['accessKey']: {
                    const h = commonBillHandler(operatorsData['fastag']['accessKey'], operatorsData['fastag']['category'], operatorsData['fastag']['type']);
                    await h.payment(req, res, next);
                    break;
                }
                case operatorsData['prepaidMeter']['accessKey']: {
                    const h = commonBillHandler(operatorsData['prepaidMeter']['accessKey'], operatorsData['prepaidMeter']['category'], operatorsData['prepaidMeter']['type']);
                    await h.payment(req, res, next);
                    break;
                }
                case operatorsData["pipedGas"]["accessKey"]: {
                    let accessKey = operatorsData["pipedGas"]["accessKey"];
                    let transactionCategory = operatorsData["pipedGas"]["category"];
                    const type = operatorsData["pipedGas"]["type"];
                    const pipedGasHandler = commonBillHandler(accessKey, transactionCategory, type);
                    await pipedGasHandler.payment(req, res, next);
                    break;
                }
                case operatorsData["water"]["accessKey"]: {
                    let accessKey = operatorsData["water"]["accessKey"];
                    let transactionCategory = operatorsData["water"]["category"];
                    const type = operatorsData["water"]["type"];
                    const waterHandler = commonBillHandler(accessKey, transactionCategory, type);
                    await waterHandler.payment(req, res, next);
                    break;
                }
                case operatorsData["landline"]["accessKey"]: {
                    let accessKey = operatorsData["landline"]["accessKey"];
                    let transactionCategory = operatorsData["landline"]["category"];
                    const type = operatorsData["landline"]["type"];
                    const landlineHandler = commonBillHandler(accessKey, transactionCategory, type);
                    await landlineHandler.payment(req, res, next);
                    break;
                }
                case operatorsData["creditCard"]["accessKey"]: {
                    let accessKey = operatorsData["creditCard"]["accessKey"];
                    let transactionCategory = operatorsData["creditCard"]["category"];
                    const type = operatorsData["creditCard"]["type"];
                    const creditCardHandler = commonBillHandler(accessKey, transactionCategory, type);
                    await creditCardHandler.payment(req, res, next);
                    break;
                }
                case operatorsData["xoxoday"]["accessKey"]:
                    await giftcards.payment(req, res, next);
                    break;
                default:
                    await paymentGatewayOrders.update({ status: 'FAILED' }, { where: { paymentRefId } });
                    return next(new ErrorResponse('This service is not supported via CCAvenue', 400));
            }
            // Service handler has sent the response — mark as complete for idempotency on any retry
            await paymentGatewayOrders.update({ status: 'COMPLETE' }, { where: { paymentRefId } });
        } catch (paymentError) {
            customLog(req?.LogTraceId, 'error', {
                message: 'CCAvenue completePayment: service dispatch error',
                error: paymentError?.message ?? paymentError,
                paymentRefId,
                operator,
            });
            await paymentGatewayOrders.update({ status: 'FAILED' }, { where: { paymentRefId } });
            return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 501));
        }
    } catch (error) {
        customLog(req?.LogTraceId, 'error', {
            message: 'CCAvenue completePayment error',
            error: error?.message ?? error,
            orderId,
        });
        await paymentGatewayOrders.update(
            {
                referenceNo: req.body.TXNID,
                status: "FAILED",
            },
            { where: { paymentRefId: orderId } }
        );
        return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 501));
    }
};

