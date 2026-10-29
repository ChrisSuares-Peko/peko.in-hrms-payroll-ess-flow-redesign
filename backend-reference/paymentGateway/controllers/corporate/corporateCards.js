const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const { fetchServiceDetails } = require('../../utils/checkAndFetchServiceDetails');
const { createNotification } = require('../../models/use-cases/notification');
const { createWalletTransaction, updateWalletTransaction } = require('../../utils/walletTransaction');
const { createPGTransaction } = require('../../utils/paymentGatewayTransaction');
const emailer = require('../../utils/emailer');
const operatorsData = require('../../utils/operatorsData.json');
const { customLog } = require('../../utils/loggerHelper');
const { generateSubscriptionInvoiceAttachments } = require('../../services/invoiceAndReceipt');
const { recordPhysicalCardPurchase } = require('../../utils/corporateCardsClient');
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { computeJournalData } = require('../../utils/computeJournalData');
const { publishJournalEvent } = require('../../utils/bull/queue/accountingEventsQueue');
const { calculatePhysicalCardPrice } = require('../../utils/physicalCardPricing');

const accessKey = operatorsData['corporateCards']['accessKey'];
const transactionCategory = operatorsData['corporateCards']['category'];

const money = (value) => Number(value || 0).toFixed(2);
const normalize = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

