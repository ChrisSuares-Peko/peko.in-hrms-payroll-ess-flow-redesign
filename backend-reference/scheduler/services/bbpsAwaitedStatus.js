const { Op } = require('sequelize');
const { XMLParser, XMLBuilder } = require('fast-xml-parser');
const axios = require('axios');

const transaction = require('../models/entities/transaction');
const order = require('../models/entities/order');
const serviceOperator = require('../models/entities/serviceOperator');
const credential = require('../models/entities/credential');
const { findOneWithId } = require('../models/use-cases/corporateUser');
const { fetchServiceDetails } = require('../utils/checkAndFetchServiceDetails');
const { refundWalletTransaction, updateWalletTransaction } = require('../utils/walletTransaction');
const { customLog } = require('../utils/loggerHelper');
const { generateRequestId, encrypt, decrypt } = require('../utils/billPayments_utils');
const operatorsData = require('../utils/operatorsData.json');
const { createNotification } = require('../models/use-cases/notification');
const { fetchPartnerDetails } = require('../models/use-cases/systemUser');
const emailer = require('../utils/emailer');
const {
    generateMobilePaymentSuccessEmailBill,
    commonFailedTemplateforBillPayments,
} = require('../utils/email/emailTemplates/billpayments');
const { formatNumberWithLocalString } = require('../utils/formatter');
const { generateOrderInvoiceAttachments } = require('./invoiceAndReceipt');
const { notifyPGPaymentConfirmed } = require('../utils/pusherNotification');
const { decrementBillAvenueBalance } = require('../utils/billAvenueWallet');
const { resolveEmailTemplate } = require('./emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../utils/emailTemplateKeys');
const { v2LayoutVariables } = require('../utils/emailTemplate/sharedLayout');

const frontendBaseUrl = process.env.NODE_ENV === 'production' ? process.env.PRODUCTION_URL : process.env.FRONTEND_STAGING_URL;

const { accessKey } = operatorsData.billavenue;

