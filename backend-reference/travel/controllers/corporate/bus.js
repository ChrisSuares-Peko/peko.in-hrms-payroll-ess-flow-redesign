const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const puppeteer = require('puppeteer');
const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const { customLog } = require('../../utils/loggerHelper');
const { fetchServiceDetails, calculateSurchargeWithTax } = require('../../utils/checkAndFetchServiceDetails');
const { createWalletTransaction, refundWalletTransaction, updateWalletTransaction } = require('../../utils/walletTransaction');
const wallet = require('../../models/entities/wallet');
const operatorsData = require('../../utils/operatorsData.json');
const { busTicketTemplate } = require('../../utils/emailTemplates/bus/busTicket');
const { findOneOrderByTxnId } = require('../../models/use-cases/order');

// A bus order is only returned to the account that booked it (same scope as the bookings list).
const isOwnOrder = (req, order) => !!order && String(order.credentialId) === String(req.user.id);
const { createBusBooking } = require('../../models/use-cases/bus');
const emailer = require('../../utils/emailer');
const { createNotification } = require('../../models/use-cases/notification');
const { busBookingFailedTemplate } = require('../../utils/emailTemplates/bus/busFailureEmail');
const { generateBusTicketEmail } = require('../../utils/emailTemplates/bus/busSuccessEmail');
const { generateBusCancellationEmail } = require('../../utils/emailTemplates/bus/busCancellationEmail');
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { partnerLogos } = require('../../utils/partnerLogos');
const { getValue, setValue } = require('../../utils/cacheDataMethods');
const { computeJournalData } = require('../../utils/computeJournalData');
const { publishJournalEvent } = require('../../utils/bull/queue/accountingEventsQueue');
const { generateOrderInvoiceAttachments } = require('../../services/invoiceAndReceipt');

const accessKey = operatorsData.bus.accessKey;

const TRIP_FARES_TTL_SECONDS = 60 * 60;
const BLOCK_RECORD_TTL_SECONDS = 30 * 60;

const tripFaresKey = (tripId, bpId, dpId) => (bpId && dpId
    ? `${accessKey}-trip-${tripId}-${bpId}-${dpId}-fares`
    : `${accessKey}-trip-${tripId}-fares`);
const blockAmountKey = (blockKey) => `${accessKey}-${blockKey}-paymentAmount`;

const roundFare = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const seatFaresFrom = (tripDetails) => {
    const rawSeats = tripDetails?.seats;
    const seats = Array.isArray(rawSeats) ? rawSeats : (rawSeats ? [rawSeats] : []);
    return seats.reduce((fares, seat) => {
        const fare = roundFare(seat?.fare);
        if (!seat?.name || !Number.isFinite(fare) || fare <= 0) return fares;
        return { ...fares, [seat.name]: Math.max(fares[seat.name] || 0, fare) };
    }, {});
};

const readJson = (value) => {
    try {
        return value ? JSON.parse(value) : null;
    } catch (_e) {
        return null;
    }
};

async function inlineLogoForPdf(templateDetails) {
    if (!templateDetails?.logo || !templateDetails.logo.startsWith('http')) return templateDetails;
    try {
        const response = await axios.get(templateDetails.logo, { responseType: 'arraybuffer', timeout: 5000 });
        const base64 = Buffer.from(response.data).toString('base64');
        const mimeType = response.headers['content-type'] || 'image/png';
        return { ...templateDetails, logo: `data:${mimeType};base64,${base64}` };
    } catch (_e) {
        console.error('[inlineLogoForPdf] failed to fetch logo:', templateDetails.logo, _e.message);
        return templateDetails;
    }
}

const minutesToTime = (minutes) => {
    if (!minutes) return 'N/A';
    const total = parseInt(minutes);
    const normalized = total % 1440;
    const h = Math.floor(normalized / 60);
    const m = normalized % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
};

const minutesToDayLabel = (dojStr, minutesStr) => {
    if (!dojStr) return '';
    const total = parseInt(minutesStr || 0);
    const daysOffset = Math.floor(total / 1440);
    const d = new Date(dojStr);
    d.setDate(d.getDate() + daysOffset);
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};

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

exports.getCities = asyncHandler(async (req, res, next) => {
    try {
        const serviceDetails = await checkService(req);
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 404));
        }

        const url = `${serviceDetails.apiUrl}/rest/v1.1/cities`;
        const config = {
            method: 'get',
            url,
            headers: generateOAuthHeader('GET', url, serviceDetails.consumerKey, serviceDetails.consumerSecret),
            timeout: 30000,
        };

        customLog(req?.LogTraceId, 'info', { message: '[bus:getCities] request' }, 'VENDOR');
        const result = await axios(config);

        customLog(req?.LogTraceId, 'info', {
            message: '[bus:getCities] response',
            statusCode: result?.status,
            count: Array.isArray(result?.data) ? result.data.length : 0,
        }, 'VENDOR');

        return res.status(200).json({
            status: true,
            message: 'Cities fetched successfully!',
            responseCode: '000',
            data: result.data,
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: '[bus:getCities] failed', data: error?.message, errorStack: error?.stack });
        next(new ErrorResponse('Something went wrong while fetching cities', 500));
    }
});

exports.searchBuses = asyncHandler(async (req, res, next) => {
    try {
        const serviceDetails = await checkService(req);
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 404));
        }

        const { source, destination, doj } = req.query;
        const url = `${serviceDetails.apiUrl}/availabletrips?source=${source}&destination=${destination}&doj=${doj}`;
        const config = {
            method: 'get',
            url,
            headers: generateOAuthHeader('GET', url, serviceDetails.consumerKey, serviceDetails.consumerSecret),
            timeout: 30000,
        };

        customLog(req?.LogTraceId, 'info', { message: '[bus:searchBuses] request', source, destination, doj }, 'VENDOR');
        const result = await axios(config);

        customLog(req?.LogTraceId, 'info', {
            message: '[bus:searchBuses] response',
            statusCode: result?.status,
            count: Array.isArray(result?.data?.availableTrips) ? result.data.availableTrips.length : 0,
        }, 'VENDOR');

        return res.status(200).json({
            status: true,
            message: 'Buses fetched successfully!',
            responseCode: '000',
            data: result.data,
        });
    } catch (error) {
        if (error?.response?.data) {
            customLog(req?.LogTraceId, 'error', { message: '[bus:searchBuses] failed', response: error?.response?.data, errorStack: error?.stack });
        } else {
            customLog(req?.LogTraceId, 'error', { message: '[bus:searchBuses] failed', data: error?.message, errorStack: error?.stack });
        }
        next(new ErrorResponse('Something went wrong while searching buses', 500));
    }
});

