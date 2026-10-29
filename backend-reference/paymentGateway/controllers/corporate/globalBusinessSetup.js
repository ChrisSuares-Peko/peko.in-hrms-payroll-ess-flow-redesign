// Payment Gateway controller for Global Business Setup (Base93-backed company
// incorporation abroad). Mirrors AE `gateway/controllers/corporate/pekoStart.js`
// in *structure* but rewrites against IN payment patterns:
//   - PG vendors:  Razorpay (utils/dapiTransaction) + Cashfree (utils/cashfreeGateway)
//   - accessKey:   sourced from utils/operatorsData.json (no hardcoded strings)
//   - Surcharge:   utils/checkAndFetchServiceDetails.calculateSurchargeWithTax (GST-aware)
//   - Vendor call: axios directly to Base93 (same as AE)
//   - Post-paid:   Google Pub/Sub event → officeAndBusiness flips is_paid on Mongo cache
//   - Receipt:     services/invoiceAndReceipt.generateOrderInvoiceAttachments (invoice + receipt)
//   - Currency:    INR-only
//
// Exports:
//   - payment        : single-payment flow (creates Base93 application, full amount)
//   - renewalApprove : renewal payment + approval

const axios = require('axios');
const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const { fetchServiceDetails, calculateSurchargeWithTax } = require('../../utils/checkAndFetchServiceDetails');
const { createNotification } = require('../../models/use-cases/notification');
const { createWalletTransaction, updateWalletTransaction, refundWalletTransaction } = require('../../utils/walletTransaction');
const { createPGTransaction } = require('../../utils/paymentGatewayTransaction');
const { cancelPGTransaction } = require('../../utils/pgRefund');
const emailer = require('../../utils/emailer');
const operatorsData = require('../../utils/operatorsData.json');
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { customLog } = require('../../utils/loggerHelper');
const { computeJournalData } = require('../../utils/computeJournalData');
const { publishJournalEvent } = require('../../utils/bull/queue/accountingEventsQueue');
const { generateOrderInvoiceAttachments } = require('../../services/invoiceAndReceipt');
const { publishPaymentPaid, publishRenewalApproved } = require('../../utils/pubsub/globalBusinessSetup');
const { createSubscription } = require('../../utils/subscription');
const { hasPurchasedGlobalBusinessSetup, hasActivePekoPlus, findTopTierGroupPackage } = require('../../models/use-cases/subscription');

const accessKey = operatorsData['globalBusinessSetup']['accessKey'];
const transactionCategory = operatorsData['globalBusinessSetup']['category'];

// ── Shared helpers ──────────────────────────────────────────────────────────

async function resolvePartnerDetails(req) {
    if (req?.user?.registeredBy) {
        return fetchPartnerDetails(req.user.registeredBy);
    }
    return fetchPartnerDetails();
}

async function dispatchTransaction(req, params, amount) {
    if (Object.prototype.hasOwnProperty.call(req.body, 'razorPay')) {
        const { createRazorPayTransaction } = require('../../utils/dapiTransaction');
        return createRazorPayTransaction({
            ...params,
            razorPayAmount: req.body.razorPayAmount,
            razorPayResponse: req.body.razorPay,
        });
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
        return createPGTransaction({
            ...params,
            pgAmount: req.body.pgAmount,
            pgResponse: req.body.paymentGatewayResponse,
            couponCode: req.body.couponCode,
            corporateUserId: req.user.corporateId,
            partnerId: req.user.registeredBy,
        });
    }
    return createWalletTransaction({ ...params, amount });
}

async function refundOnFailure(req, corporateTxnId, providerId, reason, traceId, reportData, vendor) {
    try {
        if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
            await cancelPGTransaction(corporateTxnId);
        }
        await refundWalletTransaction({
            corporateTxnId,
            providerId,
            status: 'REFUNDED',
            message: reason,
            orderResponse: JSON.stringify({ reason }),
        });
        publishJournalEvent(
            {
                transactionRef: corporateTxnId,
                type: 'refund',
                contextSnapshot: {
                    credentialId: req?.user?.id,
                    vendor: vendor || null,
                    registeredBy: req?.user?.registeredBy || null,
                },
                reportData,
            },
            traceId
        );
    } catch (refundErr) {
        customLog(traceId, 'error', { message: 'Refund failed', corporateTxnId, err: refundErr.message });
    }
}

