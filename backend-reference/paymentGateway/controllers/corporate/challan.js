const { fetchServiceDetails, calculateSurchargeWithTax } = require('../../utils/checkAndFetchServiceDetails');
const { createWalletTransaction, updateWalletTransaction, refundWalletTransaction } = require('../../utils/walletTransaction');
const { createPGTransaction } = require('../../utils/paymentGatewayTransaction');
const { cancelPGTransaction, refundCashfreeDirect } = require('../../utils/pgRefund');
const { getDroomToken, pushOrder } = require('../../utils/droomClient');
const { customLog } = require('../../utils/loggerHelper');
const ErrorResponse = require('../../utils/error-response');
const asyncHandler = require('../../middlewares/async');
const operatorsData = require('../../utils/operatorsData.json');
const emailer = require('../../utils/emailer');
const { generateMobilePaymentSuccessEmailBill, commonFailedTemplateforBillPayments } = require('../../utils/emailTemplate/billpayments');
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { createNotification } = require('../../models/use-cases/notification');
const { formatNumberWithLocalString } = require('../../utils/formatter');
const wallet = require('../../models/entities/wallet');
const { resolveEmailTemplate } = require('../../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../../utils/emailTemplateKeys');
const { v2LayoutVariables } = require('../../utils/emailTemplate/sharedLayout');
const { generateOrderInvoiceAttachments } = require('../../services/invoiceAndReceipt');
const { computeJournalData } = require('../../utils/computeJournalData');
const { publishJournalEvent } = require('../../utils/bull/queue/accountingEventsQueue');

const accessKey = operatorsData.challan.accessKey;
const transactionCategory = operatorsData.challan.type;

// Reject malformed payloads before any wallet debit — a challan without a price or vehicle would
// otherwise be recorded as a ₹0 order with no vehicle that never settles (ticket 30967).
const validateChallanPayload = (challans, regNum) => {
    if (!Array.isArray(challans) || challans.length === 0) return 'No challans selected for payment';
    const invalid = challans.some(
        c =>
            !c ||
            !String(c.challan_number || '').trim() ||
            !(Number(c.challan_price) > 0) ||
            !String(c.registration_number || regNum || '').trim()
    );
    return invalid ? 'Invalid challan details: challan number, amount and vehicle number are required' : null;
};

// The convenience fee is per challan — split the total equally, in paise so the items
// sum exactly to what was charged; any remainder lands on the first item.
const allocateConvenienceFee = (challans, totalFee) => {
    if (!challans.length) return [];
    const totalPaise = Math.round(Number(totalFee) * 100);
    const share = Math.floor(totalPaise / challans.length);
    const fees = challans.map(() => share);
    fees[0] += totalPaise - share * challans.length;
    return fees.map(p => p / 100);
};