exports.blockTicket = asyncHandler(async (req, res, next) => {
    try {
        const serviceDetails = await checkService(req);
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 404));
        }

        const { availableTripId, boardingPointId, droppingPointId } = req.body || {};
        const inventoryItems = Array.isArray(req.body?.inventoryItems) ? req.body.inventoryItems : [];
        if (!availableTripId || inventoryItems.length === 0) {
            return next(new ErrorResponse('Please select your seats again.', 400));
        }

        const recordedFares = readJson(await getValue(tripFaresKey(availableTripId, boardingPointId, droppingPointId)))
            || readJson(await getValue(tripFaresKey(availableTripId)));
        if (!recordedFares) {
            customLog(req?.LogTraceId, 'error', { action: 'bus:blockFaresMissing', availableTripId, boardingPointId, droppingPointId });
            return next(new ErrorResponse('Your seat selection has expired. Please select your seats again.', 400));
        }

        let blockFare = 0;
        for (const item of inventoryItems) {
            const recordedFare = recordedFares[item?.seatName];
            if (!recordedFare || roundFare(item?.fare) !== recordedFare) {
                customLog(req?.LogTraceId, 'error', {
                    action: 'bus:blockFareMismatch',
                    availableTripId,
                    seatName: item?.seatName,
                    offeredFare: item?.fare,
                    recordedFare,
                });
                return next(new ErrorResponse('Seat fares have changed. Please select your seats again.', 400));
            }
            blockFare += recordedFare;
        }

        const url = `${serviceDetails.apiUrl}/rest/v1.1/blockTicket`;
        const config = {
            method: 'post',
            url,
            headers: {
                ...generateOAuthHeader('POST', url, serviceDetails.consumerKey, serviceDetails.consumerSecret),
                'Content-Type': 'application/json',
            },
            data: req.body,
            timeout: 30000,
        };

        customLog(req?.LogTraceId, 'info', { message: '[bus:blockTicket] request', availableTripId }, 'VENDOR');
        const result = await axios(config);

        customLog(req?.LogTraceId, 'info', {
            message: '[bus:blockTicket] response',
            blockKey: result?.data,
        }, 'VENDOR');

        const blockKey = typeof result?.data === 'string' ? result.data : result?.data?.blockKey;
        if (blockKey) {
            await setValue(blockAmountKey(blockKey), BLOCK_RECORD_TTL_SECONDS, String(roundFare(blockFare)));
        }

        return res.status(200).json({
            status: true,
            message: 'Ticket blocked successfully!',
            responseCode: '000',
            data: result.data,
        });
    } catch (error) {
        if (error?.response?.data) {
            customLog(req?.LogTraceId, 'error', { message: '[bus:blockTicket] failed', response: error?.response?.data, errorStack: error?.stack });
        } else {
            customLog(req?.LogTraceId, 'error', { message: '[bus:blockTicket] failed', data: error?.message, errorStack: error?.stack });
        }
        const vendorErrorCode = error?.response?.data?.errorCode;
        const userMessage = vendorErrorCode === 'IS01'
            ? 'This seat is no longer available. Please go back and select a different seat.'
            : 'Something went wrong. Please try again later.';
        next(new ErrorResponse(userMessage, 400));
    }
});