// PG-initiated payments carry a failureUrl; redirect the browser there on
// failure instead of returning a JSON error (mobile + wallet flows still get
// the JSON error). Mirrors AE `failPaymentCallback`.
function failPaymentCallback(req, res, next, { message, statusCode = 500, corporateTxnId } = {}) {
    const body = req.body || {};
    const isMobile = req.headers['platform'] === 'mobile';
    if (
        Object.prototype.hasOwnProperty.call(body, 'paymentGatewayResponse') &&
        !isMobile &&
        body.failureUrl
    ) {
        const txnId = corporateTxnId ?? body.corporateTxnId ?? '';
        return res.redirect(`${body.failureUrl}?status="failure"&transactionId=${txnId}`);
    }
    return next(new ErrorResponse(message, statusCode));
}

// ── Single payment (full amount) ────────────────────────────────────────────
// Mirrors AE `pekoStartPayment`: trusts the FE-provided `totalAmount`, no
// pricing/percentage validation against Base93. The FE drives the quote total.

exports.payment = asyncHandler(async (req, res, next) => {
    const { applicationId, totalAmount, account, payCashback } = req.body;

    if (!applicationId || !totalAmount) {
        return next(new ErrorResponse('applicationId and totalAmount are required', 400));
    }

    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = req.user.packageId;
    const corporateTxnId = req.body.corporateTxnId || new Date().valueOf();

    const partnerDetails = await resolvePartnerDetails(req);

    const serviceDetails = await fetchServiceDetails({
        credentialId, accessKey, packageId, corporateUserId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return failPaymentCallback(req, res, next, { message: 'Apologies, the service you are trying to access is currently unavailable.', corporateTxnId });
    }

    const apiUrl = serviceDetails.vendor?.apiUrl ? serviceDetails.vendor.apiUrl + '/api/v1/user/external/agent' : undefined;
    const apiKey = serviceDetails.vendor?.optional1;
    if (!apiUrl || !apiKey) {
        return failPaymentCallback(req, res, next, { message: 'Vendor service unavailable.', statusCode: 503, corporateTxnId });
    }

    const { commissionType, cashbackType, providerCommission, cashback: corporateCashback, id: serviceOperatorId } = serviceDetails;

    const numericAmount = parseFloat(totalAmount);
    const surchargeDetails = await calculateSurchargeWithTax(serviceDetails.surcharge, serviceDetails.surchargeType, numericAmount, credentialId);
    const surcharge = surchargeDetails.surcharge;

    let subCorporateUserId;
    if (req.user.role === 'CORPORATE_SUB_USER') {
        subCorporateUserId = req.user.subCorporateId;
    }

    const pgResponse = Array.isArray(req.body?.paymentGatewayResponse) ? req.body.paymentGatewayResponse[0] : req.body?.paymentGatewayResponse;
    const reportData = await computeJournalData({
        serviceDetails,
        pgAmount: req.body.paymentGatewayResponse ? Number(req.body.pgAmount || 0) : 0,
        amount: numericAmount,
        paymentMethod: pgResponse?.payment_method || {},
        partnerDetails,
        paymentGatewayName: 'Cashfree',
        couponTotalDiscount: req.body.couponTotalDiscount,
        corporateState: req.user.state || '',
        credentialId,
    });

    const txnParams = {
        providerId: applicationId,
        corporateTxnId,
        credentialId,
        serviceOperatorId,
        corporateCashback,
        accountNo: account || applicationId,
        transactionCategory,
        orderAmount: totalAmount,
        commissionType,
        cashbackType,
        providerCommission,
        payCashback,
        surcharge,
        subCorporateUserId,
        reportData
    };

    const transactionResponse = await dispatchTransaction(req, txnParams, numericAmount);
    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
        return failPaymentCallback(req, res, next, { message: transactionResponse['error'], statusCode: 402, corporateTxnId });
    }

    publishJournalEvent(
        {
            transactionRef: corporateTxnId,
            type: 'payment',
            contextSnapshot: {
                credentialId,
                vendor: serviceDetails?.vendor || null,
                registeredBy: req?.user?.registeredBy || null,
            },
            reportData,
        },
        req?.LogTraceId
    );

    // --- Mark the existing Base93 application as paid ---
    // App was already created at Base93 during form submission. Here we just
    // notify Base93 that payment has cleared. Mirrors AE pekoStartPayment.

    let vendorResponse;
    try {
        const response = await axios({
            method: 'post',
            url: `${apiUrl}/companies/${applicationId}/create-payment`,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            data: {},
        });
        vendorResponse = response.data;
        customLog(req?.LogTraceId, 'info', { message: 'Base93 payment marked', vendorResponse });
    } catch (vendorErr) {
        customLog(req?.LogTraceId, 'error', {
            message: 'Base93 create-payment failed — refunding',
            error: vendorErr.message,
            data: vendorErr?.response?.data,
        });
        await refundOnFailure(req, corporateTxnId, applicationId, 'Vendor payment confirmation failed', req?.LogTraceId, reportData, serviceDetails?.vendor);
        return failPaymentCallback(req, res, next, { message: 'Payment confirmation failed. Your payment has been refunded.', corporateTxnId });
    }

    await updateWalletTransaction({
        corporateTxnId,
        providerId: applicationId,
        status: 'SUCCESS',
        message: 'Payment Successful',
        orderResponse: JSON.stringify({
            paymentStatus: 'COMPLETED',
            applicationId,
        }),
    });

    // --- Publish Pub/Sub event so officeAndBusiness can flip is_paid on cache ---

    await publishPaymentPaid({
        vendor_app_id: applicationId,
        reference_id: req.user?.username,
        user_id: req.user?.id,
    }, req?.LogTraceId);

    // --- Email + notification + receipt ---

    const paidAmount = (numericAmount + surcharge - (transactionResponse.couponDiscount || 0)).toFixed(2);
    const to = req.user.email;
    const cc = req.body.subCorporateEmail || undefined;

    try {
        const invoiceAttachments = await generateOrderInvoiceAttachments({
            amount: numericAmount,
            surcharge,
            couponDiscount: transactionResponse.couponDiscount ?? 0,
            corporateTxnId,
            orderId: transactionResponse.orderId,
            paymentType: 'Global Business Setup',
            description: 'Global Business Setup — company incorporation abroad',
            credentialId,
            pgAmount: Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse') ? req.body.pgAmount : null,
            paymentMethod: pgResponse?.payment_method,
            vendor: serviceDetails?.vendor,
            commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
            commissionMode: reportData?.journalData?.commissionMode || 'MARGIN',
            traceId: req?.LogTraceId,
        });
        emailer.emailWithMultipleAttachment(
            to,
            `Your Payment for ${partnerDetails?.branding || 'Peko'} Global Business Setup was successful`,
            `<p>Hi ${req.user.name},</p><p>Payment of ₹${paidAmount} was successful. Your application has now moved to registration.</p>`,
            invoiceAttachments,
            cc,
            (emailErr) => {
                if (emailErr) customLog(req?.LogTraceId, 'error', { message: 'Failed to send payment email', emailErr });
            },
        );
    } catch (emailErr) {
        customLog(req?.LogTraceId, 'error', { message: 'Invoice/receipt/email generation failed', err: emailErr.message });
    }

    createNotification({
        notificationTitle: 'Global Business Setup - Payment successful',
        notificationBrief: `Payment of ₹${paidAmount} was successful. Your application has now moved to registration.`,
        notificationTo: [req.user.username],
        notificationCategory: 'CORPORATE',
        notificationBy: 'ADMIN',
        accessKey,
        action: '1',
    }, credentialId);

    return res.status(200).json({
        status: true,
        message: 'Payment successful',
        data: {
            ...transactionResponse,
            corporateTxnId,
            applicationId,
        },
        responseCode: '000',
    });
});