exports.payment = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = req.user.packageId;
    const { corporateTxnId, quantity: rawQuantity, cardIssuanceId, cardRequestId, shipping } = req.body;

    const quantity = Number.isInteger(Number(rawQuantity)) && Number(rawQuantity) > 0 ? Number(rawQuantity) : 1;

    const serviceDetails = await fetchServiceDetails({ credentialId, accessKey, packageId, corporateUserId });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 400));
    }

    const pricing = await calculatePhysicalCardPrice({ serviceDetails, quantity });
    if (pricing.error) {
        customLog(req?.LogTraceId, 'error', {
            message: '[CorporateCards] Refusing the payment — the plan has no physical card price',
            corporateUserId,
            unitPrice: serviceDetails.unitPrice,
        });
        return next(new ErrorResponse(pricing.error, 400));
    }

    // The confirming webhook replays this server-stored body, so the amount is immutable after this
    // point. validateAmount already checked it before the order; this guards a direct or replayed call.
    const { unitPrice, taxableAmount, taxAmount, taxRate, expectedPaymentAmount } = pricing;
    if (normalize(req.body.pgAmount) !== expectedPaymentAmount) {
        customLog(req?.LogTraceId, 'error', {
            message: '[CorporateCards] Physical card price validation failed',
            corporateUserId,
            submitted: req.body.pgAmount,
            expected: expectedPaymentAmount,
            unitPrice,
            quantity,
        });
        return next(new ErrorResponse('Amount mismatch', 400));
    }

    const { commissionType, cashbackType, providerCommission, cashback: corporateCashback, id: serviceOperatorId } = serviceDetails;

    const partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);
    const pgResponse = Array.isArray(req.body?.paymentGatewayResponse)
        ? req.body.paymentGatewayResponse[0]
        : req.body?.paymentGatewayResponse;
    const reportData = await computeJournalData({
        serviceDetails,
        // Booked like a plan purchase: GST is carved out of the gross paid, so pgAmount is base + GST.
        pgAmount: Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse') ? expectedPaymentAmount : 0,
        amount: taxableAmount,
        paymentMethod: pgResponse?.payment_method || {},
        partnerDetails,
        paymentGatewayName: pgResponse?.paymentGatewayName || 'Cashfree',
        couponTotalDiscount: req.body.couponTotalDiscount,
        corporateState: req.user.state || '',
        isPhysicalCard: true,
        credentialId,
    });

    const txnParams = {
        providerId: String(cardIssuanceId ?? 'Not Available'),
        corporateTxnId,
        credentialId,
        serviceOperatorId,
        corporateCashback,
        accountNo: String(cardIssuanceId ?? corporateUserId),
        transactionCategory,
        orderAmount: taxableAmount,
        commissionType,
        cashbackType,
        providerCommission,
        surcharge: 0,
        subCorporateUserId: req.user.role === 'CORPORATE_SUB_USER' ? req.user.subCorporateId : undefined,
    };

    const transactionResponse = Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')
        ? await createPGTransaction({
            ...txnParams,
            pgAmount: expectedPaymentAmount,
            pgResponse: req.body.paymentGatewayResponse,
            couponCode: req.body.couponCode,
            corporateUserId,
            partnerId: req.user.registeredBy,
            reportData,
        })
        : await createWalletTransaction({ ...txnParams, amount: expectedPaymentAmount, reportData });

    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
        return next(new ErrorResponse(transactionResponse['error'], 402));
    }

    if (reportData) {
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
    }

    const allocation = await recordPhysicalCardPurchase({
        paymentRefId: String(corporateTxnId),
        corporateId: corporateUserId,
        quantity,
        unitPrice,
        amount: expectedPaymentAmount,
        purchasedByCredentialId: credentialId,
        subCorporateId: req.body.subCorporateId ?? null,
        sourceCardIssuanceId: cardIssuanceId ?? null,
        cardRequestId: cardRequestId ?? null,
        shipping: shipping ?? null,
    }, { logTraceId: req?.LogTraceId });

    const reportedLast4 = allocation.data?.cardLast4;
    const cardLast4 = typeof reportedLast4 === 'string' && /^\d{4}$/.test(reportedLast4) ? reportedLast4 : null;

    await updateWalletTransaction({
        corporateTxnId,
        providerId: String(cardIssuanceId ?? 'Not Available'),
        status: 'SUCCESS',
        message: 'Payment Successful',
        orderResponse: JSON.stringify({
            quantity, unitPrice, taxableAmount, taxAmount, taxRate, allocated: allocation.ok, cardLast4,
        }),
    });

    const paidAmount = money(expectedPaymentAmount);
    const cardNoun = quantity === 1 ? 'physical card' : `${quantity} physical cards`;

    // Notification first and in its own try/catch: the Pusher push it fires is what tells the frontend the
    // purchase landed, and a PDF or SMTP failure must never suppress it.
    try {
        createNotification({
            notificationTitle: 'Corporate Cards - Payment successful',
            notificationBrief: cardLast4
                ? `Payment of ₹${paidAmount} (incl. GST) for a ${cardNoun} was successful. Your card ending ${cardLast4} has been ordered.`
                : `Payment of ₹${paidAmount} (incl. GST) for a ${cardNoun} was successful.`,
            notificationTo: [req.user.username],
            notificationCategory: 'CORPORATE',
            notificationBy: 'ADMIN',
            accessKey,
            action: '1',
        }, credentialId);
    } catch (notifyErr) {
        customLog(req?.LogTraceId, 'error', { message: '[CorporateCards] Notification failed', err: notifyErr?.message });
    }

    try {
        // Same GST invoice + receipt a plan purchase gets: the base and the GST are carved from the paid total,
        // and there is no platform fee.
        const invoiceAttachments = await generateSubscriptionInvoiceAttachments({
            amount: expectedPaymentAmount,
            couponDiscount: parseFloat(transactionResponse?.couponDiscount || 0),
            corporateTxnId,
            orderId: transactionResponse?.orderId,
            paymentType: transactionCategory,
            description: quantity === 1 ? 'Physical Card' : `Physical Cards (x${quantity})`,
            credentialId,
            pgAmount: Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse') ? expectedPaymentAmount : null,
            paymentMethod: pgResponse?.payment_method,
            traceId: req?.LogTraceId,
        });
        emailer.emailWithMultipleAttachment(
            req.user.email,
            'Your Corporate Cards payment was successful',
            `<p>Hi ${req.user.name},</p><p>Payment of ₹${paidAmount} (incl. GST) for a ${cardNoun} was successful.`
            + ` ${allocation.ok
                ? (cardLast4
                    ? `Your card ending ${cardLast4} has been ordered and will appear in Corporate Cards shortly.`
                    : 'Your card is being ordered and will appear in Corporate Cards shortly.')
                : 'The card will be available to order from your Corporate Cards dashboard.'}</p>`,
            invoiceAttachments,
            undefined,
            (emailErr) => {
                if (emailErr) customLog(req?.LogTraceId, 'error', { message: '[CorporateCards] Payment email failed', emailErr });
            },
        );
    } catch (emailErr) {
        customLog(req?.LogTraceId, 'error', { message: '[CorporateCards] Receipt/email generation failed', err: emailErr?.message });
    }

    return res.status(200).json({
        status: true,
        data: { ...transactionResponse, corporateTxnId, quantity, allocated: allocation.ok, cardLast4 },
        message: 'payment successfull',
        responseCode: '000',
    });
});

// Preview of what an extra physical card will cost — the same numbers validateAmount and payment enforce.
exports.getPhysicalCardPricing = asyncHandler(async (req, res, next) => {
    const serviceDetails = await fetchServiceDetails({
        credentialId: req.user.id,
        accessKey,
        packageId: req.user.packageId,
        corporateUserId: req.user.corporateId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 400));
    }

    const pricing = await calculatePhysicalCardPrice({ serviceDetails, quantity: req.query.quantity });
    if (pricing.error) return next(new ErrorResponse(pricing.error, 400));

    return res.status(200).json({
        status: true,
        message: 'Physical card pricing fetched successfully',
        data: pricing,
        responseCode: '000',
    });
});