exports.bookTicket = asyncHandler(async (req, res, next) => {
    const serviceDetails = await checkService(req);
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 404));
    }

    const { blockKey, amount, contactEmail, couponCode, pgAmount } = req.body;
    // A zero, negative or non-numeric amount would turn the wallet debit into a credit.
    const numericAmount = Number(amount);
    if (amount === undefined || amount === null || amount === '' || !Number.isFinite(numericAmount) || numericAmount <= 0) {
        return next(new ErrorResponse('Invalid amount', 400));
    }
    const credentialId = req.user.id;
    const corporateTxnId = new Date().valueOf().toString();
    const providerId = corporateTxnId;
    const name = req.user.name;
    const emailId = contactEmail || req.user.email;

    const templateDetails = req.user.registeredBy
        ? await fetchPartnerDetails(req.user.registeredBy)
        : await partnerLogos();


    const surchargeDetails = await calculateSurchargeWithTax(
        serviceDetails.surcharge,
        serviceDetails.surchargeType,
        amount,
        credentialId
    );
    const surcharge = surchargeDetails.surcharge;

    const reportData = await computeJournalData({
        serviceDetails: serviceDetails.fullDetails,
        amount: Number(amount),
        paymentMethod: 'WALLET',
        partnerDetails: templateDetails,
        paymentGatewayName: 'WALLET',
        couponTotalDiscount: req.body.couponTotalDiscount,
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
                    vendor: serviceDetails.fullDetails.vendor || null,
                    registeredBy: req.user.registeredBy || null,
                },
                reportData,
            },
            req?.LogTraceId
        );

    let transactionResponse;
    try {
        // Step 1: deduct from wallet
        transactionResponse = await createWalletTransaction({
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
            amount,
            reportData,
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

        customLog(req?.LogTraceId, 'info', { message: '[bus:bookTicket] request', blockKey }, 'VENDOR');
        const result = await axios(config);
        const tin = result?.data ?? '';
        customLog(req?.LogTraceId, 'info', {
            message: '[bus:bookTicket] response',
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
                customLog(req?.LogTraceId, 'info', { message: '[bus:getTicket] request', tin }, 'VENDOR');
                const ticketResult = await axios(ticketConfig);
                ticketDetails = ticketResult?.data;
                customLog(req?.LogTraceId, 'info', { message: '[bus:getTicket] response', statusCode: ticketResult?.status }, 'VENDOR');
            } catch (ticketErr) {
                customLog(req?.LogTraceId, 'error', { message: '[bus:getTicket] failed', data: ticketErr?.message });
            }
        }

        // Step 4: mark wallet transaction success
        await updateWalletTransaction({
            corporateTxnId,
            providerId: tin || 'N/A',
            status: 'SUCCESS',
            orderResponse: JSON.stringify(ticketDetails || { tin }),
            message: 'Payment Successful',
            ...(pgAmount && { paymentModeResponse: JSON.stringify({ pgAmount, couponCode: couponCode || '' }) }),
        });

        // Step 5: store booking in DB
        await createBusBooking({
            ticketDetails,
            transactionResponse,
            req,
            contactEmail: emailId,
        });

        const couponDiscount = (couponCode && pgAmount)
            ? Math.max(0, parseFloat(amount) - parseFloat(pgAmount))
            : 0;
        const invoiceAttachments = await generateOrderInvoiceAttachments({
            amount,
            surcharge,
            couponDiscount,
            corporateTxnId,
            orderId: transactionResponse?.orderId,
            paymentType: 'Bus Ticket',
            credentialId,
            vendor: serviceDetails.fullDetails.vendor,
            commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
            commissionMode: reportData?.journalData?.commissionMode || 'MARGIN',
            traceId: req?.LogTraceId,
        });

        // Step 6: send success notification + email with PDF ticket
        createNotification({
            notificationTitle: 'Bus Ticket - Payment Successful',
            notificationBrief: `The payment of ₹ ${(parseFloat(amount) + parseFloat(surcharge)).toFixed(2)} for Bus Ticket with transaction ID ${corporateTxnId} was successful`,
            notificationTo: [req.user.username],
            notificationCategory: 'CORPORATE',
            notificationBy: 'ADMIN',
        });

        const invItems = ticketDetails?.inventoryItems;
        const primaryPassenger = Array.isArray(invItems) ? invItems[0]?.passenger : invItems?.passenger;
        const passengerEmail = primaryPassenger?.email || emailId;
        const passengerName = primaryPassenger?.name || name;
        const corporateEmail = req.user.email;

        if (ticketDetails) {
            const pdfId = ticketDetails.tin || corporateTxnId;
            const pdfFile = `${pdfId}.pdf`;

            (async () => {
                try {
                    const items = Array.isArray(ticketDetails.inventoryItems)
                        ? ticketDetails.inventoryItems
                        : (ticketDetails.inventoryItems ? [ticketDetails.inventoryItems] : []);

                    const pickupMins = ticketDetails.pickupTime;
                    const dropMins = ticketDetails.dropTime;
                    const durationMins = parseInt(dropMins || 0) - parseInt(pickupMins || 0);
                    const absDuration = durationMins < 0 ? durationMins + 1440 : durationMins;

                    const bookingData = {
                        tin: ticketDetails.tin || corporateTxnId,
                        pnr: ticketDetails.pnr || '',
                        corporateTxnId,
                        amountInINR: amount,
                        couponCode: couponCode || '',
                        couponDiscount,
                        transactionDate: new Date(),
                        busType: ticketDetails.busType || '',
                        fareDetails: {
                            baseFare: items.reduce((s, i) => s + parseFloat(i.baseFare || 0), 0),
                            platformFee: surcharge,
                            serviceTax: items.reduce((s, i) => s + parseFloat(i.serviceTax || 0), 0),
                        },
                        tripDetails: {
                            source: ticketDetails.sourceCity || 'N/A',
                            destination: ticketDetails.destinationCity || 'N/A',
                            operatorName: ticketDetails.travels || 'N/A',
                            departureTime: minutesToTime(pickupMins),
                            arrivalTime: minutesToTime(dropMins),
                            departureDate: minutesToDayLabel(ticketDetails.doj, pickupMins),
                            arrivalDate: minutesToDayLabel(ticketDetails.doj, dropMins),
                            duration: `${Math.floor(absDuration / 60)}h ${absDuration % 60}m`,
                            doj: ticketDetails.doj || 'N/A',
                            boardingPoint: ticketDetails.boardingPointDetails?.address || '',
                            droppingPoint: ticketDetails.droppingPointDetails?.address || '',
                            passengers: items.map(i => ({
                                name: i.passenger?.name || 'N/A',
                                gender: i.passenger?.gender || '',
                                age: i.passenger?.age || '',
                            })),
                            seats: items.map(i => i.seatName || 'N/A'),
                            contactEmail: emailId,
                        },
                    };

                    const pdfTemplateDetails = await inlineLogoForPdf(templateDetails);
                    const html = busTicketTemplate(bookingData, pdfTemplateDetails);
                    customLog(req?.LogTraceId, 'info', { message: '[bus:bookTicket] generating PDF via puppeteer', pdfId });

                    const { isValidPdf, buffer } = await generateBusTicketPdf(html, req?.LogTraceId);
                    if (!isValidPdf || !buffer) {
                        customLog(req?.LogTraceId, 'error', { message: '[bus:bookTicket] PDF generation failed' });
                        return;
                    }

                    await fs.promises.writeFile(pdfFile, buffer);
                    customLog(req?.LogTraceId, 'info', { message: '[bus:bookTicket] PDF written, sending email', to: passengerEmail });

                    const emailBody = generateBusTicketEmail({ ticketDetails, passengerName, platformFee: surcharge, couponCode, couponDiscount, templateDetails });
                    if (corporateEmail) {
                        emailer.emailWithMultipleAttachment(corporateEmail, 'Payment Successful - Bus Ticket', emailBody, [{ filename: pdfFile, content: buffer }, ...invoiceAttachments], (corporateMailErr) => {
                            if (corporateMailErr) customLog(req?.LogTraceId, 'error', { message: '[bus:bookTicket] email with invoice to corporate failed', data: corporateMailErr?.message });
                            else customLog(req?.LogTraceId, 'info', { message: '[bus:bookTicket] email with invoice sent to corporate', to: corporateEmail });
                        });
                    }
                    emailer.emailWithAttachment(passengerEmail, 'Payment Successful - Bus Ticket', emailBody, pdfFile, pdfFile, (emailErr) => {
                        if (emailErr) {
                            customLog(req?.LogTraceId, 'error', { message: '[bus:bookTicket] success email failed', data: emailErr?.message });
                        } else {
                            customLog(req?.LogTraceId, 'info', { message: '[bus:bookTicket] success email sent to ' + passengerEmail });
                        }
                        fs.unlink(pdfFile, () => {});
                    });
                } catch (pdfEmailErr) {
                    customLog(req?.LogTraceId, 'error', { message: '[bus:bookTicket] PDF/email pipeline failed', data: pdfEmailErr?.message, errorStack: pdfEmailErr?.stack });
                }
            })();
        } else {
            customLog(req?.LogTraceId, 'warn', { message: '[bus:bookTicket] ticketDetails is null, skipping email' });
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
            customLog(req?.LogTraceId, 'error', { message: '[bus:bookTicket] failed', response: error?.response?.data, errorStack: error?.stack });
        } else {
            customLog(req?.LogTraceId, 'error', { message: '[bus:bookTicket] failed', data: error?.message, errorStack: error?.stack });
        }

        // refund wallet on vendor failure
        if (transactionResponse && !Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
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
            notificationBrief: `The payment of ₹ ${parseFloat(amount).toFixed(2)} for Bus Ticket with transaction ID ${corporateTxnId} was Failed`,
            notificationTo: [req.user.username],
            notificationCategory: 'CORPORATE',
            notificationBy: 'ADMIN',
        });

        const failureEmailBody = busBookingFailedTemplate(name, templateDetails);
        emailer.email(emailId, 'Payment Failed', failureEmailBody, function () {
            customLog(req?.LogTraceId, 'info', { message: '[bus:bookTicket] failure email sent to ' + emailId });
        });

        next(new ErrorResponse('Something went wrong while booking ticket', 500));
    }
});

