const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const { fetchServiceDetails, calculateSurchargeWithTax } = require('../../utils/checkAndFetchServiceDetails');
const { createNotification } = require('../../models/use-cases/notification');
const { createWalletTransaction, updateWalletTransaction, refundWalletTransaction } = require('../../utils/walletTransaction');
const { createPGTransaction } = require('../../utils/paymentGatewayTransaction');
const { cancelPGTransaction } = require('../../utils/pgRefund');
const emailer = require('../../utils/emailer');
const operatorsData = require('../../utils/operatorsData.json');
const { paymentSuccessEmail } = require('../../utils/emailTemplate/companyIncorporation');
const { updateApplicationStatus } = require('../../models/use-cases/companyIncorporation');
const { promoteApplicationToSaved } = require('../../utils/vendorGateway');
const { generateApplicationPdf } = require('../../utils/generateApplicationPdf');
const withRetry = require('../../utils/withRetry');
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { customLog } = require('../../utils/loggerHelper');
const { computeJournalData } = require('../../utils/computeJournalData');
const { publishJournalEvent } = require('../../utils/bull/queue/accountingEventsQueue');
const { generateOrderInvoiceAttachments } = require('../../services/invoiceAndReceipt');
const accessKey = operatorsData['companyIncorporation']['accessKey'];
const transactionCategory = operatorsData['companyIncorporation']['category'];

