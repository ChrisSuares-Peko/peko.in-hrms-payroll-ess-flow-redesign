const { fetchServiceDetails, calculateSurchargeWithTax } = require('../../utils/checkAndFetchServiceDetails');
const { createWalletTransaction, updateWalletTransaction, refundWalletTransaction } = require('../../utils/walletTransaction');
const { createPGTransaction } = require('../../utils/paymentGatewayTransaction');
const { cancelPGTransaction, refundCashfreeDirect } = require('../../utils/pgRefund');
const { customLog } = require('../../utils/loggerHelper');
const ErrorResponse = require('../../utils/error-response');
const asyncHandler = require('../../middlewares/async');
const operatorsData = require('../../utils/operatorsData.json');
const emailer = require('../../utils/emailer');
const { commonFailedTemplateforBillPayments } = require('../../utils/emailTemplate/billpayments');
const { generateCarReportPaymentSuccessEmail } = require('../../utils/emailTemplate/carReportPayment');
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { createNotification } = require('../../models/use-cases/notification');
const { formatNumberWithLocalString } = require('../../utils/formatter');
const wallet = require('../../models/entities/wallet');
const carReportOrder = require('../../models/entities/carReportOrder');
const {
    REPORT_STATUS_LABELS,
    isPurchasable,
    missingRequiredFields,
    buildVehicleModel,
    buildValuationSpec,
    buildInspectionBooking,
    initialReportStatus,
} = require('../../utils/carReport');
const { resolvePlanPrice, resolvePlan } = require('../../utils/carReportPlans');
const { computeJournalData } = require('../../utils/computeJournalData');
const { publishJournalEvent } = require('../../utils/bull/queue/accountingEventsQueue');
const { generateOrderInvoiceAttachments } = require('../../services/invoiceAndReceipt');

const accessKey = operatorsData.carReport.accessKey;
const transactionCategory = operatorsData.carReport.type;