exports.getTripDetails = asyncHandler(async (req, res, next) => {
    try {
        const serviceDetails = await checkService(req);
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 404));
        }

        const { id, bpId, dpId } = req.query;
        if (!id) return next(new ErrorResponse('Trip id is required', 400));

        const isV2 = !!(bpId && dpId);
        let config;

        if (isV2) {
            const url = `${serviceDetails.apiUrl}/tripdetailsV2`;
            config = {
                method: 'post',
                url,
                headers: {
                    ...generateOAuthHeader('POST', url, serviceDetails.consumerKey, serviceDetails.consumerSecret),
                    'Content-Type': 'application/json',
                },
                data: { inventoryId: id, bpId, dpId },
                timeout: 30000,
            };
        } else {
            const url = `${serviceDetails.apiUrl}/tripdetails?id=${id}`;
            config = {
                method: 'get',
                url,
                headers: generateOAuthHeader('GET', url, serviceDetails.consumerKey, serviceDetails.consumerSecret),
                timeout: 30000,
            };
        }

        customLog(req?.LogTraceId, 'info', { message: '[bus:getTripDetails] request', id, bpId, dpId, isV2 }, 'VENDOR');
        const result = await axios(config);
        customLog(req?.LogTraceId, 'info', {
            message: '[bus:getTripDetails] response',
            statusCode: result?.status,
        }, 'VENDOR');

        const seatFares = seatFaresFrom(result?.data);
        if (Object.keys(seatFares).length > 0) {
            try {
                await setValue(tripFaresKey(id, isV2 ? bpId : undefined, isV2 ? dpId : undefined), TRIP_FARES_TTL_SECONDS, seatFares);
            } catch (cacheError) {
                customLog(req?.LogTraceId, 'error', { action: 'bus:tripFaresNotRecorded', id, bpId, dpId, data: cacheError?.message });
            }
        }

        return res.status(200).json({
            status: true,
            message: 'Trip details fetched successfully!',
            responseCode: '000',
            data: result.data,
        });
    } catch (error) {
        if (error?.response?.data) {
            customLog(req?.LogTraceId, 'error', { message: '[bus:getTripDetails] failed', response: error?.response?.data, errorStack: error?.stack });
        } else {
            customLog(req?.LogTraceId, 'error', { message: '[bus:getTripDetails] failed', data: error?.message, errorStack: error?.stack });
        }
        next(new ErrorResponse('Something went wrong while fetching trip details', 500));
    }
});

exports.getBoardingPoints = asyncHandler(async (req, res, next) => {
    try {
        const serviceDetails = await checkService(req);
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 404));
        }

        const { id, tripId } = req.query;
        if (!id || !tripId) return next(new ErrorResponse('id and tripId are required', 400));

        const url = `${serviceDetails.apiUrl}/boardingPoint?id=${id}&tripId=${tripId}`;
        const config = {
            method: 'get',
            url,
            headers: generateOAuthHeader('GET', url, serviceDetails.consumerKey, serviceDetails.consumerSecret),
            timeout: 30000,
        };

        customLog(req?.LogTraceId, 'info', { message: '[bus:getBoardingPoints] request', id, tripId }, 'VENDOR');
        const result = await axios(config);

        customLog(req?.LogTraceId, 'info', {
            message: '[bus:getBoardingPoints] response',
            statusCode: result?.status,
        }, 'VENDOR');

        return res.status(200).json({
            status: true,
            message: 'Boarding points fetched successfully!',
            responseCode: '000',
            data: result.data,
        });
    } catch (error) {
        if (error?.response?.data) {
            customLog(req?.LogTraceId, 'error', { message: '[bus:getBoardingPoints] failed', response: error?.response?.data, errorStack: error?.stack });
        } else {
            customLog(req?.LogTraceId, 'error', { message: '[bus:getBoardingPoints] failed', data: error?.message, errorStack: error?.stack });
        }
        next(new ErrorResponse('Something went wrong while fetching boarding points', 500));
    }
});

