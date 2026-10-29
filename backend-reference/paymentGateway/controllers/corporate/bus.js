const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const { puppeteerPdfBufferGenerator } = require('../../utils/puppeteer');
const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const { customLog } = require('../../utils/loggerHelper');
const { fetchServiceDetails, calculateSurchargeWithTax } = require('../../utils/checkAndFetchServiceDetails');
const { createPGTransaction } = require('../../utils/paymentGatewayTransaction');
const { refundWalletTransaction, updateWalletTransaction } = require('../../utils/walletTransaction');
const { cancelPGTransaction } = require('../../utils/pgRefund');
const wallet = require('../../models/entities/wallet');
const operatorsData = require('../../utils/operatorsData.json');
const { createBusBooking } = require('../../models/use-cases/bus');
const emailer = require('../../utils/emailer');
const { createNotification } = require('../../models/use-cases/notification');
const { generateBusTicketEmail } = require('../../utils/emailTemplates/bus/busSuccessEmail');
const { busTicketPDFTemplate } = require('../../utils/emailTemplates/bus/busTicketPDF');
const { busBookingFailedTemplate } = require('../../utils/emailTemplates/bus/busFailureEmail');
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { partnerLogos } = require('../../utils/partnerLogos');
const { computeJournalData } = require('../../utils/computeJournalData');
const { publishJournalEvent } = require('../../utils/bull/queue/accountingEventsQueue');
const { generateOrderInvoiceAttachments } = require('../../services/invoiceAndReceipt');

const accessKey = operatorsData.bus.accessKey;

async function checkService(req) {
    const credentialId = req.user.id;
    const packageId = req.user.packageId;
    const corporateUserId = req.user.corporateId;
    const serviceDetails = await fetchServiceDetails({
        credentialId,
        accessKey,
        packageId,
        corporateUserId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return serviceDetails;
    }
    return {
        apiUrl: serviceDetails.vendor.apiUrl,
        consumerKey: serviceDetails.vendor.optional1,
        consumerSecret: serviceDetails.vendor.optional2,
        id: serviceDetails.id,
        commissionType: serviceDetails.commissionType,
        providerCommission: serviceDetails.providerCommission,
        cashback: serviceDetails.cashback || 0,
        cashbackType: serviceDetails.cashbackType || 'PERCENTAGE',
        surcharge: serviceDetails.surcharge,
        surchargeType: serviceDetails.surchargeType,
        fullDetails: serviceDetails,
    };
}

function generateOAuthHeader(method, url, consumerKey, consumerSecret) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');

    const [baseUrl, queryString] = url.split('?');
    const queryParams = {};
    if (queryString) {
        queryString.split('&').forEach(pair => {
            const [k, v] = pair.split('=');
            queryParams[decodeURIComponent(k)] = decodeURIComponent(v || '');
        });
    }

    const oauthParams = {
        oauth_consumer_key: consumerKey,
        oauth_nonce: nonce,
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: timestamp,
        oauth_version: '1.0',
    };

    const allParams = { ...queryParams, ...oauthParams };

    const sortedParams = Object.keys(allParams)
        .sort()
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
        .join('&');

    const baseString = [
        method.toUpperCase(),
        encodeURIComponent(baseUrl),
        encodeURIComponent(sortedParams),
    ].join('&');

    const signingKey = `${encodeURIComponent(consumerSecret)}&`;
    const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');

    oauthParams.oauth_signature = signature;

    const authHeader = 'OAuth ' + Object.keys(oauthParams)
        .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
        .join(', ');

    return { Authorization: authHeader };
}