// Cashfree (paymentGateway) post-payment fulfilment for Car Reports.
// Called from the cashFreeGateway callback switch after Cashfree confirms the payment.
// Mirrors officeAndBusiness/controllers/corporate/carReport.js — that service owns the
// Car Reports feature; this leg exists only because the Cashfree callback switch lives
// here. With one structural difference:
// the money is ALREADY collected by the time this runs, so every early return has to
// refund it first rather than simply bailing out.
exports.payment = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const { reportType, reportName, vehicle = {}, requestId } = req.body;
    const corporateTxnId = req.body.corporateTxnId;
    // A manually entered history vehicle has no fleet `reg_num`; the plate arrives as the
    // form's `registrationNumber` instead.
    const regNum = req.body.reg_num || req.body.registrationNumber || null;
    const isValuation = reportType === 'valuation';
    const isInspection = reportType === 'inspection';

    if (!isPurchasable(reportType)) {
        await refundCashfreeDirect({ req, reason: 'report type not available', serviceType: transactionCategory });
        return next(new ErrorResponse('This report type is not available for purchase yet', 400));
    }
    if (!reportName) {
        await refundCashfreeDirect({ req, reason: 'reportName missing', serviceType: transactionCategory });
        return next(new ErrorResponse('reportName is required', 400));
    }
    const missing = missingRequiredFields(reportType, req.body);
    if (missing.length) {
        await refundCashfreeDirect({ req, reason: 'incomplete vehicle spec', serviceType: transactionCategory });
        return next(new ErrorResponse(`Missing required field(s): ${missing.join(', ')}`, 400));
    }

    const serviceDetails = await fetchServiceDetails({
        credentialId,
        accessKey,
        packageId: req.user.packageId,
        corporateUserId,
        traceId: req?.LogTraceId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        await refundCashfreeDirect({ req, reason: 'service unavailable', serviceType: transactionCategory });
        return next(new ErrorResponse('Apologies, the car report service is currently unavailable.', 500));
    }

    // Pricing — BE is source of truth. Any amount in the request body is ignored.
    // Inspection prices from `packageId`, so an unknown or teaser package lands here as
    // null and must be refused before it becomes NaN in the total. Money is already
    // collected on this leg, so refuse by refunding.
    const reportPrice = await resolvePlanPrice(reportType, req.body, credentialId, req?.LogTraceId);
    if (!reportPrice) {
        await refundCashfreeDirect({ req, reason: 'package not available', serviceType: transactionCategory });
        return next(new ErrorResponse('This package is not available for purchase', 400));
    }
    const surchargeDetails = await calculateSurchargeWithTax(
        serviceDetails.surcharge,
        serviceDetails.surchargeType,
        reportPrice,
        credentialId
    );
    const convenienceFee = Number(surchargeDetails.surcharge) || 0;
    const sellingTotal = Number((reportPrice + convenienceFee).toFixed(2));

    const partnerData = await fetchPartnerDetails(req?.user?.registeredBy);

    const plan = await resolvePlan(reportType, req.body, req?.LogTraceId);
    const journalPlanDetails = plan
        ? [{
                name: `Car Report : ${plan.displayName}`,
                commissionMode: plan.commissionMode,
                commissionType: plan.commissionType,
                commission: plan.commission,
                fixedCommissionPerTransaction:
                    plan.fixedCommissionPerTransaction,
                isCommissionInclGST: plan.isCommissionInclGST,
                amount: reportPrice,
                quantity: 1,
            }] : [];

    const isPgFunded = Object.prototype.hasOwnProperty.call(
        req.body,
        "paymentGatewayResponse"
    );
    const pgResponse = Array.isArray(req.body.paymentGatewayResponse)
        ? req.body.paymentGatewayResponse[0]
        : req.body.paymentGatewayResponse;
    let reportData = await computeJournalData({
        serviceDetails,
        pgAmount: isPgFunded ? Number(req.body.pgAmount || 0) : 0,
        amount: reportPrice,
        paymentMethod: pgResponse?.payment_method || {},
        partnerDetails: partnerData,
        paymentGatewayName: pgResponse?.paymentGatewayName || "Cashfree",
        couponTotalDiscount: req.body.couponTotalDiscount,
        planDetails: journalPlanDetails,
        corporateState: req.user.state,
        credentialId,
    });

    const publishJournal = (type) =>
        publishJournalEvent(
            {
                transactionRef: corporateTxnId,
                type,
                contextSnapshot: {
                    credentialId,
                    vendor: serviceDetails?.vendor || null,
                    registeredBy: req?.user?.registeredBy || null,
                },
                reportData,
            },
            req?.LogTraceId
        );

    const commonParams = {
        providerId: requestId || corporateTxnId,
        corporateTxnId,
        credentialId,
        serviceOperatorId: serviceDetails.id,
        corporateCashback: serviceDetails.cashback,
        accountNo: regNum || null,
        transactionCategory,
        orderAmount: sellingTotal,
        commissionType: serviceDetails.commissionType,
        cashbackType: serviceDetails.cashbackType,
        providerCommission: serviceDetails.providerCommission,
        payCashback: req.body.payCashback || false,
        surcharge: convenienceFee,
        reportData,
    };

    // 1) Record the collection (card via Cashfree, or wallet/split).
    let transactionResponse;
    if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
        transactionResponse = await createPGTransaction({
            ...commonParams,
            pgAmount: req.body.pgAmount,
            pgResponse: req.body.paymentGatewayResponse,
            couponCode: req.body.couponCode,
            corporateUserId,
            partnerId: req.user.registeredBy,
            accessKey,
        });
    } else {
        transactionResponse = await createWalletTransaction({ ...commonParams, amount: sellingTotal });
    }
    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
        await refundCashfreeDirect({ req, reason: 'Something went wrong while processing the order', serviceType: transactionCategory });
        return next(new ErrorResponse(transactionResponse.error, 500));
    }

    publishJournal('payment');

    // Coupon/Peko Credit is applied inside createPGTransaction, so the email and
    // notifications have to quote the net, not the catalogue total.
    const paidAmount = Number((sellingTotal - (transactionResponse.couponDiscount || 0)).toFixed(2));

    // 2) Record the report order. No vendor call for any product — this service has no
    // Droom client by design. A valuation's PDF and a history's RC lookup are both left
    // for officeAndBusiness to order/materialise the first time the order is opened, and
    // an inspection arrives there undispatched the same way.
    const reportStatus = initialReportStatus(reportType);
    // History carries no make/model — the plate stands in until officeAndBusiness
    // backfills the real one from the RC response.
    const vehicleModel = buildVehicleModel(vehicle, req.body) || regNum || '';
    let result;
    try {
        await carReportOrder.create({
            corporateTxnId: String(corporateTxnId),
            credentialId,
            subCorporateUserId: req.user.subCorporateUserId || null,
            reportType,
            reportName,
            vehicleNumber: regNum || null,
            vehicleModel,
            // The inspection form collects its own body type at the top level; a manually
            // entered vehicle has none on the fleet record.
            bodyType: vehicle.bodyType || req.body.bodyType || null,
            isManualVehicle: !!vehicle.isManual,
            amount: sellingTotal,
            paymentMode: transactionResponse?.paymentMode || null,
            orderDate: new Date(),
            reportStatus,
            // Product-specific columns, each left null off its own product so the detail
            // page can never render an empty card belonging to another report type.
            valuationSpec: isValuation ? buildValuationSpec(req.body) : null,
            // Captured here, but NOT dispatched: this service has no Droom client by
            // design. The order is left with a null vendorReference, and officeAndBusiness
            // books the technician the first time the order is opened
            // (controllers/corporate/carReportInspection.js).
            inspectionBooking: isInspection ? buildInspectionBooking(req.body) : null,
            formValues: req.body,
        });
        result = { status: true, data: {} };
    } catch (error) {
        result = { status: false, data: { message: 'Payment Failed! ' + error.message } };
        customLog(
            req?.LogTraceId,
            'error',
            { message: 'carReportOrder.create threw', error: error.message },
            'CAR_REPORT'
        );
    }

    // 3) Settle: success → confirm; failure → refund the collected amount.
    const account = regNum || vehicleModel || 'New vehicle';

    if (result.status) {
        await updateWalletTransaction({
            corporateTxnId,
            providerId: corporateTxnId,
            status: 'SUCCESS',
            message: 'Payment Successful',
            // orderId here is what the Car Reports success page reads back to deep-link
            // straight to this order.
            orderResponse: JSON.stringify({
                orderId: String(corporateTxnId),
                reportType,
                reportName,
                vehicleNumber: regNum || '',
                vehicleModel,
            }),
        });

        const emailParams = [{ paramName: 'Vehicle', paramValue: account }];
        const body = generateCarReportPaymentSuccessEmail(corporateTxnId, paidAmount.toFixed(2), account, req.user.name, partnerData, emailParams);
        const invoiceAttachments = await generateOrderInvoiceAttachments({
            amount: reportPrice,
            surcharge: convenienceFee,
            couponDiscount: transactionResponse.couponDiscount || 0,
            corporateTxnId,
            orderId: transactionResponse.orderId,
            paymentType: 'Car Report',
            credentialId,
            pgAmount: isPgFunded ? req.body.pgAmount : null,
            paymentMethod: pgResponse?.payment_method,
            vendor: serviceDetails?.vendor,
            commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
            planDetails: journalPlanDetails,
            commissionMode: reportData?.journalData?.commissionMode || 'MARGIN',
            traceId: req?.LogTraceId,
        });
        emailer.emailWithMultipleAttachment(
            req.user.email,
            'Payment Successful - Peko Car Reports',
            body,
            invoiceAttachments,
            null,
            () => {}
        );
        createNotification({
            notificationTitle: 'Payment Successful',
            notificationBrief: `The payment of ₹ ${formatNumberWithLocalString(paidAmount)} for ${reportName} (${account}) with transaction ID ${corporateTxnId} was successful.`,
            notificationTo: [req.user.username],
            notificationCategory: 'CORPORATE',
            notificationBy: 'ADMIN',
        });

        // Spread transactionResponse so corporateFinalBalance reaches the FE (wallet refresh).
        return res.status(200).json({
            status: true,
            data: {
                ...transactionResponse,
                corporateTxnId,
                orderId: String(corporateTxnId),
                reportType,
                reportStatus: REPORT_STATUS_LABELS[reportStatus],
                serviceProvider: transactionCategory,
            },
            message: 'Payment Successful',
            responseCode: '000',
        });
    }

    const failureDetails = {
        corporateTxnId,
        status: 'FAILURE',
        providerId: corporateTxnId,
        message: 'Payment Failed!',
        registeredById: req.user.registeredBy,
        orderResponse: JSON.stringify(result.data),
        couponId: transactionResponse.couponId,
    };
    if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
        await cancelPGTransaction(corporateTxnId);
        await refundWalletTransaction(failureDetails);
    } else {
        await refundWalletTransaction(failureDetails);
    }
    publishJournal('refund');

    const failBody = commonFailedTemplateforBillPayments(transactionCategory, account, 'Droom', req.user.name, partnerData);
    emailer.email({ to: req.user.email, subject: 'Transaction Failed', body: failBody });
    createNotification({
        notificationTitle: 'Payment Failed',
        notificationBrief: `The payment of ₹ ${formatNumberWithLocalString(paidAmount)} for ${reportName} (${account}) with transaction ID ${corporateTxnId} was Failed.`,
        notificationTo: [req.user.username],
        notificationCategory: 'CORPORATE',
        notificationBy: 'ADMIN',
    });
    const walletDetails = await wallet.findOne({ where: { credentialId }, attributes: ['balance'] });
    return res.status(500).json({
        status: false,
        data: { ...result.data, corporateFinalBalance: walletDetails && walletDetails.balance },
        message: 'Payment Failed',
        responseCode: '001',
    });
});
