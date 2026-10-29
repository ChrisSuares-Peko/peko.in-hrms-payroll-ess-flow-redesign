const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const { fetchServiceDetails, calculateSurchargeWithTax } = require('../../utils/checkAndFetchServiceDetails');
const { createNotification } = require('../../models/use-cases/notification');
const { createWalletTransaction, updateWalletTransaction, refundWalletTransaction } = require('../../utils/walletTransaction');
const { createPGTransaction } = require('../../utils/paymentGatewayTransaction');
const { cancelPGTransaction } = require('../../utils/pgRefund');
const operatorsData = require('../../utils/operatorsData.json');
const { findApplicationById, markApplicationPaid } = require('../../models/use-cases/businessRegistration');
const { findByVendorKey } = require('../../models/use-cases/businessRegistrationCatalog');
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { customLog } = require('../../utils/loggerHelper');
const { computeJournalData } = require('../../utils/computeJournalData');
const { publishJournalEvent } = require('../../utils/bull/queue/accountingEventsQueue');
const { generateOrderInvoiceAttachments } = require('../../services/invoiceAndReceipt');

const accessKey = operatorsData['businessRegistration']['accessKey'];
const transactionCategory = operatorsData['businessRegistration']['category'];

// Business Registration payment fulfilment for the payment-gateway path (Cashfree
// PG callback + webhook). The wallet path is handled directly by the
// officeAndBusiness service; this mirrors it: records the transaction and marks
// the draft paid. The IndiaFilings vendor chain is NOT run here — it lives in
// officeAndBusiness and resumes when the user leaves the KYC step / at final
// submit, so it must not be duplicated into this microservice.
exports.payment = asyncHandler(async (req, res, next) => {
    const { applicationId, amount, payCashback } = req.body;
    if (!applicationId || !amount) {
        return next(new ErrorResponse('applicationId and amount are required', 400));
    }

    const application = await findApplicationById(applicationId);
    if (!application) return next(new ErrorResponse('Application not found', 404));
    // Idempotency: the PG callback and the webhook can both reach this handler for
    // the same order — if it's already paid, acknowledge success instead of
    // debiting again.
    if (application.paymentStatus === 'COMPLETED') {
        return res.status(200).json({
            status: true,
            message: 'Payment already processed successfully',
            data: { corporateTxnId: application.corporateTxnId, applicationId },
            responseCode: '000',
        });
    }

    const corporateTxnId = req.body.corporateTxnId || new Date().valueOf();
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = req.user.packageId;
    const isSubCorporateUser =
        req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId && req.user.subCorporateUsername;

    let partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);

    const serviceDetails = await fetchServiceDetails({ credentialId, accessKey, packageId, corporateUserId });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 500));
    }

    const { commissionType, cashbackType, providerCommission, cashback: corporateCashback, id: serviceOperatorId } =
        serviceDetails;

    const numericAmount = parseFloat(amount);
    const surchargeDetails = await calculateSurchargeWithTax(
        serviceDetails.surcharge,
        serviceDetails.surchargeType,
        numericAmount,
        credentialId
    );
    const surcharge = surchargeDetails.surcharge;

    let subCorporateUserId;
    if (req.user.role === 'CORPORATE_SUB_USER') {
        subCorporateUserId = req.user.subCorporateId;
    }

    const catalogRow = req.body.catalogId ? await findByVendorKey(req.body.catalogId, credentialId) : null;
    const journalPlanDetails = catalogRow ? [{
        name: catalogRow.serviceName || 'Business Registration',
        commissionMode: catalogRow.commissionMode,
        commissionType: catalogRow.commissionType,
        commission: catalogRow.commission,
        fixedCommissionPerTransaction: catalogRow.fixedCommissionPerTransaction,
        isCommissionInclGST: catalogRow.isCommissionInclGST,
        isCommissionConfigured: catalogRow.isCommissionConfigured,
        amount: catalogRow.amount != null ? Number(catalogRow.amount) : Number(catalogRow.vendorPrice) || 0,
    }] : [];

    const pgResponse = Array.isArray(req.body?.paymentGatewayResponse)
        ? req.body.paymentGatewayResponse[0]
        : req.body?.paymentGatewayResponse;
    const reportData = await computeJournalData({
        serviceDetails,
        pgAmount: req.body.paymentGatewayResponse ? Number(req.body.pgAmount || 0) : 0,
        amount: numericAmount,
        paymentMethod: pgResponse?.payment_method || {},
        partnerDetails,
        paymentGatewayName: pgResponse?.paymentGatewayName || 'Cashfree',
        couponTotalDiscount: req.body.couponTotalDiscount,
        planDetails: journalPlanDetails,
        corporateState: req.user.state || '',
        credentialId,
    });

    const commonParams = {
        providerId: applicationId,
        corporateTxnId,
        credentialId,
        serviceOperatorId,
        corporateCashback,
        accountNo: applicationId,
        transactionCategory,
        orderAmount: amount,
        commissionType,
        cashbackType,
        providerCommission,
        payCashback,
        surcharge,
        subCorporateUserId,
        reportData
    };

    let transactionResponse = {};
    if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
        transactionResponse = await createPGTransaction({
            ...commonParams,
            pgAmount: req.body.pgAmount,
            pgResponse: req.body.paymentGatewayResponse,
            couponCode: req.body.couponCode,
            corporateUserId,
            partnerId: req.user.registeredBy,
        });
    } else {
        transactionResponse = await createWalletTransaction({ ...commonParams, amount });
    }

    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
        return next(new ErrorResponse(transactionResponse['error'], 402));
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

    // Money is taken — mark the draft paid; refund if we can't record it.
    try {
        await markApplicationPaid(applicationId, {
            paymentStatus: 'COMPLETED',
            corporateTxnId: String(corporateTxnId),
            paidAt: new Date(),
        });
    } catch (err) {
        customLog(req?.LogTraceId, 'error', {
            message: '[brPayment] application update failed after debit — refunding',
            applicationId,
            err: err.message,
        });
        try {
            if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
                await cancelPGTransaction(corporateTxnId);
            }
            await refundWalletTransaction({
                corporateTxnId,
                providerId: applicationId,
                status: 'REFUNDED',
                message: 'Business Registration application update failed',
                orderResponse: JSON.stringify({ applicationId }),
            });
            publishJournalEvent(
                {
                    transactionRef: corporateTxnId,
                    type: 'refund',
                    contextSnapshot: {
                        credentialId,
                        vendor: serviceDetails?.vendor || null,
                        registeredBy: req?.user?.registeredBy || null,
                    },
                    reportData,
                },
                req?.LogTraceId
            );
        } catch (refundErr) {
            customLog(req?.LogTraceId, 'error', {
                message: 'Refund failed (BR update error)',
                corporateTxnId,
                err: refundErr.message,
            });
        }
        return next(new ErrorResponse('Payment could not be recorded — amount refunded', 500));
    }

    const paidAmount = (numericAmount + surcharge - (transactionResponse.couponDiscount || 0)).toFixed(2);

    await updateWalletTransaction({
        corporateTxnId,
        providerId: applicationId,
        status: 'SUCCESS',
        message: 'Payment Successful',
        orderResponse: JSON.stringify({ applicationId, entityType: application.entityType }),
    });

    createNotification({
        notificationTitle: 'Business Registration - Payment Successful',
        notificationBrief: `Payment of ₹${paidAmount} for application ${applicationId} was successful.`,
        notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
        notificationCategory: 'CORPORATE',
        notificationBy: 'ADMIN',
    });

    await generateOrderInvoiceAttachments({
        amount: numericAmount,
        surcharge,
        couponDiscount: transactionResponse.couponDiscount ?? 0,
        corporateTxnId,
        orderId: transactionResponse.orderId,
        paymentType: 'Business Registration',
        description: application.entityType,
        credentialId,
        pgAmount: Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse') ? req.body.pgAmount : null,
        paymentMethod: pgResponse?.payment_method,
        vendor: serviceDetails?.vendor,
        commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
        commissionMode: reportData?.journalData?.commissionMode || 'MARGIN',
        planDetails: journalPlanDetails,
        traceId: req?.LogTraceId,
    });

    customLog(req?.LogTraceId, 'info', {
        message: 'Business registration payment successful',
        applicationId,
        corporateTxnId,
    });

    return res.status(200).json({
        status: true,
        message: 'Payment completed successfully. Thank you!',
        data: { ...transactionResponse, corporateTxnId, applicationId },
        responseCode: '000',
    });
});