exports.listBookings = asyncHandler(async (req, res, next) => {
    try {
        const serviceDetails = await checkService(req);
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 404));
        }

        const credentialId = req.user.id;
        const serviceOperatorId = serviceDetails.id;
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const subCorporateUserId = req.user.subCorporateId || null;

        const type = req.query.type === 'past' ? 'past' : 'upcoming';
        const { fetchBusBookings } = require('../../models/use-cases/order');
        const { count, rows } = await fetchBusBookings({ credentialId, serviceOperatorId, limit, page, subCorporateUserId, type });

        const bookings = rows.map(booking => {
            let tin = booking.providerId && booking.providerId !== 'N/A' ? booking.providerId : null;
            let bookingDetails = null;
            if (booking.orderResponse) {
                try {
                    const parsed = JSON.parse(booking.orderResponse);
                    if (typeof parsed === 'string') {
                        tin = tin || parsed;
                    } else if (parsed && typeof parsed === 'object') {
                        tin = tin || parsed.tin || null;
                        bookingDetails = parsed;
                    }
                } catch (_e) { /* unparseable orderResponse — skip */ }
            }
            return {
                id: booking.id,
                corporateTxnId: booking.corporateTxnId,
                tin,
                amount: booking.amountInINR,
                paymentMode: booking.paymentMode,
                status: booking.status,
                transactionDate: booking.transactionDate,
                bookingDetails,
            };
        });

        customLog(req?.LogTraceId, 'info', { message: '[bus:listBookings]', count, page, limit });

        return res.status(200).json({
            status: true,
            message: 'Bus bookings fetched successfully!',
            responseCode: '000',
            data: {
                bookings,
                totalCount: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit),
            },
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: '[bus:listBookings] failed', data: error?.message, errorStack: error?.stack });
        next(new ErrorResponse('Something went wrong while fetching bus bookings', 500));
    }
});

exports.getCancellationData = asyncHandler(async (req, res, next) => {
    try {
        const serviceDetails = await checkService(req);
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 404));
        }

        const { tin } = req.query;
        if (!tin) return next(new ErrorResponse('Ticket number (tin) is required', 400));

        const url = `${serviceDetails.apiUrl}/rest/v1.1/cancellationdata?tin=${tin}`;
        const config = {
            method: 'get',
            url,
            headers: generateOAuthHeader('GET', url, serviceDetails.consumerKey, serviceDetails.consumerSecret),
            timeout: 30000,
        };

        customLog(req?.LogTraceId, 'info', { message: '[bus:getCancellationData] request', tin }, 'VENDOR');
        const result = await axios(config);

        customLog(req?.LogTraceId, 'info', {
            message: '[bus:getCancellationData] response',
            statusCode: result?.status,
        }, 'VENDOR');

        return res.status(200).json({
            status: true,
            message: 'Cancellation data fetched successfully!',
            responseCode: '000',
            data: result.data,
        });
    } catch (error) {
        if (error?.response?.data) {
            customLog(req?.LogTraceId, 'error', { message: '[bus:getCancellationData] failed', response: error?.response?.data, errorStack: error?.stack });
        } else {
            customLog(req?.LogTraceId, 'error', { message: '[bus:getCancellationData] failed', data: error?.message, errorStack: error?.stack });
        }
        next(new ErrorResponse('Something went wrong while fetching cancellation data', 500));
    }
});