// Cashfree (paymentGateway) post-payment fulfilment for Traffic Challan.
// Called from the cashFreeGateway callback switch after Cashfree confirms the payment.
// Records the txn (wallet/PG) → Push Order to Droom → on failure refund the collected amount.
exports.payment = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const { challans = [], reg_num: regNum, requestId } = req.body;
    const corporateTxnId = req.body.corporateTxnId;

    const invalidReason = validateChallanPayload(challans, regNum);
    if (invalidReason) {
        await refundCashfreeDirect({ req, reason: invalidReason, serviceType: transactionCategory });
        return next(new ErrorResponse(invalidReason, 400));
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
        return next(new ErrorResponse('Apologies, the challan service is currently unavailable.', 500));
    }

    // Pricing — BE is source of truth. challan_price = fine; convenience_fee = Peko
    // surcharge, a FLAT one charged per challan; discount = 0.
    const challanTotal = challans.reduce((sum, c) => sum + Number(c.challan_price), 0);
    const surchargeDetails = await calculateSurchargeWithTax(
        serviceDetails.surcharge,
        serviceDetails.surchargeType,
        challanTotal,
        credentialId,
        challans.length
    );
    const convenienceFeeTotal = Number(surchargeDetails.surcharge) || 0;
    const sellingTotal = Number((challanTotal + convenienceFeeTotal).toFixed(2));
    const perChallanFees = allocateConvenienceFee(challans, convenienceFeeTotal);

    let partnerData = await fetchPartnerDetails(req.user.registeredBy);

    const pgResponse = Array.isArray(req.body?.paymentGatewayResponse) ? req.body.paymentGatewayResponse[0] : req.body?.paymentGatewayResponse;
    const reportData = await computeJournalData({
        serviceDetails,
        pgAmount: req.body.paymentGatewayResponse ? Number(req.body.pgAmount || 0) : 0,
        amount: challanTotal,
        paymentMethod: pgResponse?.payment_method || {},
        partnerDetails: partnerData,
        paymentGatewayName: pgResponse?.paymentGatewayName || 'Cashfree',
        couponTotalDiscount: req.body.couponTotalDiscount,
        corporateState: req.user.state || '',
        credentialId,
    });

    const commonParams = {
        providerId: requestId || corporateTxnId,
        corporateTxnId,
        credentialId,
        serviceOperatorId: serviceDetails.id,
        corporateCashback: serviceDetails.cashback,
        accountNo: regNum || challans[0].registration_number,
        transactionCategory,
        // Base only — the transaction helpers add `surcharge` on top themselves.
        orderAmount: challanTotal,
        commissionType: serviceDetails.commissionType,
        cashbackType: serviceDetails.cashbackType,
        providerCommission: serviceDetails.providerCommission,
        payCashback: req.body.payCashback || false,
        surcharge: convenienceFeeTotal,
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
        transactionResponse = await createWalletTransaction({ ...commonParams, amount: challanTotal });
    }
    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
        await refundCashfreeDirect({ req, reason: 'Something went wrong while processing the order', serviceType: transactionCategory });
        return next(new ErrorResponse(transactionResponse.error, 500));
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

    // 2) Push order to Droom (company_token injected by droomClient).
    const items = {};
    challans.forEach((c, i) => {
        const fee = perChallanFees[i] || 0;
        items[c.challan_number] = {
            selling_price: Number((Number(c.challan_price) + fee).toFixed(2)),
            discount: 0,
            challan_price: Number(c.challan_price),
            convenience_fee: fee,
        };
    });
    const pushBody = {
        reference_id: String(corporateTxnId),
        total_amount: String(sellingTotal),
        customer_name: req.user.name || req.user.contactPersonName || 'Peko Platforms',
        phone_number: (req.user.mobileNo || req.user.mobile || '').toString(),
        reg_num: regNum || challans[0].registration_number,
        email: req.user.email,
        user_id: String(corporateUserId),
        items,
    };

    let result;
    try {
        const token = await getDroomToken(serviceDetails.vendor, req?.LogTraceId);
        if (!token) {
            result = { status: false, data: { message: 'Provider authentication failed' } };
        } else {
            result = await pushOrder(serviceDetails.vendor, pushBody, token, req?.LogTraceId);
        }
    } catch (error) {
        result = { status: false, data: { message: 'Payment Failed! ' + error.message } };
        customLog(req?.LogTraceId, 'error', { message: 'Droom pushOrder threw', error: error.message }, 'VENDOR');
    }

    // 3) Settle: success → confirm; failure → refund the collected amount.
    // Email + notification mirror the shared bill-payment success/failure side-effects.
    const account = regNum || challans[0].registration_number;
    // partnerData already fetched above for journal computation.

    if (result.status) {
        await updateWalletTransaction({
            corporateTxnId,
            providerId: result?.data?.data?.reference_id ?? corporateTxnId,
            status: 'SUCCESS',
            message: 'Payment Successful',
            orderResponse: JSON.stringify(result.data),
        });

        const resolvedChallanSuccess = await resolveEmailTemplate({
            key: EMAIL_TEMPLATE_KEYS.BILL_PAYMENT_SUCCESS,
            service: EMAIL_TEMPLATE_SERVICES.BILL_PAYMENT,
            variables: {
                serviceType: transactionCategory,
                name: req.user.name,
                branding: partnerData?.branding || 'Peko',
                website: partnerData?.baseUrl || 'https://peko.one/in',
                ...v2LayoutVariables(partnerData),
            },
            fallback: () => {
                const emailParams = [{ paramName: 'Vehicle Number', paramValue: account }];
                return generateMobilePaymentSuccessEmailBill(transactionCategory, corporateTxnId, sellingTotal.toFixed(2), account, 'Droom', 'Vehicle Number', req.user.name, partnerData, serviceDetails.serviceProvider, emailParams);
            },
            fallbackSubject: `${transactionCategory} Successful`,
            partnerId: req.user.registeredBy || null,
            logTraceId: req?.LogTraceId,
        });

        const planDetails = challans.map((c) => ({
            name: c.challan_number ? `Traffic Challan ${c.challan_number}` : 'Traffic Challan',
            amount: Number(c.challan_price),
            quantity: 1,
        }));
        const invoiceAttachments = await generateOrderInvoiceAttachments({
            amount: challanTotal,
            surcharge: convenienceFeeTotal,
            couponDiscount: transactionResponse?.couponDiscount || 0,
            corporateTxnId,
            orderId: transactionResponse?.orderId,
            paymentType: transactionCategory,
            description: `${transactionCategory} - ${account}`,
            credentialId,
            pgAmount: Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse') ? req.body.pgAmount : null,
            paymentMethod: pgResponse?.payment_method,
            vendor: serviceDetails?.vendor,
            commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
            planDetails,
            commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
            traceId: req?.LogTraceId,
        });
        emailer.emailWithMultipleAttachment(req.user.email, resolvedChallanSuccess.subject, resolvedChallanSuccess.html, invoiceAttachments, () => {});
        createNotification({
            notificationTitle: 'Payment Successful',
            notificationBrief: `The payment of ₹ ${formatNumberWithLocalString(sellingTotal)} for vehicle ${account} with transaction ID ${corporateTxnId} (${transactionCategory}) was successful.`,
            notificationTo: [req.user.username],
            notificationCategory: 'CORPORATE',
            notificationBy: 'ADMIN',
        });

        // Spread transactionResponse so corporateFinalBalance reaches the FE (wallet refresh).
        return res.status(200).json({
            status: true,
            data: { ...transactionResponse, corporateTxnId, serviceProvider: transactionCategory },
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
    if (reportData) {
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
    }

    const resolvedChallanFailed = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.BILL_PAYMENT_FAILED,
        service: EMAIL_TEMPLATE_SERVICES.BILL_PAYMENT,
        variables: {
            serviceType: transactionCategory,
            account,
            serviceProvider: 'Droom',
            name: req.user.name,
            branding: partnerData?.branding || 'Peko',
            website: partnerData?.baseUrl || 'https://peko.one/in',
            logo: partnerData?.logo,
            ...v2LayoutVariables(partnerData),
        },
        fallback: () => commonFailedTemplateforBillPayments(transactionCategory, account, 'Droom', req.user.name, partnerData),
        fallbackSubject: 'Transaction Failed',
        partnerId: req.user.registeredBy || null,
        logTraceId: req?.LogTraceId,
    });
    emailer.email({ to: req.user.email, subject: resolvedChallanFailed.subject, body: resolvedChallanFailed.html }, () => {});
    createNotification({
        notificationTitle: 'Payment Failed',
        notificationBrief: `The payment of ₹ ${formatNumberWithLocalString(sellingTotal)} for vehicle ${account} with transaction ID ${corporateTxnId} (${transactionCategory}) was Failed.`,
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