// ── Renewal payment + approval ──────────────────────────────────────────────

exports.renewalApprove = asyncHandler(async (req, res, next) => {
    const { renewalId, totalAmount, payCashback, account } = req.body;

    if (!renewalId || !totalAmount) {
        return next(new ErrorResponse('renewalId and totalAmount are required', 400));
    }

    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = req.user.packageId;
    const corporateTxnId = req.body.corporateTxnId || new Date().valueOf();

    const partnerDetails = await resolvePartnerDetails(req);

    const serviceDetails = await fetchServiceDetails({
        credentialId, accessKey, packageId, corporateUserId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return failPaymentCallback(req, res, next, { message: 'Apologies, the service you are trying to access is currently unavailable.', corporateTxnId });
    }

    const apiUrl = serviceDetails.vendor?.apiUrl ? serviceDetails.vendor.apiUrl + '/api/v1/user/external/agent' : undefined;
    const apiKey = serviceDetails.vendor?.optional1;

    const { commissionType, cashbackType, providerCommission, cashback: corporateCashback, id: serviceOperatorId } = serviceDetails;

    const numericAmount = parseFloat(totalAmount);
    const surchargeDetails = await calculateSurchargeWithTax(serviceDetails.surcharge, serviceDetails.surchargeType, numericAmount, credentialId);
    const surcharge = surchargeDetails.surcharge;

    let subCorporateUserId;
    if (req.user.role === 'CORPORATE_SUB_USER') {
        subCorporateUserId = req.user.subCorporateId;
    }
    
    const pgResponse = Array.isArray(req.body?.paymentGatewayResponse) ? req.body.paymentGatewayResponse[0] : req.body?.paymentGatewayResponse;
    const reportData = await computeJournalData({
        serviceDetails,
        pgAmount: req.body.paymentGatewayResponse ? Number(req.body.pgAmount || 0) : 0,
        amount: numericAmount,
        paymentMethod: pgResponse?.payment_method || {},
        partnerDetails,
        paymentGatewayName: 'Cashfree',
        couponTotalDiscount: req.body.couponTotalDiscount,
        corporateState: req.user.state || '',
        credentialId,
    });

    const txnParams = {
        providerId: renewalId,
        corporateTxnId,
        credentialId,
        serviceOperatorId,
        corporateCashback,
        accountNo: account || renewalId,
        transactionCategory,
        orderAmount: totalAmount,
        commissionType,
        cashbackType,
        providerCommission,
        payCashback,
        surcharge,
        subCorporateUserId,
        reportData
    };

    const transactionResponse = await dispatchTransaction(req, txnParams, numericAmount);
    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
        return failPaymentCallback(req, res, next, { message: transactionResponse['error'], statusCode: 402, corporateTxnId });
    }

    publishJournalEvent(
        {
            transactionRef: corporateTxnId,
            type: 'payment',
            contextSnapshot: {
                credentialId,
                vendor: serviceDetails?.vendor || null,
                registeredBy: req?.user?.registeredBy || null,
            },
            reportData,
        },
        req?.LogTraceId
    );

    // Notify Base93 to approve the renewal
    try {
        await axios({
            method: 'post',
            url: `${apiUrl}/renewals/${renewalId}/approve-quote`,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            data: {},
        });
    } catch (vendorErr) {
        customLog(req?.LogTraceId, 'error', {
            message: 'Base93 renewal approve failed — refunding',
            renewalId,
            error: vendorErr.message,
            data: vendorErr?.response?.data,
        });
        await refundOnFailure(req, corporateTxnId, renewalId, 'Renewal approval failed at vendor', req?.LogTraceId, reportData, serviceDetails?.vendor);
        return failPaymentCallback(req, res, next, { message: 'Renewal approval failed. Your payment has been refunded.', corporateTxnId });
    }

    await updateWalletTransaction({
        corporateTxnId,
        providerId: renewalId,
        status: 'SUCCESS',
        message: 'Payment Successful',
        orderResponse: JSON.stringify({ renewalId }),
    });

    await publishRenewalApproved({
        vendor_renewal_id: renewalId,
        reference_id: req.user?.username,
        user_id: req.user?.id,
    }, req?.LogTraceId);

    const paidAmount = (numericAmount + surcharge - (transactionResponse.couponDiscount || 0)).toFixed(2);
    const to = req.user.email;
    const cc = req.body.subCorporateEmail || undefined;

    try {
        const invoiceAttachments = await generateOrderInvoiceAttachments({
            amount: numericAmount,
            surcharge,
            couponDiscount: transactionResponse.couponDiscount ?? 0,
            corporateTxnId,
            orderId: transactionResponse.orderId,
            paymentType: 'Global Business Setup',
            description: 'Global Business Setup — renewal',
            credentialId,
            pgAmount: Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse') ? req.body.pgAmount : null,
            paymentMethod: pgResponse?.payment_method,
            vendor: serviceDetails?.vendor,
            commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
            commissionMode: reportData?.journalData?.commissionMode || 'MARGIN',
            traceId: req?.LogTraceId,
        });
        emailer.emailWithMultipleAttachment(
            to,
            'Global Business Setup - Renewal Payment Successful',
            `<p>Hi ${req.user.name},</p><p>Renewal payment of ₹${paidAmount} received.</p>`,
            invoiceAttachments,
            cc,
            (emailErr) => {
                if (emailErr) customLog(req?.LogTraceId, 'error', { message: 'Failed to send renewal email', emailErr });
            },
        );
    } catch (emailErr) {
        customLog(req?.LogTraceId, 'error', { message: 'Receipt/email generation failed', err: emailErr.message });
    }

    createNotification({
        notificationTitle: 'Renewal Payment Successful',
        notificationBrief: `Renewal payment of ₹${paidAmount} received.`,
        notificationTo: [req.user.username],
        notificationCategory: 'CORPORATE',
        notificationBy: 'ADMIN',
        accessKey,
        action: '1',
    }, credentialId);

    return res.status(200).json({
        status: true,
        message: 'Renewal payment completed successfully.',
        data: { ...transactionResponse, corporateTxnId, renewalId },
        responseCode: '000',
    });
});