exports.cancelTicket = asyncHandler(async (req, res, next) => {
    const serviceDetails = await checkService(req);
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 404));
    }

    const { tin, seatsToCancel, corporateTxnId } = req.body;
    if (!tin) return next(new ErrorResponse('Ticket number (tin) is required', 400));
    if (!seatsToCancel) return next(new ErrorResponse('seatsToCancel is required', 400));
    if (!corporateTxnId) return next(new ErrorResponse('corporateTxnId is required', 400));

    // Only the owner of the booking can cancel it.
    const ownBusOrder = await findOneOrderByTxnId(corporateTxnId);
    if (!isOwnOrder(req, ownBusOrder)) return next(new ErrorResponse('Booking not found', 404));

    // const templateDetails = req.user.registeredBy
    //     ? await fetchPartnerDetails(req.user.registeredBy)
    //     : await partnerLogos();

    try {
        const preCheckUrl = `${serviceDetails.apiUrl}/rest/v1.1/cancellationdata?tin=${tin}`;
        customLog(req?.LogTraceId, 'info', { message: '[bus:cancelTicket] pre-check request', tin }, 'VENDOR');
        const preCheck = await axios({
            method: 'get',
            url: preCheckUrl,
            headers: generateOAuthHeader('GET', preCheckUrl, serviceDetails.consumerKey, serviceDetails.consumerSecret),
            timeout: 30000,
        });
        customLog(req?.LogTraceId, 'info', { message: '[bus:cancelTicket] pre-check response', cancellable: preCheck?.data?.cancellable }, 'VENDOR');
        if (!preCheck?.data?.cancellable) {
            return next(new ErrorResponse('Cancellation not allowed as per vendor cancellation policy', 400));
        }
        const url = `${serviceDetails.apiUrl}/rest/v1.1/cancelticket`;
        const config = {
            method: 'post',
            url,
            headers: {
                ...generateOAuthHeader('POST', url, serviceDetails.consumerKey, serviceDetails.consumerSecret),
                'Content-Type': 'application/json',
            },
            data: { tin, seatsToCancel },
            timeout: 30000,
        };

        customLog(req?.LogTraceId, 'info', { message: '[bus:cancelTicket] request', tin, seatsToCancel, corporateTxnId }, 'VENDOR');
        const result = await axios(config);
        customLog(req?.LogTraceId, 'info', {
            message: '[bus:cancelTicket] response',
            statusCode: result?.status,
            refundAmount: result?.data?.refundAmount,
        }, 'VENDOR');

        const refundAmount = parseFloat(result?.data?.refundAmount || 0);

        const cancelledOrder = await findOneOrderByTxnId(corporateTxnId);

        // Compute adjusted refund: vendor refund is based on full fare, but user may have
        // paid less due to coupon — cap the wallet credit at what the user actually paid.
        let adjustedRefund = refundAmount;
        if (refundAmount > 0 && cancelledOrder) {
            try {
                const pmr = JSON.parse(cancelledOrder.paymentModeResponse || '{}');
                const userPgAmount = parseFloat(pmr.pgAmount || 0);
                const originalFare = parseFloat(cancelledOrder.amountInINR || 0);
                if (userPgAmount > 0 && userPgAmount < originalFare) {
                    const cancellationFee = Math.max(0, originalFare - refundAmount);
                    adjustedRefund = parseFloat(Math.max(0, userPgAmount - cancellationFee).toFixed(2));
                }
            } catch (e) {
                customLog(req?.LogTraceId, 'warn', { message: '[bus:cancelTicket] could not compute adjusted refund, using vendor refund', data: e?.message });
            }
            // Never refund more than the order total actually paid. The vendor refunds against
            // the real fare, so a booking paid below the fare would otherwise get back more than it cost.
            const totalPaid = parseFloat(cancelledOrder.amountInINR || 0);
            if (totalPaid > 0 && adjustedRefund > totalPaid) {
                customLog(req?.LogTraceId, 'error', { message: '[bus:cancelTicket] vendor refund above amount paid, capping', refundAmount, adjustedRefund, totalPaid, corporateTxnId });
                adjustedRefund = totalPaid;
            }
        }

        await refundWalletTransaction({
            corporateTxnId,
            registeredById: req.user.registeredBy,
            status: 'CANCELLED',
            message: 'Bus ticket cancelled',
            ...(adjustedRefund > 0 && {
                partialRefund: { status: true, walletRefund: adjustedRefund },
            }),
        });
        const { getBusBookingByOrderId } = require('../../models/use-cases/bus');
        const cancelledBooking = cancelledOrder
            ? await getBusBookingByOrderId({ orderId: cancelledOrder.id })
            : null;
        const cancelPassengers = cancelledBooking?.passengers || [];
        const primaryCancelPassenger = cancelPassengers[0]?.passenger || {};
        const cancelPassengerName = primaryCancelPassenger?.name || req.user.name;
        customLog(req?.LogTraceId, 'info', {
            message: '[bus:cancelTicket] resolving cancellation email recipient',
            tripDetailsContactEmail: cancelledBooking?.tripDetails?.contactEmail,
            passengerEmail: primaryCancelPassenger?.email,
            userEmail: req.user.email,
        });
        const cancelPassengerEmail = cancelledBooking?.tripDetails?.contactEmail || primaryCancelPassenger?.email || req.user.email;
        customLog(req?.LogTraceId, 'info', { message: '[bus:cancelTicket] cancellation email recipient resolved', cancelPassengerEmail, cancelPassengerName, corporateTxnId, refundAmount, adjustedRefund });

        createNotification({
            notificationTitle: 'Bus Ticket - Cancellation Successful',
            notificationBrief: `Your bus ticket with Transaction ID ${corporateTxnId} has been cancelled.${adjustedRefund > 0 ? ` Refund of ₹ ${adjustedRefund.toFixed(2)} will be credited to your wallet.` : ''}`,
            notificationTo: [req.user.username],
            notificationCategory: 'CORPORATE',
            notificationBy: 'ADMIN',
        });

        (async () => {
            try {
                const td = cancelledBooking?.tripDetails || {};
                const fareInvItems = Array.isArray(cancelledBooking?.fare?.inventoryItems)
                    ? cancelledBooking.fare.inventoryItems : [];

                let cancelCouponCode = '';
                let cancelCouponDiscount = 0;
                if (cancelledOrder?.paymentModeResponse) {
                    try {
                        const pmr = JSON.parse(cancelledOrder.paymentModeResponse);
                        const pgAmt = parseFloat(pmr.pgAmount || 0);
                        const fullAmt = parseFloat(cancelledOrder.amountInINR || 0);
                        if (pgAmt > 0 && pgAmt < fullAmt) {
                            cancelCouponDiscount = parseFloat((fullAmt - pgAmt).toFixed(2));
                            cancelCouponCode = pmr.couponCode || '';
                        }
                    } catch (_e) { /* ignore */ }
                }

                const cancelEmailBody = generateBusCancellationEmail({
                    passengerName: cancelPassengerName,
                    tin,
                    refundAmount: adjustedRefund,
                    couponCode: cancelCouponCode,
                    couponDiscount: cancelCouponDiscount,
                    tripDetails: {
                        source: td.sourceCity || 'N/A',
                        destination: td.destinationCity || 'N/A',
                        operatorName: cancelledBooking?.travels || 'N/A',
                        travelDate: td.doj ? minutesToDayLabel(td.doj, td.pickUpTime) : 'N/A',
                    },
                    fareDetails: {
                        baseFare: fareInvItems.reduce((s, i) => s + parseFloat(i.baseFare || 0), 0),
                        serviceTax: fareInvItems.reduce((s, i) => s + parseFloat(i.serviceTax || 0), 0),
                        platformFee: parseFloat(cancelledOrder?.surcharge || 0),
                    },
                });
                customLog(req?.LogTraceId, 'info', {
                    message: '[bus:cancelTicket] about to send cancellation email',
                    cancelPassengerEmail,
                    cancelPassengerName,
                    corporateTxnId,
                    refundAmount,
                });
                emailer.email(cancelPassengerEmail, 'Bus Ticket Cancellation Confirmation - Peko', cancelEmailBody, (emailErr) => {
                    if (emailErr) {
                        customLog(req?.LogTraceId, 'error', {
                            message: '[bus:cancelTicket] cancellation email failed',
                            cancelPassengerEmail,
                            cancelPassengerName,
                            corporateTxnId,
                            error: emailErr?.message,
                        });
                    } else {
                        customLog(req?.LogTraceId, 'info', {
                            message: '[bus:cancelTicket] cancellation email sent',
                            cancelPassengerEmail,
                            cancelPassengerName,
                            corporateTxnId,
                        });
                    }
                });
            } catch (cancelEmailErr) {
                customLog(req?.LogTraceId, 'error', { message: '[bus:cancelTicket] cancellation email pipeline failed', data: cancelEmailErr?.message });
                emailer.email(cancelPassengerEmail, 'Bus Ticket Cancellation Confirmation - Peko', generateBusCancellationEmail({ passengerName: cancelPassengerName, tin, refundAmount }), () => {});
            }
        })();

        const credentialId = req.user.id;
        const walletDetails = await wallet.findOne({
            where: { credentialId },
            attributes: ['balance'],
        });

        return res.status(200).json({
            status: true,
            message: 'Ticket cancelled successfully!',
            responseCode: '000',
            data: {
                ...result.data,
                refundAmount,
                corporateFinalBalance: walletDetails?.balance,
            },
        });
    } catch (error) {
        if (error?.response?.data) {
            customLog(req?.LogTraceId, 'error', { message: '[bus:cancelTicket] failed', response: error?.response?.data, errorStack: error?.stack });
        } else {
            customLog(req?.LogTraceId, 'error', { message: '[bus:cancelTicket] failed', data: error?.message, errorStack: error?.stack });
        }
        const vendorMessage = error?.response?.data?.errorMessage;
        next(new ErrorResponse(vendorMessage || 'Something went wrong while cancelling ticket', 500));
    }
});