// Side effects must never roll back the DB resolution — wrapped in try/catch
// so a Pusher/SMTP hiccup is logged but doesn't corrupt the authoritative state.
async function fireResolutionSideEffects({ txn, resolutionStatus }) {
    const {
        corporateTxnId,
        credentialId,
        transactionCategory,
        order: orderRow,
        credential: credRow,
    } = txn;

    try {
        notifyPGPaymentConfirmed(
            credentialId,
            null,
            corporateTxnId,
            null,
            resolutionStatus
        ).catch(() => {});

        const userEmail = credRow?.email;
        const username = credRow?.username;
        const userName = credRow?.name;
        const registeredBy = credRow?.registeredBy;
        const accountNo = orderRow?.accountNo ?? 'N/A';
        const rawAmount = orderRow?.amountInINR ?? orderRow?.baseAmount ?? 0;
        const formattedAmount = formatNumberWithLocalString(rawAmount);
        const categoryLabel = transactionCategory || 'BBPS';
        const operatorLabel = orderRow?.serviceOperator?.serviceProvider || categoryLabel;

        if (!username || !userEmail) {
            customLog(null, 'info', {
                message: 'bbpsAwaitedStatus: missing user identifiers; skipping notify/email',
                corporateTxnId,
                resolutionStatus,
                hasUsername: Boolean(username),
                hasEmail: Boolean(userEmail),
            });
            return;
        }

        const partnerData = await fetchPartnerDetails(registeredBy);

        const notificationData =
            resolutionStatus === 'SUCCESS'
                ? {
                      notificationTitle: 'Payment Successful',
                      notificationBrief: `The payment of ₹ ${formattedAmount} for account ${accountNo} with transaction ID ${corporateTxnId} (${categoryLabel}) was successful.`,
                      notificationTo: [username],
                      notificationCategory: 'CORPORATE',
                      notificationBy: 'ADMIN',
                  }
                : {
                      notificationTitle: 'Payment Failed',
                      notificationBrief: `The payment of ₹ ${formattedAmount} for account ${accountNo} with transaction ID ${corporateTxnId} (${categoryLabel}) was Failed.`,
                      notificationTo: [username],
                      notificationCategory: 'CORPORATE',
                      notificationBy: 'ADMIN',
                  };
        createNotification(notificationData);

        const loginUrl = `${frontendBaseUrl}/auth/login`;
        const layoutVars = {
            branding: partnerData?.branding || 'Peko',
            website: partnerData?.website || 'https://www.peko.one',
            ...v2LayoutVariables(partnerData),
        };
        const resolvedEmail =
            resolutionStatus === 'SUCCESS'
                ? await resolveEmailTemplate({
                      key: EMAIL_TEMPLATE_KEYS.BILL_PAYMENT_SUCCESS,
                      service: EMAIL_TEMPLATE_SERVICES.SCHEDULER,
                      variables: { serviceType: categoryLabel, name: userName, loginUrl, ...layoutVars },
                      fallback: () => generateMobilePaymentSuccessEmailBill(categoryLabel, userName, partnerData, loginUrl),
                      fallbackSubject: `${operatorLabel} Successful`,
                  })
                : await resolveEmailTemplate({
                      key: EMAIL_TEMPLATE_KEYS.BILL_PAYMENT_FAILED,
                      service: EMAIL_TEMPLATE_SERVICES.SCHEDULER,
                      variables: { serviceType: categoryLabel, account: accountNo, serviceProvider: operatorLabel, name: userName, ...layoutVars },
                      fallback: () => commonFailedTemplateforBillPayments(categoryLabel, accountNo, operatorLabel, userName, partnerData),
                      fallbackSubject: 'Transaction Failed',
                  });

        let invoiceAttachments = [];
        if (resolutionStatus === 'SUCCESS') {
            const baseAmount = Number(rawAmount) || 0;
            const orderSurcharge = Number(orderRow?.surcharge) || 0;
            invoiceAttachments = await generateOrderInvoiceAttachments({
                amount: baseAmount,
                surcharge: orderSurcharge,
                couponDiscount: 0,
                corporateTxnId,
                orderId: orderRow?.id,
                paymentType: categoryLabel,
                description: categoryLabel,
                credentialId,
                pgAmount:
                    orderRow?.paymentMode === 'PAYMENT GATEWAY'
                        ? baseAmount + orderSurcharge
                        : null,
                traceId: null,
            });
        }
        emailer.emailWithMultipleAttachment(
            userEmail,
            resolvedEmail.subject,
            resolvedEmail.html,
            invoiceAttachments,
            () => {}
        );
    } catch (sideEffectErr) {
        // Side-effect failures must never poison the DB resolution.
        customLog(null, 'error', {
            message: 'bbpsAwaitedStatus: side-effect dispatch failed (non-fatal)',
            corporateTxnId,
            resolutionStatus,
            error: sideEffectErr?.message,
            stack: sideEffectErr?.stack,
        });
    }
}