// ── Complimentary Peko Plus activation ──────────────────────────────────────
// A completed GBS payment entitles the user to a free 1-year top-tier group
// package. The backend picks the package (highest priorityLevel for the
// user's partner); any planId sent by the FE is ignored.

exports.activatePekoPlusSubscription = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = req.user.packageId;

    const serviceDetails = await fetchServiceDetails({
        credentialId, accessKey, packageId, corporateUserId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 500));
    }

    const gbsOrder = await hasPurchasedGlobalBusinessSetup({
        credentialId,
        serviceOperatorId: serviceDetails.id,
    });
    if (!gbsOrder) {
        return next(new ErrorResponse('Peko+ can be activated only after your Global Business Setup application payment is completed', 403));
    }

    const topTierPackage = await findTopTierGroupPackage({
        partnerId: req?.user?.registeredBy,
    });
    if (!topTierPackage?.id) {
        return next(new ErrorResponse('No Peko Plus package configured', 500));
    }

    const existingPekoPlus = await hasActivePekoPlus({
        corporateUserId,
        planId: topTierPackage.id,
    });
    if (existingPekoPlus) {
        return next(new ErrorResponse('Peko Plus subscription already active', 409));
    }

    const corporateTxnId = new Date().valueOf();
    const subscriptionResponse = await createSubscription({
        packageId: topTierPackage.id,
        pgAmount: 0,
        corporateId: corporateUserId,
        corporateTxnId,
        providerId: corporateTxnId,
        billingType: 'ANNUALLY',
        credentialId,
        partnerId: req?.user?.registeredBy,
        authPayment: true,
        isComplimentary: true,
    }, req?.LogTraceId);
    if (subscriptionResponse?.error) {
        return next(new ErrorResponse(subscriptionResponse.message || 'Failed to activate Peko Plus', 500));
    }

    const { currentSubscription, packageDetails } = subscriptionResponse;
    const previousPackageName = currentSubscription?.package?.packageName;
    createNotification({
        notificationTitle: 'Upgrade Successful',
        notificationBrief: previousPackageName
            ? `Thank you for upgrading your plan from ${previousPackageName} to ${packageDetails?.packageName}. Your new plan features are now active.`
            : `Your ${packageDetails?.packageName} plan is now active - included with your Global Business Setup purchase.`,
        notificationTo: [req.user.username],
        notificationCategory: 'CORPORATE',
        notificationBy: 'ADMIN',
        accessKey: null,
        action: '2',
    }, credentialId);

    return res.status(200).json({
        status: true,
        message: 'Peko Plus subscription activated successfully',
        data: {
            subscriptionId: subscriptionResponse.subscription?.id,
            package: packageDetails,
        },
        responseCode: '001',
    });
});