exports.getBpdpDetails = asyncHandler(async (req, res, next) => {
    try {
        const serviceDetails = await checkService(req);
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 404));
        }

        const { id } = req.query;
        if (!id) return next(new ErrorResponse('Trip id is required', 400));

        const url = `${serviceDetails.apiUrl}/bpdpDetails?id=${id}`;
        const config = {
            method: 'get',
            url,
            headers: generateOAuthHeader('GET', url, serviceDetails.consumerKey, serviceDetails.consumerSecret),
            timeout: 30000,
        };

        customLog(req?.LogTraceId, 'info', { message: '[bus:getBpdpDetails] request', id }, 'VENDOR');
        const result = await axios(config);

        customLog(req?.LogTraceId, 'info', {
            message: '[bus:getBpdpDetails] response',
            statusCode: result?.status,
        }, 'VENDOR');

        return res.status(200).json({
            status: true,
            message: 'Boarding and dropping point details fetched successfully!',
            responseCode: '000',
            data: result.data,
        });
    } catch (error) {
        if (error?.response?.status === 500) {
            customLog(req?.LogTraceId, 'info', { message: '[bus:getBpdpDetails] no bpdp data for this trip, returning empty' });
            return res.status(200).json({
                status: true,
                message: 'No boarding and dropping point details available for this trip',
                responseCode: '000',
                data: { boardingPoints: [], droppingPoints: [] },
            });
        }
        if (error?.response?.data) {
            customLog(req?.LogTraceId, 'error', { message: '[bus:getBpdpDetails] failed', response: error?.response?.data, errorStack: error?.stack });
        } else {
            customLog(req?.LogTraceId, 'error', { message: '[bus:getBpdpDetails] failed', data: error?.message, errorStack: error?.stack });
        }
        next(new ErrorResponse('Something went wrong while fetching boarding and dropping point details', 500));
    }
});

const FONT_HOST_DENYLIST = ['fonts.googleapis.com', 'fonts.gstatic.com', 'use.typekit.net'];

const generateBusTicketPdf = async (html, traceId) => {
    const MAX_PDF_ATTEMPTS = 3;
    const PAGE_TIMEOUT_MS = 60000;
    const IMAGE_WAIT_MS = 8000;
    let buffer = null;
    let isValidPdf = false;

    for (let attempt = 1; attempt <= MAX_PDF_ATTEMPTS; attempt += 1) {
        let browser = null;
        const outputFile = `bus-ticket-${traceId || 'na'}-${Date.now()}-${attempt}.pdf`;
        try {
            browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
            const page = await browser.newPage();

            await page.setRequestInterception(true);
            page.on('request', (request) => {
                try {
                    const url = request.url();
                    if (url.startsWith('data:')) { request.continue(); return; }
                    if (request.resourceType() === 'font' || FONT_HOST_DENYLIST.some((h) => url.includes(h))) { request.abort(); return; }
                    request.continue();
                } catch (_) {
                    try { request.continue(); } catch (__) { /* already handled */ }
                }
            });

            await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT_MS });

            await Promise.race([
                page.evaluate(() => Promise.all(
                    Array.from(document.images || []).map((img) => img.complete
                        ? Promise.resolve()
                        : new Promise((resolve) => {
                            const t = setTimeout(resolve, 5000);
                            img.addEventListener('load', () => { clearTimeout(t); resolve(); });
                            img.addEventListener('error', () => { clearTimeout(t); resolve(); });
                        })
                    )
                )),
                new Promise((resolve) => { setTimeout(resolve, IMAGE_WAIT_MS); }),
            ]);

            await page.pdf({ path: outputFile, format: 'A4', preferCSSPageSize: true, timeout: PAGE_TIMEOUT_MS });
            buffer = fs.readFileSync(outputFile);

            const pdfHeader = Buffer.isBuffer(buffer) ? buffer.subarray(0, 4).toString() : '';
            isValidPdf = Buffer.isBuffer(buffer) && buffer.length > 1024 && pdfHeader === '%PDF';
            if (isValidPdf) break;

            customLog(traceId, 'error', {
                message: '[bus:generateBusTicketPdf] invalid PDF output, will retry',
                attempt, maxAttempts: MAX_PDF_ATTEMPTS,
                reason: `${buffer?.length || 0} bytes, header: ${pdfHeader || 'empty'}`,
            });
        } catch (err) {
            customLog(traceId, 'error', {
                message: '[bus:generateBusTicketPdf] attempt threw, will retry',
                attempt, maxAttempts: MAX_PDF_ATTEMPTS,
                errorMessage: err?.message || String(err),
            });
        } finally {
            try { if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile); } catch (_) { /* already gone */ }
            if (browser) { try { await browser.close(); } catch (_) { /* already gone */ } }
        }
        if (attempt < MAX_PDF_ATTEMPTS) {
            await new Promise((resolve) => { setTimeout(resolve, 1500 * attempt); });
        }
    }

    return { isValidPdf, buffer };
};