exports.bbpsAwaitedStatus = async () => {
    customLog(null, 'info', { message: 'BBPS Awaited Status Processor started' });
    try {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

        const awaitedTransactions = await transaction.findAll({
            where: {
                remarks: 'Payment Awaited',
                status: 'AWAITED',
                transactionDate: { [Op.lte]: fifteenMinutesAgo },
            },
            include: [
                {
                    model: order,
                    attributes: ['id', 'accountNo', 'baseAmount', 'amountInINR', 'paymentMode', 'corporateTxnId', 'surcharge'],
                    include: [{ model: serviceOperator, attributes: ['serviceProvider'] }],
                },
                {
                    model: credential,
                    attributes: ['email', 'name', 'username', 'registeredBy'],
                },
            ],
            raw: true,
            nest: true,
        });

        if (!awaitedTransactions.length) {
            customLog(null, 'info', { message: 'No AWAITED BBPS transactions found' });
            return;
        }

        customLog(null, 'info', {
            message: `Processing ${awaitedTransactions.length} AWAITED transactions`,
        });

        for (const txn of awaitedTransactions) {
            try {
                const { corporateTxnId, credentialId, providerId } = txn;

                const corporateDetails = await findOneWithId(credentialId);
                if (!corporateDetails) {
                    customLog(null, 'info', { corporateTxnId, message: 'Corporate user not found, skipping' });
                    continue;
                }

                const { packageId, id: corporateUserId } = corporateDetails;

                const serviceDetails = await fetchServiceDetails({
                    credentialId,
                    accessKey,
                    packageId,
                    corporateUserId,
                });

                if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
                    customLog(null, 'error', { corporateTxnId, error: serviceDetails.error });
                    continue;
                }

                const encryptionKey = serviceDetails.vendor.optional4;
                const apiBaseUrl = serviceDetails.vendor.apiUrl;
                const requestId = generateRequestId();

                const statusReqBody = {
                    trackType: 'TRANS_REF_ID',
                    trackValue: providerId || String(corporateTxnId),
                };

                const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
                let xmlPayload = builder.build({ transactionStatusReq: statusReqBody });
                xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlPayload}`;
                const encRequest = encrypt(xmlPayload, encryptionKey);

                const data = {
                    accessCode: serviceDetails.vendor.optional3,
                    requestId,
                    encRequest,
                    ver: serviceDetails.vendor.optional2,
                    instituteId: serviceDetails.vendor.optional1,
                };

                const response = await axios({
                    method: 'POST',
                    url: `${apiBaseUrl}/billpay/transactionStatus/fetchInfo/xml`,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    data: new URLSearchParams(data).toString(),
                });

                const decryptedResponse = decrypt(response.data, encryptionKey);
                const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
                const parsedResponse = parser.parse(decryptedResponse);

                customLog(null, 'info', {
                    corporateTxnId,
                    parsedResponse,
                    message: 'Status check response',
                });

                const statusResp = parsedResponse?.transactionStatusResponse;
                if (!statusResp || statusResp.responseCode !== '000') {
                    customLog(null, 'info', {
                        corporateTxnId,
                        message: 'Unexpected response from status check, skipping',
                    });
                    continue;
                }

                const txnStatus = statusResp.txnStatus;

                if (txnStatus === 'SUCCESS') {
                    await updateWalletTransaction({
                        corporateTxnId,
                        providerId: statusResp.txnRefId || providerId,
                        status: 'SUCCESS',
                        message: 'Payment Successful',
                        orderResponse: JSON.stringify(statusResp),
                    });
                    customLog(null, 'info', {
                        corporateTxnId,
                        message: 'AWAITED transaction resolved as SUCCESS',
                    });
                    // Track the vendor wallet: an AWAITED payment only settles with BillAvenue once it
                    // resolves SUCCESS here, so decrement now (by orderAmount = bill + CCF1, excl. surcharge).
                    // Fire-and-forget — tracking must never affect the transaction's resolution.
                    decrementBillAvenueBalance(Number(txn.order?.amountInINR) || 0, { corporateTxnId, source: 'BBPS-AWAITED' }, null).catch(() => {});
                    await fireResolutionSideEffects({ txn, resolutionStatus: 'SUCCESS' });
                } else if (txnStatus === 'FAILED' || txnStatus === 'FAILURE') {
                    await refundWalletTransaction({
                        corporateTxnId,
                        status: 'FAILURE',
                        providerId: statusResp.txnRefId || providerId,
                        message: 'Payment Failed!',
                        orderResponse: JSON.stringify(statusResp),
                    });
                    customLog(null, 'info', {
                        corporateTxnId,
                        message: 'AWAITED transaction resolved as FAILURE, wallet refunded',
                    });
                    await fireResolutionSideEffects({ txn, resolutionStatus: 'FAILURE' });
                } else {
                    // Still pending — leave for next poll cycle
                    customLog(null, 'info', {
                        corporateTxnId,
                        txnStatus,
                        message: 'Transaction still pending, will retry next cycle',
                    });
                }
            } catch (innerError) {
                customLog(null, 'error', {
                    error: innerError.message,
                    corporateTxnId: txn?.corporateTxnId,
                    message: 'Error while processing AWAITED transaction',
                });
                continue;
            }
        }

        customLog(null, 'info', { message: 'BBPS Awaited Status Processor completed' });
        return 'AWAITED status check completed successfully.';
    } catch (error) {
        customLog(null, 'error', {
            message: 'Unhandled error in bbpsAwaitedStatus scheduler',
            error: error.message,
        });
        return 'Internal server error in bbpsAwaitedStatus scheduler.';
    }
};