exports.payment = asyncHandler(async (req, res, next) => {
    const serviceDetails = await checkService(req);
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 404));
    }

    const { blockKey, amount, pgAmount, paymentGatewayResponse, couponCode, couponAmount, contactEmail } = req.body;
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const name = req.user.name;
    const emailId = req.user.email;

    const templateDetails = req.user.registeredBy
        ? await fetchPartnerDetails(req.user.registeredBy)
        : await partnerLogos();

    const corporateTxnId = req.body.corporateTxnId
        ? req.body.corporateTxnId.toString()
        : new Date().valueOf().toString();
    const providerId = corporateTxnId;

    const surchargeDetails = await calculateSurchargeWithTax(
        serviceDetails.surcharge,
        serviceDetails.surchargeType,
        amount,
        credentialId
    );
    const surcharge = surchargeDetails.surcharge;

    const pgResponse = Array.isArray(paymentGatewayResponse)
        ? paymentGatewayResponse[0]
        : paymentGatewayResponse;
    const reportData = await computeJournalData({
        serviceDetails: serviceDetails.fullDetails,
        pgAmount: paymentGatewayResponse ? Number(pgAmount || 0) : 0,
        amount: Number(amount),
        paymentMethod: pgResponse?.payment_method || {},
        partnerDetails: templateDetails,
        paymentGatewayName: pgResponse?.paymentGatewayName || 'Cashfree',
        couponTotalDiscount: req.body.couponTotalDiscount,
        corporateState: req.user.state || '',
        credentialId,
    });
    const publishJournal = (type) =>
        publishJournalEvent(
            {
                transactionRef: corporateTxnId,
                type,
                contextSnapshot: {
                    credentialId,
                    vendor: serviceDetails.fullDetails.vendor || null,
                    registeredBy: req?.user?.registeredBy || null,
                },
                reportData,
            },
            req?.LogTraceId
        );

    const commonParams = {
        providerId,
        corporateTxnId,
        credentialId,
        serviceOperatorId: serviceDetails.id,
        corporateCashback: serviceDetails.cashback,
        transactionCategory: 'Travel',
        orderAmount: amount,
        commissionType: serviceDetails.commissionType,
        cashbackType: serviceDetails.cashbackType,
        providerCommission: serviceDetails.providerCommission,
        surcharge,
        reportData,
    };

    let transactionResponse;
    try {
        // Step 1: deduct via payment gateway (+ wallet top-up if pgAmount < total)
        // include couponAmount if provided so transaction logic can persist/use it
        transactionResponse = await createPGTransaction({
            ...commonParams,
            pgAmount,
            pgResponse: paymentGatewayResponse,
            couponCode,
            couponAmount,
            corporateUserId,
            partnerId: req.user.registeredBy,
            accessKey,
        });

        if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
            return next(new ErrorResponse(transactionResponse['error'], 400));
        }

        publishJournal('payment');

        // Step 2: book with vendor
        const url = `${serviceDetails.apiUrl}/bookticket?blockKey=${blockKey}`;
        const config = {
            method: 'post',
            url,
            headers: generateOAuthHeader('POST', url, serviceDetails.consumerKey, serviceDetails.consumerSecret),
            timeout: 30000,
        };

        customLog(req?.LogTraceId, 'info', { message: '[pg-bus:bookTicket] request', blockKey }, 'VENDOR');
        const result = await axios(config);
        const tin = result?.data ?? '';
        customLog(req?.LogTraceId, 'info', {
            message: '[pg-bus:bookTicket] response',
            statusCode: result?.status,
            tin,
        }, 'VENDOR');

        // Step 3: fetch full ticket details using TIN
        let ticketDetails = null;
        if (tin) {
            try {
                const ticketUrl = `${serviceDetails.apiUrl}/ticket?tin=${tin}`;
                const ticketConfig = {
                    method: 'get',
                    url: ticketUrl,
                    headers: generateOAuthHeader('GET', ticketUrl, serviceDetails.consumerKey, serviceDetails.consumerSecret),
                    timeout: 30000,
                };
                customLog(req?.LogTraceId, 'info', { message: '[pg-bus:getTicket] request', tin }, 'VENDOR');
                const ticketResult = await axios(ticketConfig);
                ticketDetails = ticketResult?.data;
                customLog(req?.LogTraceId, 'info', { message: '[pg-bus:getTicket] response', statusCode: ticketResult?.status }, 'VENDOR');
            } catch (ticketErr) {
                customLog(req?.LogTraceId, 'error', { message: '[pg-bus:getTicket] failed', data: ticketErr?.message });
            }
        }

        // Step 4: mark transaction success
        await updateWalletTransaction({
            corporateTxnId,
            providerId: tin || 'N/A',
            status: 'SUCCESS',
            orderResponse: JSON.stringify(ticketDetails || { tin }),
            message: 'Payment Successful',
        });

        // Step 5: store booking in DB
        await createBusBooking({
            ticketDetails,
            transactionResponse,
            req,
            contactEmail,
        });

        const couponDiscount = transactionResponse.couponDiscount ?? 0;
        const invoiceAttachments = await generateOrderInvoiceAttachments({
            amount,
            surcharge,
            couponDiscount,
            corporateTxnId,
            orderId: transactionResponse?.orderId,
            paymentType: 'Bus Ticket',
            credentialId,
            pgAmount: paymentGatewayResponse ? pgAmount : null,
            paymentMethod: pgResponse?.payment_method,
            vendor: serviceDetails.fullDetails.vendor,
            commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
            commissionMode: reportData?.journalData?.commissionMode || 'MARGIN',
            traceId: req?.LogTraceId,
        });

        // Step 6: send success notification + email with PDF ticket
        createNotification({
            notificationTitle: 'Bus Ticket - Payment Successful',
            notificationBrief: `The payment of ₹ ${parseFloat(pgAmount ?? amount).toFixed(2)} for Bus Ticket with transaction ID ${corporateTxnId} was successful`,
            notificationTo: [req.user.username],
            notificationCategory: 'CORPORATE',
            notificationBy: 'ADMIN',
        });

        const invItems = ticketDetails?.inventoryItems;
        const primaryPassenger = Array.isArray(invItems) ? invItems[0]?.passenger : invItems?.passenger;
        const passengerEmail = contactEmail || primaryPassenger?.email || emailId;
        const emailSource = contactEmail ? 'contactEmail(payload)' : primaryPassenger?.email ? 'passenger(vendor)' : 'user(jwt)';
        customLog(req?.LogTraceId, 'info', { message: '[pg-bus:payment] email recipient resolved', to: passengerEmail, source: emailSource });
        const passengerName = primaryPassenger?.name || name;
        const corporateEmail = req.user.email;

        if (ticketDetails) {
            const pdfId = ticketDetails.tin || corporateTxnId;
            const pdfFile = `${pdfId}.pdf`;
            const html = busTicketPDFTemplate(ticketDetails, templateDetails, { corporateTxnId, platformFee: surcharge });
            const emailBody = generateBusTicketEmail({ ticketDetails, passengerName, platformFee: surcharge, couponCode, couponDiscount });

            const dojDate = ticketDetails.doj ? new Date(ticketDetails.doj).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
            const busEmailSubject = `Bus Ticket: Booking Confirmation - ${ticketDetails.sourceCity || ''} > ${ticketDetails.destinationCity || ''} - ${dojDate}`;

            let corporateCopySent = false;
            const sendCorporateCopy = (ticketFiles) => {
                if (corporateCopySent || !corporateEmail) return;
                corporateCopySent = true;
                emailer.emailWithMultipleAttachment(corporateEmail, busEmailSubject, emailBody, [...ticketFiles, ...invoiceAttachments], null, (corporateMailErr) => {
                    if (corporateMailErr) customLog(req?.LogTraceId, 'error', { message: '[pg-bus:payment] email with invoice to corporate failed', data: corporateMailErr?.message, to: corporateEmail });
                    else customLog(req?.LogTraceId, 'info', { message: '[pg-bus:payment] email with invoice sent to corporate', to: corporateEmail });
                });
            };

            puppeteerPdfBufferGenerator({ html, options: { timeout: 180000, imageTimeout: 45000 } }).then(async ({ status, buffer, message: pdfErrorMessage }) => {
                const receiptPdf = invoiceAttachments.find((file) => file.filename?.startsWith('Receipt-'));

                if (status && buffer) {
                    try {
                        await fs.promises.writeFile(pdfFile, buffer);
                        sendCorporateCopy([{ filename: pdfFile, content: buffer }]);
                        const allAttachments = [{ filename: pdfFile, path: pdfFile }, receiptPdf].filter(Boolean);
                        emailer.emailWithMultipleAttachment(passengerEmail, busEmailSubject, emailBody, allAttachments, null, (emailErr) => {
                            if (emailErr) {
                                customLog(req?.LogTraceId, 'error', { message: '[pg-bus:payment] email with attachment failed, sending without attachment', data: emailErr?.message, to: passengerEmail });
                                emailer.email({ to: passengerEmail, subject: busEmailSubject, body: emailBody }, (fallbackErr) => {
                                    if (fallbackErr) customLog(req?.LogTraceId, 'error', { message: '[pg-bus:payment] fallback email (no attachment) also failed', data: fallbackErr?.message, to: passengerEmail });
                                    else customLog(req?.LogTraceId, 'info', { message: '[pg-bus:payment] fallback email sent (no attachment)', to: passengerEmail });
                                });
                            } else {
                                customLog(req?.LogTraceId, 'info', { message: '[pg-bus:payment] email with PDF attachment sent', to: passengerEmail });
                            }
                            fs.unlink(pdfFile, () => {});
                        });
                    } catch (writeErr) {
                        customLog(req?.LogTraceId, 'error', { message: '[pg-bus:payment] PDF write failed, sending email without attachment', data: writeErr?.message, to: passengerEmail });
                        sendCorporateCopy([{ filename: pdfFile, content: buffer }]);
                        emailer.email({ to: passengerEmail, subject: busEmailSubject, body: emailBody }, (err) => {
                            if (err) customLog(req?.LogTraceId, 'error', { message: '[pg-bus:payment] fallback email (PDF write fail) failed', data: err?.message, to: passengerEmail });
                            else customLog(req?.LogTraceId, 'info', { message: '[pg-bus:payment] fallback email sent (PDF write fail)', to: passengerEmail });
                        });
                    }
                } else {
                    customLog(req?.LogTraceId, 'error', { message: '[pg-bus:payment] PDF generation failed, sending email without attachment', reason: pdfErrorMessage, to: passengerEmail });
                    sendCorporateCopy([]);
                    emailer.email({ to: passengerEmail, subject: busEmailSubject, body: emailBody }, (err) => {
                        if (err) customLog(req?.LogTraceId, 'error', { message: '[pg-bus:payment] fallback email (PDF timeout) failed', data: err?.message, to: passengerEmail });
                        else customLog(req?.LogTraceId, 'info', { message: '[pg-bus:payment] fallback email sent (PDF timeout)', to: passengerEmail });
                    });
                }
            }).catch((pdfEmailErr) => {
                customLog(req?.LogTraceId, 'error', { message: '[pg-bus:payment] PDF pipeline error, sending email without attachment', data: pdfEmailErr?.message, to: passengerEmail });
                sendCorporateCopy([]);
                emailer.email({ to: passengerEmail, subject: busEmailSubject, body: emailBody }, (err) => {
                    if (err) customLog(req?.LogTraceId, 'error', { message: '[pg-bus:payment] fallback email (pipeline error) failed', data: err?.message, to: passengerEmail });
                    else customLog(req?.LogTraceId, 'info', { message: '[pg-bus:payment] fallback email sent (pipeline error)', to: passengerEmail });
                });
            });
        }

        const walletDetails = await wallet.findOne({
            where: { credentialId },
            attributes: ['balance'],
        });

        return res.status(200).json({
            status: true,
            message: 'Ticket booked successfully!',
            responseCode: '000',
            data: {
                ...transactionResponse,
                corporateTxnId,
                corporateFinalBalance: walletDetails?.balance,
                booking: ticketDetails || { tin },
            },
        });
    } catch (error) {
        if (error?.response?.data) {
            customLog(req?.LogTraceId, 'error', { message: '[pg-bus:bookTicket] failed', response: error?.response?.data, errorStack: error?.stack });
        } else {
            customLog(req?.LogTraceId, 'error', { message: '[pg-bus:bookTicket] failed', data: error?.message, errorStack: error?.stack });
        }

        // Step 4: refund on vendor failure
        if (transactionResponse && !Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
            try {
                await cancelPGTransaction(corporateTxnId);
            } catch (pgErr) {
                customLog(req?.LogTraceId, 'error', { message: '[pg-bus:bookTicket] PG cancel failed', data: pgErr?.message });
            }
            await refundWalletTransaction({
                corporateTxnId,
                providerId: 'Not Available',
                status: 'FAILURE',
                message: 'Bus ticket booking failed',
                registeredById: req.user.registeredBy,
            });
            publishJournal('refund');
        }

        // send failure notification + email
        createNotification({
            notificationTitle: 'Payment Failed',
            notificationBrief: `The payment of ₹ ${(parseFloat(amount) + parseFloat(surcharge)).toFixed(2)} for Bus Ticket with transaction ID ${corporateTxnId} was Failed`,
            notificationTo: [req.user.username],
            notificationCategory: 'CORPORATE',
            notificationBy: 'ADMIN',
        });

        const failureEmailBody = busBookingFailedTemplate(name, templateDetails);
        emailer.email({ to: emailId, subject: 'Payment Failed', body: failureEmailBody }, function () {
            customLog(req?.LogTraceId, 'info', { message: '[pg-bus:payment] failure email sent to ' + emailId });
        });

        next(new ErrorResponse('Something went wrong while booking ticket', 500));
    }
});