exports.payment = asyncHandler(async (req, res, next) => {
    const { applicationId, amount, payCashback } = req.body;

    if (!applicationId || !amount) {
        return next(new ErrorResponse('applicationId and amount are required', 400));
    }

    // PG flow sends corporateTxnId from the order created at checkout initiation.
    // Wallet flow has no pre-created order, so we generate one here.
    const corporateTxnId = req.body.corporateTxnId || new Date().valueOf();

    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const packageId = req.user.packageId;
    const name = req.user.name;
    const emailId = req.user.email;
    const subCorporateEmail = req.user.subCorporateEmail;
    const isSubCorporateUser = req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId && req.user.subCorporateUsername;

    let partnerDetails;
    partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);

    const serviceDetails = await fetchServiceDetails({ credentialId, accessKey, packageId, corporateUserId });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 500));
    }

    const { commissionType, cashbackType, providerCommission, cashback: corporateCashback, id: serviceOperatorId } = serviceDetails;

    const numericAmount = parseFloat(amount);
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
        paymentGatewayName: pgResponse?.paymentGatewayName || 'Cashfree',
        couponTotalDiscount: req.body.couponTotalDiscount,
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
    };

    let transactionResponse = {};
    if (Object.prototype.hasOwnProperty.call(req.body, 'razorPay')) {
        const { createRazorPayTransaction } = require('../../utils/dapiTransaction');
        transactionResponse = await createRazorPayTransaction({
            ...commonParams,
            razorPayAmount: req.body.razorPayAmount,
            razorPayResponse: req.body.razorPay,
        });
    } else if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
        transactionResponse = await createPGTransaction({
            ...commonParams,
            pgAmount: req.body.pgAmount,
            pgResponse: req.body.paymentGatewayResponse,
            couponCode: req.body.couponCode,
            corporateUserId,
            partnerId: req.user.registeredBy,
            reportData,
        });
    } else {
        transactionResponse = await createWalletTransaction({ ...commonParams, amount, reportData });
    }

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

    const paidAmount = (numericAmount + surcharge - (transactionResponse.couponDiscount || 0)).toFixed(2);

    const updateDetails = {
        corporateTxnId,
        providerId: applicationId,
        status: 'SUCCESS',
        message: 'Payment Successful',
        orderResponse: JSON.stringify({ applicationId }),
    };

    await updateWalletTransaction(updateDetails);

    // --- Vendor submission (synchronous — vendor failure triggers refund) ---

    const apiUrl = serviceDetails.vendor?.apiUrl;
    const apiKey = serviceDetails.vendor?.optional1;

    if (!apiUrl || !apiKey) {
        customLog(req?.LogTraceId, 'error', { message: 'Vendor config missing — refunding payment', applicationId });
        try {
            await refundWalletTransaction({ corporateTxnId, providerId: applicationId, status: 'REFUNDED', message: 'Vendor service unavailable', orderResponse: JSON.stringify({ applicationId }) });
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
        } catch (refundErr) {
            customLog(req?.LogTraceId, 'error', { message: 'Refund failed (vendor config missing)', corporateTxnId, err: refundErr.message });
        }
        throw new ErrorResponse('Vendor service unavailable. Your payment has been refunded.', 503);
    }

    // updateApplicationStatus returns the full Sequelize record — use it as application data for PDF generation
    let currentApplication;
    try {
        currentApplication = await updateApplicationStatus(applicationId, { vendorStatus: 'SENDING', vendorAttempts: 1 });
    } catch (err) {
        customLog(req?.LogTraceId, 'error', { message: 'Failed to update vendorStatus to SENDING — refunding', applicationId, err: err.message });
        try {
            await refundWalletTransaction({ corporateTxnId, providerId: applicationId, status: 'REFUNDED', message: 'Application processing failed', orderResponse: JSON.stringify({ applicationId }) });
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
        } catch (refundErr) {
            customLog(req?.LogTraceId, 'error', { message: 'Refund failed (status update error)', corporateTxnId, err: refundErr.message });
        }
        throw new ErrorResponse('Application processing failed. Your payment has been refunded.', 500);
    }

    try {
        const appData = currentApplication.toJSON ? currentApplication.toJSON() : currentApplication;

        if (!appData.vendorSetupId) {
            throw new ErrorResponse('Application not registered with vendor — cannot promote to saved', 500);
        }

        customLog(req?.LogTraceId, 'info', { message: 'Generating application PDF', applicationId });
        const pdfBuffer = await generateApplicationPdf(appData);
        customLog(req?.LogTraceId, 'info', { message: 'PDF generated, promoting vendor draft to saved', applicationId, pdfSizeBytes: pdfBuffer.length });

        const vendorResponse = await withRetry(() =>
            promoteApplicationToSaved(apiUrl, apiKey, appData.vendorSetupId, pdfBuffer, appData)
        );
        customLog(req?.LogTraceId, 'info', { message: 'Vendor promotion to saved successful', applicationId, vendorResponse });

        await updateApplicationStatus(applicationId, {
            status: 'SUBMITTED',
            paymentStatus: 'COMPLETED',
            corporateTxnId,
            vendorStatus: 'SENT',
            vendorSentAt: new Date(),
            vendorError: null,
            // vendorApplicationId, vendorTrackingId, vendorSetupId were captured at draft
            // creation; reaffirm here in case the response carries updated values.
            vendorApplicationId: vendorResponse.data?.application_id || appData.vendorApplicationId,
            vendorTrackingId: vendorResponse.data?.tracking_id || appData.vendorTrackingId,
            vendorSetupId: vendorResponse.data?._id || appData.vendorSetupId,
        });

        await updateWalletTransaction({
            corporateTxnId,
            providerId: applicationId,
            status: 'SUCCESS',
            message: 'Payment Successful',
            orderResponse: JSON.stringify({ applicationId, vendorData: vendorResponse.data }),
        });
    } catch (vendorErr) {
        const vendorResponseData = vendorErr.response?.data;
        customLog(req?.LogTraceId, 'error', {
            message: 'Vendor submission failed — initiating refund',
            applicationId,
            errMessage: vendorErr.message,
            vendorStatusCode: vendorErr.response?.status,
            vendorResponse: vendorResponseData,
        });

        await updateApplicationStatus(applicationId, {
            vendorStatus: 'FAILED',
            vendorError: vendorResponseData ? JSON.stringify(vendorResponseData) : vendorErr.message,
        }).catch(() => {});

        try {
            if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
                await cancelPGTransaction(corporateTxnId);
            }
            await refundWalletTransaction({
                corporateTxnId,
                providerId: applicationId,
                status: 'REFUNDED',
                message: 'Application submission to authority failed',
                orderResponse: JSON.stringify({ applicationId }),
            });
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
        } catch (refundErr) {
            customLog(req?.LogTraceId, 'error', { message: 'Refund failed after vendor failure', corporateTxnId, err: refundErr.message });
        }

        throw new ErrorResponse('Application submission failed. Your payment has been refunded.', 500);
    }

    // --- Vendor succeeded — send email, notification, respond ---

    const to = subCorporateEmail || emailId;
    const cc = subCorporateEmail ? emailId : undefined;

    try {
        const isGatewayFunded = Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse') || Object.prototype.hasOwnProperty.call(req.body, 'razorPay');
        const planDetails = [{
            name: 'Company Incorporation Service',
            amount: numericAmount,
            quantity: 1,
        }];
        const invoiceAttachments = await generateOrderInvoiceAttachments({
            amount: numericAmount,
            surcharge,
            couponDiscount: transactionResponse.couponDiscount || 0,
            corporateTxnId,
            orderId: transactionResponse.orderId,
            paymentType: 'Company Incorporation',
            credentialId,
            pgAmount: isGatewayFunded ? (req.body.pgAmount ?? req.body.razorPayAmount ?? null) : null,
            paymentMethod: pgResponse?.payment_method,
            vendor: serviceDetails?.vendor,
            commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
            planDetails,
            commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
            traceId: req?.LogTraceId,
        });
        emailer.emailWithMultipleAttachment(
            to,
            'Company Incorporation - Payment Successful',
            paymentSuccessEmail(name, applicationId, paidAmount, partnerDetails),
            invoiceAttachments,
            cc,
            emailErr => {
                if (emailErr) {
                    customLog(req?.LogTraceId, 'error', { message: 'Error sending success email', emailErr });
                } else {
                    customLog(req?.LogTraceId, 'info', { message: 'Success email sent', to });
                }
            }
        );
    } catch (emailErr) {
        customLog(req?.LogTraceId, 'error', { message: 'Failed to generate or send success email', emailErr: emailErr.message });
    }

    createNotification({
        notificationTitle: 'Company Incorporation - Payment Successful',
        notificationBrief: `Payment of ₹${paidAmount} for application ${applicationId} was successful.`,
        notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
        notificationCategory: 'CORPORATE',
        notificationBy: 'ADMIN',
    });

    customLog(req?.LogTraceId, 'info', { message: 'Company incorporation payment successful', applicationId, corporateTxnId });

    return res.status(200).json({
        status: true,
        message: 'Payment completed successfully. Thank you!',
        data: { ...transactionResponse, corporateTxnId, applicationId },
        responseCode: '000',
    });
});
