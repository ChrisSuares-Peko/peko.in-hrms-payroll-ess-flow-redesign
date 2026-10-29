const { createNotification } = require('../../models/use-cases/notification');
const { paymentGateWayRefundFailureEmail } = require('../../utils/emailSender');
const emailer = require('../../utils/emailer');
const { refundCashfreeDirect } = require('../../utils/cashfreeGateway');
const asyncHandler = require('../../middlewares/async');
const { formatNumberWithLocalString } = require('../../utils/formatter');
const {
    fetchServiceDetails,
    calculateSurcharge,
    calculateAmountWithTax,
} = require('../../utils/checkAndFetchServiceDetails');
const { partnerLogos } = require('../../utils/partnerLogos');
const {
    findPosPurchaseContext,
    createPosSubscription,
    markPosProvision,
} = require('../../utils/posSubscription');
const { createExpense } = require('./expense');
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { customLog } = require('../../utils/loggerHelper');
const { generateInvoiceAndReceipt } = require('../../services/invoiceAndReceipt');
const { generatePosPaymentSuccessEmail } = require('../../utils/emailTemplates/pos');
const {
    configFromVendor,
    createRestaurant,
    setRestaurantStatus,
} = require('../../utils/restonikGateway');

// Peko POS post-payment handler. One-time purchase: the grant row carries no
// Cashfree mandate id, so nothing ever auto-renews it.
//
// Every check and the vendor call run BEFORE any Peko row is written, so a
// failure at any point is a plain refund with nothing to unwind. Once the grant
// is committed the purchase is final: the steps after it can only be logged,
// never fail the purchase. User-facing messages stay generic; detail goes to
// customLog.

const accessKey = 'peko_pos';
const SERVICE_LABEL = 'Peko POS';

const resolvePgResponse = paymentGatewayResponse =>
    Array.isArray(paymentGatewayResponse)
        ? paymentGatewayResponse.find(p => p?.payment_status === 'SUCCESS') || paymentGatewayResponse[0]
        : paymentGatewayResponse;