exports.downloadTicket = asyncHandler(async (req, res, next) => {
    try {
        const { corporateTxnId } = req.query;
        if (!corporateTxnId) return next(new ErrorResponse('corporateTxnId is required', 400));

        const booking = await findOneOrderByTxnId(corporateTxnId);
        if (!isOwnOrder(req, booking)) return next(new ErrorResponse('Booking not found', 404));

        const { getBusBookingByOrderId } = require('../../models/use-cases/bus');
        const busBookingRecord = await getBusBookingByOrderId({ orderId: booking.id });

        const td = busBookingRecord?.tripDetails || {};
        const passengers = busBookingRecord?.passengers || [];

        const durationMins = td.dropTime && td.pickUpTime
            ? parseInt(td.dropTime) - parseInt(td.pickUpTime)
            : null;
        const duration = durationMins !== null
            ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`
            : 'N/A';

        const fareRec = busBookingRecord?.fare || {};
        const fareInvItems = Array.isArray(fareRec.inventoryItems) ? fareRec.inventoryItems : [];
        const fareDetails = {
            baseFare: fareInvItems.reduce((s, i) => s + parseFloat(i.baseFare || 0), 0),
            platformFee: parseFloat(booking.surcharge || 0),
            serviceTax: fareInvItems.reduce((s, i) => s + parseFloat(i.serviceTax || 0), 0),
        };

        const tripDetails = {
            source: td.sourceCity || 'N/A',
            destination: td.destinationCity || 'N/A',
            operatorName: busBookingRecord?.travels || 'N/A',
            departureTime: minutesToTime(td.pickUpTime),
            arrivalTime: minutesToTime(td.dropTime),
            departureDate: minutesToDayLabel(td.doj, td.pickUpTime),
            arrivalDate: minutesToDayLabel(td.doj, td.dropTime),
            duration,
            doj: td.doj || 'N/A',
            boardingPoint: td.pickUpLocation || '',
            droppingPoint: td.dropLocation || '',
            passengers: passengers.map(p => ({
                name: p.passenger?.name || 'N/A',
                gender: p.passenger?.gender || 'N/A',
                age: p.passenger?.age || 'N/A',
            })),
            seats: passengers.map(p => p.seatName || 'N/A'),
        };

        let downloadCouponCode = '';
        let downloadCouponDiscount = 0;
        if (booking.paymentModeResponse) {
            try {
                const pmr = JSON.parse(booking.paymentModeResponse);
                const pgAmt = parseFloat(pmr.pgAmount || 0);
                const fullAmt = parseFloat(booking.amountInINR || 0);
                if (pgAmt > 0 && pgAmt < fullAmt) {
                    downloadCouponDiscount = parseFloat((fullAmt - pgAmt).toFixed(2));
                    downloadCouponCode = pmr.couponCode || '';
                }
            } catch (_e) { /* ignore */ }
        }

        const data = {
            tin: busBookingRecord?.tin || booking.providerId,
            pnr: busBookingRecord?.pnr || '',
            corporateTxnId: booking.corporateTxnId,
            amountInINR: booking.amountInINR,
            couponCode: downloadCouponCode,
            couponDiscount: downloadCouponDiscount,
            transactionDate: booking.transactionDate || booking.createdAt,
            paymentMode: booking.paymentMode,
            busType: busBookingRecord?.busType || '',
            fareDetails,
            tripDetails,
        };

        const ticketTemplateDetails = req.user?.registeredBy
            ? await fetchPartnerDetails(req.user.registeredBy)
            : await partnerLogos();

        const pdfTemplateDetails = await inlineLogoForPdf(ticketTemplateDetails);
        const html = busTicketTemplate(data, pdfTemplateDetails);

        const { isValidPdf, buffer } = await generateBusTicketPdf(html, req?.LogTraceId);
        if (!isValidPdf) return next(new ErrorResponse('Error generating PDF', 500));

        customLog(req?.LogTraceId, 'info', { message: '[bus:downloadTicket]', corporateTxnId, tin: data.tin });

        return res.status(200).json({
            status: true,
            message: 'Ticket fetched successfully',
            responseCode: '000',
            data: {
                pdfFile: buffer,
                pdfBase64: buffer.toString('base64'),
                pdfSize: buffer.length,
                pdfName: `bus-ticket-${data.tin || corporateTxnId}.pdf`,
            },
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: '[bus:downloadTicket] failed', data: error?.message, errorStack: error?.stack });
        next(new ErrorResponse('Something went wrong while downloading ticket', 500));
    }
});

exports.getBookingDetails = asyncHandler(async (req, res, next) => {
    try {
        const { corporateTxnId } = req.query;
        if (!corporateTxnId) return next(new ErrorResponse('corporateTxnId is required', 400));

        const orderRecord = await findOneOrderByTxnId(corporateTxnId);
        if (!isOwnOrder(req, orderRecord)) return next(new ErrorResponse('Booking not found', 404));

        const { getBusBookingByOrderId } = require('../../models/use-cases/bus');
        const busBookingRecord = await getBusBookingByOrderId({ orderId: orderRecord.id });
        if (!busBookingRecord) return next(new ErrorResponse('Ticket details not found', 404));

        let couponCode = '';
        let couponDiscount = 0;
        let pgAmount = parseFloat(orderRecord.amountInINR || 0);
        if (orderRecord.paymentModeResponse) {
            try {
                const pmr = JSON.parse(orderRecord.paymentModeResponse);
                const storedPgAmount = parseFloat(pmr.pgAmount || 0);
                const fullAmount = parseFloat(orderRecord.amountInINR || 0);
                if (storedPgAmount > 0 && storedPgAmount < fullAmount) {
                    pgAmount = storedPgAmount;
                    couponDiscount = parseFloat((fullAmount - storedPgAmount).toFixed(2));
                    couponCode = pmr.couponCode || '';
                }
            } catch (_e) { /* ignore */ }
        }

        customLog(req?.LogTraceId, 'info', { message: '[bus:getBookingDetails]', corporateTxnId });

        return res.status(200).json({
            status: true,
            message: 'Booking details fetched successfully!',
            responseCode: '000',
            data: {
                tin: busBookingRecord.tin,
                pnr: busBookingRecord.pnr,
                corporateTxnId: orderRecord.corporateTxnId,
                orderStatus: orderRecord.status,
                bookingStatus: busBookingRecord.bookingStatus,
                travels: busBookingRecord.travels,
                busType: busBookingRecord.busType,
                tripDetails: busBookingRecord.tripDetails,
                passengers: busBookingRecord.passengers,
                fare: busBookingRecord.fare,
                cancellationPolicy: busBookingRecord.cancellationPolicy,
                amountInINR: orderRecord.amountInINR,
                pgAmount,
                couponCode,
                couponDiscount,
                surcharge: orderRecord.surcharge,
                transactionDate: orderRecord.transactionDate,
                paymentMode: orderRecord.paymentMode,
            },
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: '[bus:getBookingDetails] failed', data: error?.message, errorStack: error?.stack });
        next(new ErrorResponse('Something went wrong while fetching booking details', 500));
    }
});