exports.payment = asyncHandler(async (req, res) => {
    const traceId = req?.LogTraceId;
    const corporateId = req.user.corporateId;
    const credentialId = req.user.id;
    const emailId = req.user.email;
    const subCorporateEmail = req.user.subCorporateEmail;
    const companyName = req.user.name;
    const corporateTxnId = req.body.paymentRefId || req.body.corporateTxnId || new Date().valueOf();
    const data = req.body;
    const pgAmount = req.body.pgAmount;
    const amount = req.body.amount;
    const basePackageId = req.user.packageId;
    const posPackageId = req.body.packageId;
    const hasPgResponse = Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse');
    const pgResponse = resolvePgResponse(req.body.paymentGatewayResponse);
    const corporateUserId = req.user.corporateId;

    const notifyFailure = briefMessage => {
        try {
            createNotification({
                notificationTitle: `${SERVICE_LABEL} Plan purchase Failed`,
                notificationBrief: briefMessage,
                notificationTo: [req.user.username],
                notificationCategory: 'CORPORATE',
                notificationBy: 'ADMIN',
                accessKey,
                action: '2',
            });
            const failTo = [emailId, subCorporateEmail].filter(Boolean);
            emailer.email(
                { to: failTo, subject: `${SERVICE_LABEL} Plan purchase Failed`, body: briefMessage },
                function () {}
            );
        } catch (notifyErr) {
            customLog(traceId, 'error', {
                message: 'Peko POS failure notification could not be sent',
                corporateTxnId,
                error: notifyErr?.message,
            });
        }
    };

    const refundAndFail = async ({ httpStatus = 500, userMessage, logMessage, logData = {} }) => {
        customLog(
            traceId,
            'error',
            { message: logMessage, corporateTxnId, credentialId, corporateId, posPackageId, ...logData },
            'VENDOR'
        );

        let refundLine = '';
        if (hasPgResponse) {
            const refund = await refundCashfreeDirect({
                req,
                corporateTxnId,
                reason: logMessage,
                serviceType: SERVICE_LABEL,
                logTraceId: traceId,
            });
            const refunded = Boolean(refund?.status);
            if (!refunded) {
                try {
                    await paymentGateWayRefundFailureEmail(req, SERVICE_LABEL, 'Subscription');
                } catch (emailErr) {
                    customLog(traceId, 'error', {
                        message: 'Peko POS refund-failure email could not be sent',
                        corporateTxnId,
                        error: emailErr?.message,
                    });
                }
            }
            refundLine = refunded
                ? ' Your payment has been refunded.'
                : ' Your payment will be refunded shortly.';
        }

        const message = `${userMessage}${refundLine}`;
        notifyFailure(message);
        return res.status(httpStatus).json({ status: false, message, data: {}, responseCode: '001' });
    };

    let granted = null;
    try {
        const partnerDetails = req?.user?.registeredBy
            ? await fetchPartnerDetails(req.user.registeredBy)
            : await partnerLogos();

        const serviceDetails = await fetchServiceDetails({
            credentialId,
            accessKey,
            packageId: basePackageId,
            corporateUserId,
        });
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return await refundAndFail({
                userMessage: 'The POS service is currently unavailable.',
                logMessage: 'Peko POS service details unavailable',
                logData: { error: serviceDetails.error, basePackageId },
            });
        }
        const serviceOperatorId = serviceDetails.id;

        const vendorConfig = configFromVendor(serviceDetails.vendor, serviceOperatorId);
        if (vendorConfig.error) {
            return await refundAndFail({
                userMessage: 'The POS service is currently unavailable.',
                logMessage: 'Peko POS vendor configuration missing',
                logData: { error: vendorConfig.error },
            });
        }

        const surchargeWithoutTax = calculateSurcharge(
            serviceDetails.surcharge,
            serviceDetails.surchargeType,
            amount
        );
        const surcharge = await calculateAmountWithTax(surchargeWithoutTax);

        serviceDetails.providerCommission = 0;
        serviceDetails.fixedCommissionPerTransaction = 0;
        serviceDetails.isCommissionInclVAT = true;
        serviceDetails.commissionType = 'PERCENTAGE';
        serviceDetails.transactionReportRule = 'SERVICE_WITH_INVOICE_AND_SURCHARGE';

        const reportData = {};

        const context = await findPosPurchaseContext({
            credentialId,
            packageId: posPackageId,
            subscriptionDuration: data.subscriptionDuration,
            corporateTxnId,
        });

        if (context.alreadyProcessed) {
            customLog(traceId, 'info', {
                message: 'Peko POS payment already processed; nothing to do',
                corporateTxnId,
                subscriptionId: context.alreadyProcessed.id,
            });
            return res.status(200).json({
                status: true,
                data: { subscription: context.alreadyProcessed, corporateTxnId },
                message: 'payment successfull',
                responseCode: '000',
            });
        }

        if (!context.packageDetails) {
            return await refundAndFail({
                userMessage: 'The selected plan is no longer available.',
                logMessage: 'Peko POS package not found',
            });
        }

        const planId = String(context.packageDetails.externalId || '').trim();
        if (!planId) {
            return await refundAndFail({
                userMessage: 'The selected plan is not available right now.',
                logMessage: 'Peko POS package has no vendor plan id (externalId)',
                logData: { packageName: context.packageDetails.packageName },
            });
        }

        if (context.existingSubscription) {
            return await refundAndFail({
                httpStatus: 400,
                userMessage: 'This plan is already active on your account.',
                logMessage: 'Peko POS duplicate purchase of an active plan',
                logData: {
                    existingSubscriptionId: context.existingSubscription.id,
                    billingType: context.billingType,
                },
            });
        }

        // Both ids sent to Restonik are the credential id: `externalId` keeps one
        // restaurant per account across repurchases, and `owner.externalUserId` is
        // what our IdP signs as `sub`, which is what makes Open Store Admin SSO
        // resolve to this user. `planId` is the package's externalId.
        let restaurant;
        try {
            restaurant = await createRestaurant(
                vendorConfig,
                {
                    externalId: String(credentialId),
                    name: companyName,
                    email: emailId,
                    ...(req.user.mobileNo ? { phone: String(req.user.mobileNo) } : {}),
                    planId,
                    owner: {
                        externalUserId: String(credentialId),
                        name: req.user.contactPersonName || companyName,
                        email: emailId,
                    },
                },
                traceId
            );
        } catch (vendorErr) {
            return await refundAndFail({
                userMessage: 'We could not set up your restaurant with our POS partner.',
                logMessage: 'Restonik restaurant provisioning failed',
                logData: {
                    planId,
                    error: vendorErr?.message,
                    vendorStatus: vendorErr?.response?.status || null,
                    data: vendorErr?.response?.data,
                },
            });
        }

        const vendorPlanId = restaurant.raw?.plan?.id ? String(restaurant.raw.plan.id) : null;
        const planMismatch = !restaurant.created && Boolean(vendorPlanId) && vendorPlanId !== planId;
        if (planMismatch) {
            customLog(
                traceId,
                'error',
                {
                    message: 'Restonik restaurant already exists on a different plan; POST does not change it',
                    restaurantId: restaurant.id,
                    sentPlanId: planId,
                    vendorPlanId,
                    corporateTxnId,
                },
                'VENDOR'
            );
        }

        const transactionResponse = await createPosSubscription({
            ...data,
            corporateId,
            credentialId,
            corporateTxnId,
            serviceOperatorId,
            reportData,
            partnerId: req.user.registeredBy,
            couponCode: req.body.couponCode,
        });

        if (!transactionResponse || transactionResponse.error) {
            let suspended = false;
            if (restaurant.created && restaurant.id) {
                try {
                    await setRestaurantStatus(vendorConfig, restaurant.id, 'suspended', traceId);
                    suspended = true;
                } catch (suspendErr) {
                    customLog(
                        traceId,
                        'error',
                        {
                            message: 'Could not suspend the restaurant created for a failed purchase',
                            restaurantId: restaurant.id,
                            corporateTxnId,
                            error: suspendErr?.message,
                        },
                        'VENDOR'
                    );
                }
            }
            return await refundAndFail({
                userMessage: 'We could not complete your purchase.',
                logMessage: 'Peko POS subscription creation failed',
                logData: {
                    reason: transactionResponse?.message,
                    restaurantId: restaurant.id,
                    restaurantCreatedNow: restaurant.created,
                    suspended,
                },
            });
        }

        const { subscription, packageDetails: createdPackageDetails } = transactionResponse;
        granted = {
            subscription,
            restaurant: { id: restaurant.id, status: restaurant.status },
            corporateTxnId,
        };

        await markPosProvision(subscription?.id, {
            restaurantId: restaurant.id,
            restaurantStatus: restaurant.status,
            externalId: String(credentialId),
            externalUserId: String(credentialId),
            planId,
            vendorPlanId,
            planMismatch,
            created: restaurant.created,
            provisionedAt: new Date().toISOString(),
            vendor: restaurant.raw,
        });

        const paidAmount = (parseFloat(amount) + parseFloat(surcharge)).toFixed(2);

        try {
            createExpense(
                { credentialId, packageId: basePackageId, corporateUserId },
                {
                    accounts_id: null,
                    amount: paidAmount,
                    payment_method: transactionResponse?.paymentMode,
                    credentialId: req.user.id,
                    category: serviceDetails?.serviceCategory,
                    merchant: serviceDetails?.vendor?.vendorName,
                }
            );
        } catch (expenseErr) {
            customLog(traceId, 'error', {
                message: 'Peko POS expense record failed',
                corporateTxnId,
                error: expenseErr?.message,
            });
        }

        let receiptPdf = null;
        let invoicePdf = null;
        try {
            ({ receiptPdf, invoicePdf } = await generateInvoiceAndReceipt({
                amount,
                surcharge,
                corporateTxnId,
                orderId: transactionResponse?.orderId,
                paymentType: SERVICE_LABEL,
                couponCode: req.body.couponCode,
                packageId: posPackageId,
                corporateUserId,
                credentialId,
                serviceOperatorId,
                registeredBy: req?.user?.registeredBy,
                accessKey,
                pgAmount: req.body.pgAmount,
                paymentMethod: pgResponse?.payment_method,
            }));
        } catch (invoiceErr) {
            customLog(traceId, 'error', {
                message: 'Peko POS invoice/receipt generation failed',
                corporateTxnId,
                error: invoiceErr?.message,
            });
        }

        try {
            const to = [emailId, subCorporateEmail].filter(Boolean);
            emailer.emailWithMultipleAttachment(
                to,
                `${createdPackageDetails.packageName} Plan Purchase Confirmation`,
                generatePosPaymentSuccessEmail(
                    companyName,
                    corporateTxnId,
                    pgAmount,
                    createdPackageDetails.packageName,
                    partnerDetails
                ),
                [receiptPdf, invoicePdf].filter(Boolean),
                undefined,
                async emailErr => {
                    if (emailErr) {
                        customLog(traceId, 'error', { message: 'Error sending email', emailErr });
                    } else {
                        customLog(traceId, 'info', { message: 'Email sent to ' + to });
                    }
                }
            );
        } catch (emailErr) {
            customLog(traceId, 'error', {
                message: 'Peko POS confirmation email failed',
                corporateTxnId,
                error: emailErr?.message,
            });
        }

        try {
            createNotification({
                notificationTitle: 'Purchase Successful ',
                notificationBrief: `We are pleased to inform you that your ${SERVICE_LABEL} ${
                    createdPackageDetails.packageName
                } plan purchase has been successful with the payment of ₹ ${formatNumberWithLocalString(
                    pgAmount
                )}. Your service is now active.`,
                notificationTo: [req.user.username],
                notificationCategory: 'CORPORATE',
                notificationBy: 'ADMIN',
                accessKey,
                action: '2',
            });
        } catch (notifyErr) {
            customLog(traceId, 'error', {
                message: 'Peko POS success notification failed',
                corporateTxnId,
                error: notifyErr?.message,
            });
        }

        return res.status(200).json({
            status: true,
            data: granted,
            message: 'payment successfull',
            responseCode: '000',
        });
    } catch (err) {
        if (granted) {
            customLog(traceId, 'error', {
                message: 'Peko POS purchase completed but a later step threw',
                corporateTxnId,
                subscriptionId: granted.subscription?.id,
                error: err?.message,
                stack: err?.stack,
            });
            return res.status(200).json({
                status: true,
                data: granted,
                message: 'payment successfull',
                responseCode: '000',
            });
        }
        return await refundAndFail({
            userMessage: 'We could not complete your purchase.',
            logMessage: 'Peko POS payment handler failed unexpectedly',
            logData: { error: err?.message, stack: err?.stack },
        });
    }
});
