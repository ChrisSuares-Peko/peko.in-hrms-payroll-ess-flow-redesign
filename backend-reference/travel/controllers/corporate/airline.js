const fs = require("fs");
// const wkhtmltopdf = require("wkhtmltopdf");

const asyncHandler = require("../../middlewares/async");
const wallet = require("../../models/entities/wallet");
const { findAllAirports } = require("../../models/use-cases/airport");
const { createFlightBooking, findOneFlightBookingWithAllDetails, updateCancelledBookingStatus, findFlightBookingByOrderID, fetchAllFlightBookings, updateStatusById, updateTicketDataByPNR } = require("../../models/use-cases/flight");
const { createNotification } = require("../../models/use-cases/notification");
const { setValue, getValue, deleteValue, addToSet, removeFromSet, getSetMembers } = require("../../utils/cacheDataMethods");
const { fetchServiceDetails, calculateSurchargeWithTax } = require("../../utils/checkAndFetchServiceDetails");
// const { commonFlightbookingFailedTemplate } = require("../../utils/emailTemplates/flight");
const ErrorResponse = require("../../utils/error-response");
const axios = require("axios");
const { updateWalletTransaction, createWalletTransaction, refundWalletTransaction } = require("../../utils/walletTransaction");
const { ticketStatus } = require("../../enum/flight");
const { verifyOtp, createOtp } = require("../../models/use-cases/otp");
const { flightCancellationOTPTemplate } = require("../../utils/emailTemplates/flights/flightCancellationOTPTemplate");
const accessKey = "tbo_airline";
const emailer = require('../../utils/emailer');
const { cancellationMailTemplate } = require("../../utils/emailTemplates/flights/cancellationMailTemplate");
const { customLog } = require("../../utils/loggerHelper");
const { commonFlightbookingFailedTemplate } = require("../../utils/emailTemplates/common");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { partnerLogos } = require("../../utils/partnerLogos");
const { createDataForFlightTicket, retrieveBooking } = require("../../services/flight");
const { airLineTicketTemplate } = require("../../utils/emailTemplates/flights/airLineTicket");
const { fetchAsDataUri } = require("../../utils/imageToDataUri");
const puppeteer = require("puppeteer");
const { flightConfirmationTemplate } = require("../../utils/emailTemplates/flights/flightConfirmationTemplate");
const { cancelPGTransaction } = require("../../utils/pgRefund");
const { BalanceEmailTemplate } = require("../../utils/emailTemplates/AgencyBalanceEmail");
const { findByEmail } = require("../../models/use-cases/settings");
const { formatNumberWithLocalString, amountPrecision } = require("../../utils/formatter");
const { applyServiceCommission, removeCommissionFields, serviceCommissionFields } = require("../../utils/applyCommissionMarkup");
const { scheduleFunction } = require("../../services/scheduler");
const { generateOrderInvoiceAttachments } = require("../../services/invoiceAndReceipt");
const { computeJournalData } = require("../../utils/computeJournalData");
const { publishJournalEvent } = require("../../utils/bull/queue/accountingEventsQueue");
const { findOneOrderByTxnId } = require("../../models/use-cases/order");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");
const {
    createHeldBooking,
    findLiveHoldByMatchHash,
    findLiveHoldsByRouteHash,
    findHoldByBookingId,
    markHoldReleased,
    markHoldConsumed,
} = require("../../models/use-cases/flightHeldBooking");
const { buildMatchHash, buildRouteHash } = require("../../utils/flightHoldFingerprint");


const failedTicketStatus = [0, 3, 4, 6, 8, 9]

// Shared by the 2 flight-booking-failure call sites in this file (payment-gateway path
// and wallet-only path) - resolveEmailTemplate needs one named helper per rule, not two
// inline calls.
const sendFlightBookingFailedEmail = async (to, name, templateDetails, logTraceId) => {
    const branding = templateDetails?.branding || 'Peko';
    const fallbackSubject = 'Payment failed';
    const resolved = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.FLIGHT_BOOKING_FAILED,
        service: EMAIL_TEMPLATE_SERVICES.FLIGHT,
        variables: {
            name,
            branding,
            website: templateDetails?.website || 'https://www.peko.one',
            ...v2LayoutVariables(templateDetails),
        },
        fallback: () => commonFlightbookingFailedTemplate(name, 'Air Ticket', templateDetails?.baseUrl, templateDetails),
        fallbackSubject,
        logTraceId,
    });
    return new Promise((resolve) => {
        emailer.email(to, resolved.subject, resolved.html, function () {
            customLog(logTraceId, "info", { message: "Email sent to " + to })
            resolve();
        });
    });
};

// A hold is handed back this long before TBO's ticketing deadline.
const HOLD_RELEASE_BEFORE_LAST_TICKET_MS = Number(process.env.FLIGHT_HOLD_RELEASE_BEFORE_LAST_TICKET_MS) || 2 * 60 * 60 * 1000;
// Fallback when the vendor gives us no LastTicketDate to work back from.
const HOLD_TTL_MS = Number(process.env.FLIGHT_HOLD_TTL_MS) || 2 * 60 * 60 * 1000;
// Floor: TBO sometimes returns a LastTicketDate already in the past, which would otherwise
// schedule a release before the payment in progress has finished.
const HOLD_MIN_LIFETIME_MS = Number(process.env.FLIGHT_HOLD_MIN_LIFETIME_MS) || 10 * 60 * 1000;
const HOLD_MIN_REUSE_REMAINING_MS = Number(process.env.FLIGHT_HOLD_MIN_REUSE_REMAINING_MS) || 5 * 60 * 1000;

const computeReleaseAt = (lastTicketDate) => {
    const now = Date.now();
    let releaseAt = now + HOLD_TTL_MS;

    if (lastTicketDate) {
        const parsed = new Date(lastTicketDate);
        if (!Number.isNaN(parsed.getTime())) {
            releaseAt = parsed.getTime() - HOLD_RELEASE_BEFORE_LAST_TICKET_MS;
        }
    }
    return new Date(Math.max(releaseAt, now + HOLD_MIN_LIFETIME_MS));
};

const isTraceIdExpiredError = (error) => {
    try {
        let responseData = null;
        
        if (error?.response?.data) {
            responseData = typeof error.response.data === 'string' 
                ? JSON.parse(error.response.data) 
                : error.response.data;
        }
        else if (error?.data) {
            responseData = typeof error.data === 'string' ? JSON.parse(error.data) : error.data;
        }
        else if (error?.Response) {
            responseData = error;
        }
        else if (typeof error === 'string') {
            try {
                responseData = JSON.parse(error);
            } catch (e) {
                if (error.toLowerCase().includes('traceid') && error.toLowerCase().includes('expired')) {
                    return true;
                }
            }
        }
        
        if (responseData) {
            const errorCode = responseData?.Response?.Error?.ErrorCode || responseData?.Error?.ErrorCode;
            const errorMessage = responseData?.Response?.Error?.ErrorMessage || responseData?.Error?.ErrorMessage;
            
            if (errorCode === 5 || (errorMessage && errorMessage.toLowerCase().includes('traceid') && errorMessage.toLowerCase().includes('expired'))) {
                return true;
            }
        }
        
        return false;
    } catch (e) {
        if (error?.message && typeof error.message === 'string') {
            const msg = error.message.toLowerCase();
            if (msg.includes('traceid') && msg.includes('expired')) {
                return true;
            }
        }
        return false;
    }
}

const createTraceIdExpiredError = (message = "Your session has expired. Please restart your search and try again.") => {
    const error = new Error(message);
    error.status_code = 400;
    error.isTraceIdExpired = true;
    error.responseCode = '005';
    return error;
}

// Helper function to call ReleasePNRRequest API for non-LCC flights
// `source` is TBO's FlightItinerary.Source and is mandatory — a wrong value silently no-ops
// the release and we still get billed. Defaults to "4" only for holds recorded before we stored it.
const handleReleasePNRRequest = async (serviceDetails, bookingId, loggerTraceId, source = "4") => {
    try {
        const buildReleasePNRConfig = (tokenId) => ({
            method: 'post',
            url: `${serviceDetails.vendor.optional5}/rest/ReleasePNRRequest`,
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({
                "EndUserIp": serviceDetails.vendor.optional4,
                "TokenId": tokenId,
                "BookingId": bookingId,
                "Source": String(source ?? "4")
            }),
            timeout: 30000 // 30 seconds
        });

        const response = await callTboWithRetry({
            buildConfig: buildReleasePNRConfig,
            serviceDetails,
            loggerTraceId,
            endpoint: 'ReleasePNRRequest',
            logRequest: (config, isRetry) => customLog(loggerTraceId, "info", {
                message: `[airline:ReleasePNRRequest] request${isRetry ? ' (retry)' : ''}`,
                endpoint: "ReleasePNRRequest",
                bookingId,
                requestUrl: config.url,
                requestMethod: config.method,
                requestBody: { ...JSON.parse(config.data), TokenId: "<redacted>" },
            }, "VENDOR"),
            logResponse: (resp, isRetry) => customLog(loggerTraceId, "info", {
                message: `[airline:ReleasePNRRequest] response${isRetry ? ' (retry)' : ''}`,
                endpoint: "ReleasePNRRequest",
                bookingId,
                statusCode: resp?.status,
                vendorErrorCode: resp?.data?.Response?.Error?.ErrorCode,
                vendorErrorMessage: resp?.data?.Response?.Error?.ErrorMessage,
                responseData: resp?.data,
            }, "VENDOR"),
        });

        return {
            success: true,
            response: response?.data
        };
    } catch (error) {
        customLog(loggerTraceId, "error", {
            message: "[airline:ReleasePNRRequest] error",
            endpoint: "ReleasePNRRequest",
            bookingId,
            errorMessage: error?.message,
            statusCode: error?.response?.status,
            errorCode: error?.code,
            vendorErrorCode: error?.response?.data?.Response?.Error?.ErrorCode,
            vendorErrorMessage: error?.response?.data?.Response?.Error?.ErrorMessage,
            responseData: error?.response?.data,
            errorStack: error?.stack,
        }, "VENDOR");
        return {
            success: false,
            error: error?.response?.data ?? error?.response ?? error
        };
    }
}

const checkAndReleasePNRIfNeeded = async (bookingId, serviceDetails, loggerTraceId) => {
    try {
        const { findFlightBookingByBookingId } = require("../../models/use-cases/flight");
        const existingBooking = await findFlightBookingByBookingId(bookingId);
        
        // If booking exists AND has orderId/transactionId, payment was completed
        if (existingBooking && (existingBooking.orderId || existingBooking.transactionId)) {
            customLog(loggerTraceId, "info", { 
                message: "Payment completed for booking (has transaction), skipping ReleasePNRRequest", 
                bookingId,
                orderId: existingBooking.orderId,
                transactionId: existingBooking.transactionId
            });
            // Remove from pending bookings set
            const pendingBookingKey = `${accessKey}_pendingBookings`;
            const bookingInfo = await getValue(`${accessKey}_pendingBooking_${bookingId}`);
            if (bookingInfo) {
                await removeFromSet(pendingBookingKey, bookingInfo);
            }
            return;
        }

        // Payment not completed (no booking or booking without transaction), release PNR
        customLog(loggerTraceId, "info", {
            message: "Payment not completed within 15 minutes, calling ReleasePNRRequest",
            bookingId,
            hasBooking: !!existingBooking,
            hasOrderId: existingBooking?.orderId ? true : false,
            hasTransactionId: existingBooking?.transactionId ? true : false
        });

        // Already released by the sweeper, or consumed by payment — nothing to hand back.
        const heldBooking = await findHoldByBookingId(bookingId);
        if (heldBooking && heldBooking.status !== 'HELD') {
            customLog(loggerTraceId, "info", {
                message: "Hold already closed out, skipping ReleasePNRRequest",
                bookingId,
                holdStatus: heldBooking.status,
            });
            const alreadyHandledKey = `${accessKey}_pendingBookings`;
            const alreadyHandledInfo = await getValue(`${accessKey}_pendingBooking_${bookingId}`);
            if (alreadyHandledInfo) {
                await removeFromSet(alreadyHandledKey, alreadyHandledInfo);
            }
            return;
        }

        const releaseResult = await handleReleasePNRRequest(serviceDetails, bookingId, loggerTraceId, heldBooking?.source);

        if (heldBooking) {
            await markHoldReleased(heldBooking.id, {
                error: releaseResult?.success ? null : releaseResult?.error,
            });
        }

        // Remove from pending bookings set after releasing
        const pendingBookingKey = `${accessKey}_pendingBookings`;
        const bookingInfo = await getValue(`${accessKey}_pendingBooking_${bookingId}`);
        if (bookingInfo) {
            await removeFromSet(pendingBookingKey, bookingInfo);
        }
    } catch (error) {
        customLog(loggerTraceId, "error", { 
            message: "Error in checkAndReleasePNRIfNeeded", 
            bookingId,
            error 
        });
    }
}

// Periodic job to check and release PNRs for pending bookings (runs every 8-10 hours)
const processPendingBookingsForPNRRelease = async () => {
    try {
        const pendingBookingKey = `${accessKey}_pendingBookings`;
        const pendingBookings = await getSetMembers(pendingBookingKey);
        
        if (!pendingBookings || pendingBookings.length === 0) {
            customLog(null, "info", {
                message: "No pending bookings found for PNR release check"
            });
            return;
        }

        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        const now = new Date();
        const { findServiceOperatorByAccessKey } = require("../../utils/checkAndFetchServiceDetails");
        const serviceDetails = await findServiceOperatorByAccessKey(accessKey);

        if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
            customLog(null, "error", {
                message: "Failed to get service details for PNR release job",
                error: serviceDetails.error
            });
            return;
        }

        let processedCount = 0;
        let skippedCount = 0;

        for (const bookingInfoStr of pendingBookings) {
            try {
                const bookingInfo = JSON.parse(bookingInfoStr);
                const createdAt = new Date(bookingInfo.createdAt);
                const lastTicketDate = bookingInfo.lastTicketDate ? new Date(bookingInfo.lastTicketDate) : null;
                
                let shouldProcess = false;
                
                // Check if booking is older than 30 minutes
                if (createdAt <= thirtyMinutesAgo) {
                    // If LastTicketDate is provided, check if it has passed or is very close
                    if (lastTicketDate) {
                        const minutesUntilTicketDate = (lastTicketDate - now) / (1000 * 60);
                        // Process if LastTicketDate has passed or is within 30 minutes
                        if (minutesUntilTicketDate <= 30) {
                            shouldProcess = true;
                        }
                    } else {
                        // If no LastTicketDate, process if booking is older than 30 minutes
                        shouldProcess = true;
                    }
                }
                
                if (shouldProcess) {
                    await checkAndReleasePNRIfNeeded(
                        bookingInfo.bookingId,
                        serviceDetails,
                        null // loggerTraceId
                    );
                    processedCount++;
                } else {
                    skippedCount++;
                }
            } catch (error) {
                customLog(null, "error", {
                    message: "Error processing pending booking for PNR release",
                    bookingInfo: bookingInfoStr,
                    error
                });
            }
        }

        customLog(null, "info", {
            message: "PNR release periodic job completed",
            totalBookings: pendingBookings.length,
            processed: processedCount,
            skipped: skippedCount
        });
    } catch (error) {
        customLog(null, "error", {
            message: "Error in processPendingBookingsForPNRRelease",
            error
        });
    }
}

// Initialize periodic job for PNR release (runs every 8-10 hours, 2-3 times a day)
exports.startPNRReleaseScheduler = async () => {
    const schedule = require('node-schedule');
    const { getSchedulerInterval } = require("../../models/use-cases/settings");
    
    // Default to 8 hours if not configured
    let intervalHours = 8;
    
    // Try to get interval from settings, fallback to default
    try {
        const interval = await getSchedulerInterval("flightPNRRelease");
        if (interval && interval >= 6 && interval <= 12) {
            intervalHours = interval;
        }
    } catch (error) {
        customLog(null, "info", {
            message: "Using default interval for PNR release scheduler",
            defaultInterval: intervalHours,
            error: error.message
        });
    }
    
    // Schedule job to run every intervalHours (default 8 hours)
    // This will run 2-3 times per day (24/8 = 3 times, 24/10 = 2.4 times)
    const cronPattern = `0 */${intervalHours} * * *`; // Every intervalHours hours at minute 0
    
    const job = schedule.scheduleJob(cronPattern, async () => {
        try {
            customLog(null, "info", {
                message: "Starting periodic PNR release job",
                intervalHours
            });
            await processPendingBookingsForPNRRelease();
        } catch (error) {
            customLog(null, "error", {
                message: "Error in PNR release scheduler job",
                error
            });
        }
    });
    
    // Also run immediately on startup to catch any missed bookings
    setTimeout(async () => {
        try {
            customLog(null, "info", {
                message: "Running initial PNR release check on startup"
            });
            await processPendingBookingsForPNRRelease();
        } catch (error) {
            customLog(null, "error", {
                message: "Error in initial PNR release check",
                error
            });
        }
    }, 60000); // Run after 1 minute of startup
    
    customLog(null, "info", {
        message: "PNR release scheduler started",
        intervalHours,
        cronPattern,
        runsPerDay: Math.floor(24 / intervalHours)
    });
    
    return job;
}


async function checkService(req) {
    const credentialId = req.user.id; //will come from userObject
    const corporateUserId = req.user.corporateId
    const packageId = req.user.packageId; //will come from userObject
    const serviceDetails = await fetchServiceDetails({
        credentialId,
        accessKey,
        packageId,
        corporateUserId
    });
   
    return serviceDetails; 
}

async function invalidateSession() {
    await deleteValue(`tokenId-${accessKey}`);
    await deleteValue(`memberId-${accessKey}`);
    await deleteValue(`agencyId-${accessKey}`);
}

// TBO enforces single-session-per-credentials; concurrent Authenticate calls
// invalidate each other's tokens. Coalesce callers onto one in-flight promise.
let inFlightAuthPromise = null;

async function authenticateAndCache(serviceDetails, loggerTraceId) {
    try {
        const data = JSON.stringify({
            ClientId: serviceDetails.vendor.optional3,
            UserName: serviceDetails.vendor.optional1,
            Password: serviceDetails.vendor.optional2,
            EndUserIp: serviceDetails.vendor.optional4,
        });

        const config = {
            method: "post",
            url: `${serviceDetails.vendor.healthUrl}/rest/Authenticate`,
            headers: {
                "Content-Type": "application/json",
                Accept: "*/*",
            },
            data,
        };

        customLog(loggerTraceId, "info", {
            message: "[airline:Authenticate] request",
            endpoint: "Authenticate",
            requestUrl: config.url,
            requestMethod: config.method,
            requestBody: { ...JSON.parse(data), Password: "<redacted>" },
        }, "VENDOR");

        const response = await axios(config);

        customLog(loggerTraceId, "info", {
            message: "[airline:Authenticate] response",
            endpoint: "Authenticate",
            statusCode: response?.status,
            tokenIdSuffix: response?.data?.TokenId ? String(response.data.TokenId).slice(-4) : null,
            memberSno: response?.data?.Member?.Sno,
            vendorErrorCode: response?.data?.Error?.ErrorCode,
            vendorErrorMessage: response?.data?.Error?.ErrorMessage,
            responseData: response?.data,
        }, "VENDOR");

        if (!response) {
            throw new Error("Authentication failed");
        }

        const now = Math.floor(Date.now() / 1000);
        const midnight = new Date();
        midnight.setHours(23, 59, 59, 0);
        const expirySeconds = Math.max(Math.floor(midnight.getTime() / 1000) - now, 1);
        const tokenValue = response?.data?.TokenId ? String(response.data.TokenId) : "";
        const memberValue = response?.data?.Member?.MemberId ? String(response.data.Member.MemberId) : "";
        const agencyValue = response?.data?.Member?.AgencyId ? String(response.data.Member.AgencyId) : "";

        if (!tokenValue) {
            throw new Error("Authentication token missing in vendor response");
        }

        await setValue(`tokenId-${accessKey}`, expirySeconds, tokenValue);
        if (memberValue) {
            await setValue(`memberId-${accessKey}`, expirySeconds, memberValue);
        }
        if (agencyValue) {
            await setValue(`agencyId-${accessKey}`, expirySeconds, agencyValue);
        }

        return { token: tokenValue, memberId: memberValue, agencyId: agencyValue };
    } catch (error) {
        customLog(loggerTraceId, "error", {
            message: "[airline:Authenticate] error",
            endpoint: "Authenticate",
            errorMessage: error?.message,
            statusCode: error?.response?.status,
            errorCode: error?.code,
            vendorErrorCode: error?.response?.data?.Error?.ErrorCode,
            vendorErrorMessage: error?.response?.data?.Error?.ErrorMessage,
            responseData: error?.response?.data,
            errorStack: error?.stack,
        }, "VENDOR");
        return { token: "", memberId: "", agencyId: "" };
    }
}

async function getSession(serviceDetails, { forceRefresh = false, loggerTraceId = null } = {}) {
    if (forceRefresh) {
        await invalidateSession();
    }

    if (!forceRefresh) {
        const cachedToken = await getValue(`tokenId-${accessKey}`);
        if (cachedToken) {
            const cachedMember = await getValue(`memberId-${accessKey}`);
            const cachedAgency = await getValue(`agencyId-${accessKey}`);
            return {
                token: cachedToken,
                memberId: cachedMember,
                agencyId: cachedAgency,
            };
        }
    }

    if (inFlightAuthPromise) {
        return inFlightAuthPromise;
    }

    inFlightAuthPromise = authenticateAndCache(serviceDetails, loggerTraceId).finally(() => {
        inFlightAuthPromise = null;
    });

    return inFlightAuthPromise;
}

// TBO recommends auto-refreshing the TokenId and retrying once when an API call
// returns ErrorCode 6 (Invalid/expired TokenId) or an Authentication Failed
// response. Wraps a single TBO axios call so every endpoint gets the same
// recovery behavior. `buildConfig(token)` must produce the axios config with
// the supplied TokenId. `logRequest`/`logResponse` receive (config, isRetry)
// and (result, isRetry) respectively so each call site keeps its existing
// endpoint-specific log shape.
const isTboTokenExpiredResponse = (result) => {
    const errorCode = result?.data?.Response?.Error?.ErrorCode ?? result?.data?.Error?.ErrorCode;
    if (errorCode === 6) return true;
    const errorMessage = result?.data?.Response?.Error?.ErrorMessage ?? result?.data?.Error?.ErrorMessage;
    if (typeof errorMessage === 'string') {
        const msg = errorMessage.toLowerCase();
        if (msg.includes('invalid token') || msg.includes('token expired') || msg.includes('authentication failed')) {
            return true;
        }
    }
    return false;
};

async function callTboWithRetry({ buildConfig, serviceDetails, loggerTraceId, endpoint, logRequest, logResponse }) {
    const { token } = await getSession(serviceDetails, { loggerTraceId });
    if (!token) {
        throw new Error('Failed to fetch authentication token');
    }

    let config = buildConfig(token);
    if (logRequest) logRequest(config, false);
    let result = await axios(config);
    if (logResponse) logResponse(result, false);

    if (isTboTokenExpiredResponse(result)) {
        customLog(loggerTraceId, 'info', {
            message: `[airline:${endpoint}] retrying after Invalid/Expired Token`,
            endpoint,
            vendorErrorCode: result?.data?.Response?.Error?.ErrorCode ?? result?.data?.Error?.ErrorCode,
            vendorErrorMessage: result?.data?.Response?.Error?.ErrorMessage ?? result?.data?.Error?.ErrorMessage,
        }, 'VENDOR');

        const { token: freshToken } = await getSession(serviceDetails, { forceRefresh: true, loggerTraceId });
        if (!freshToken) {
            throw new Error('Failed to refresh authentication token');
        }

        config = buildConfig(freshToken);
        if (logRequest) logRequest(config, true);
        result = await axios(config);
        if (logResponse) logResponse(result, true);
    }

    return result;
}


// fetching airports from db 
exports.airports = asyncHandler(async (req, res, next) => {
    try {
        let searchText = req.query.q;
        let response = await findAllAirports(searchText);
        if (!response) {
          return next(new ErrorResponse(`Apologies, the service you are trying to access is currently unavailable.`, 404));
        } else {
          return res.status(200).json({
            status: true,
            message: "Airports fetched successfully",
            responseCode: "000",
            data: { airports: response },
          });
        }
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: "Airport fetch vendor api failed", error})    
        next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 500))    
    }
});

// The function sends a request to the search flight vendor API and retrieves flight details as per the search criteria
exports.searchFlights = asyncHandler(async (req, res, next) => {
    try {
        let serviceDetails = await checkService(req)
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse(`Apologies, the service you are trying to access is currently unavailable.`, 404));
        }

        const buildSearchConfig = (tokenId) => ({
            method: 'post',
            url: `${serviceDetails.vendor.apiUrl}/rest/Search`,
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({
                "EndUserIp": serviceDetails.vendor.optional4,
                "TokenId": tokenId,
                "AdultCount": req.body.passengerData.adultCount,
                "ChildCount": req.body.passengerData.childCount,
                "InfantCount": req.body.passengerData.infantCount,
                "DirectFlight": "false",
                "OneStopFlight": "false",
                "JourneyType": req.body.tripType,
                "PreferredAirlines": null,
                "Segments": req.body.flightSegments,
                "Sources": null
            }),
            timeout: 120000 // 2 minute,
        });

        const result = await callTboWithRetry({
            buildConfig: buildSearchConfig,
            serviceDetails,
            loggerTraceId: req?.LogTraceId,
            endpoint: 'Search',
            logRequest: (config, isRetry) => customLog(req?.LogTraceId, "info", {
                message: `[airline:Search] request${isRetry ? ' (retry)' : ''}`,
                endpoint: "Search",
                journeyType: req.body.tripType,
                segmentCount: Array.isArray(req.body.flightSegments) ? req.body.flightSegments.length : 0,
                adultCount: req.body.passengerData.adultCount,
                childCount: req.body.passengerData.childCount,
                infantCount: req.body.passengerData.infantCount,
                requestUrl: config.url,
                requestMethod: config.method,
                requestBody: { ...JSON.parse(config.data), TokenId: "<redacted>" },
            }, "VENDOR"),
            logResponse: (response, isRetry) => customLog(req?.LogTraceId, "info", {
                message: `[airline:Search] response${isRetry ? ' (retry)' : ''}`,
                endpoint: "Search",
                statusCode: response?.status,
                vendorTraceId: response?.data?.Response?.TraceId,
                resultCount: Array.isArray(response?.data?.Response?.Results) ? response.data.Response.Results.flat().length : 0,
                vendorErrorCode: response?.data?.Response?.Error?.ErrorCode,
                vendorErrorMessage: response?.data?.Response?.Error?.ErrorMessage,
                responseData: response?.data,
            }, "VENDOR"),
        });

        if (!result || result.data.Response?.Error?.ErrorCode) {
            // no result case
            customLog(req?.LogTraceId, "error", {
                message: "[airline:Search] failed",
                endpoint: "Search",
                statusCode: result?.status,
                vendorErrorCode: result?.data?.Response?.Error?.ErrorCode,
                vendorErrorMessage: result?.data?.Response?.Error?.ErrorMessage,
            }, "VENDOR")
            if(result.data.Response?.Error?.ErrorCode === 25) {
                return res.status(200).json({
                    status: true,
                    message: "Flights Fetched Successfully!",
                    responseCode: '000',
                    data: {
                        Results: []
                    }
                })
            }
            throw new Error("Flight search api failed")
        } else {
            customLog(req?.LogTraceId, "info", { message: "Flight search api response", response: JSON.stringify(result?.data) })
            await applyServiceCommission((result.data.Response?.Results || []).flat(), 'Fare.PublishedFare', accessKey, { baseField: 'Fare.BaseFare', credentialId: req.user?.id });
            return res.status(200).json({
                status: true,
                message: "Flights Fetched Successfully!",
                responseCode: '000',
                data: result.data.Response
            })
        }
    } catch (error) {
        if (error?.response?.data) {
            const requestConfig = error.config;
            customLog(
                req?.LogTraceId,
                "error",
                {
                    message: "Flight search api failed",
                    response: error?.response?.data,
                    request: {
                        url: requestConfig?.url,
                        method: requestConfig?.method,
                        headers: requestConfig?.headers,
                        data: requestConfig?.data
                    },
                    errorStack: error?.stack,
                }
            )
        } else {
            customLog(req?.LogTraceId, "error", { message: "Flight search api failed", data: error, errorStack: error?.stack })
        }
        next( new ErrorResponse("Something went wrong while search flights", 500))
    }
})

// fetch farerule and fare quotes from vendor and returns it
exports.fetchFareRules = asyncHandler(async (req, res, next) => {
    try {
        const outbountFareRules = await handleFetchFareRules(req, req.body.ResultIndex);
        
        const inbountResultIndex = req.body.InbountResultIndex; 
        let  inbountFareRules; 

        let fareRules = outbountFareRules.fareRules;
        let fareQuotes = {
            outbount: outbountFareRules.fareQuotes, 
            inbount: null,
            combined: outbountFareRules.fareQuotes
        }
        if( inbountResultIndex ) {
            inbountFareRules = await handleFetchFareRules(req, inbountResultIndex)
            fareRules.push(...inbountFareRules.fareRules);
            fareQuotes.inbount = inbountFareRules.fareQuotes
            fareQuotes.combined = mergeFareQuotes(fareQuotes.outbount, fareQuotes.inbount)
        }

        const traceId = req.body.TraceId;
        const fareToCache = fareQuotes.combined?.Fare?.PublishedFare || fareQuotes.outbount?.Fare?.PublishedFare;
        if (traceId && fareToCache) {
            const baseFareKey = `${accessKey}-${traceId}-paymentAmount`;
            const flightFaresKey = `${accessKey}-${traceId}-flightFares`;
            // Stamp when this TBO session was first fare-quoted, so the payment service can guard
            // against ticketing a leg after the ~15-min session window has elapsed. Keep the
            // earliest stamp — don't reset it on a re-quote of the same session.
            const sessionStartedKey = `${accessKey}-${traceId}-sessionStartedAt`;
            if (!(await getValue(sessionStartedKey))) {
                await setValue(sessionStartedKey, 60 * 60, Date.now().toString());
            }
            const existingCachedAmount = await getValue(baseFareKey);
            
            const shouldUpdateCache = !existingCachedAmount || Number(fareToCache) >= Number(existingCachedAmount);
            
            if (shouldUpdateCache) {
                await setValue(baseFareKey, 60 * 60, fareToCache);
                await setValue(
                    flightFaresKey,
                    60 * 60,
                    JSON.stringify({ outbound: fareQuotes.outbount?.Fare?.PublishedFare, inbound: fareQuotes.inbount?.Fare?.PublishedFare })
                );
                customLog(req.LogTraceId, "info", { 
                    message: "Cached fare amount from fetchFareRules", 
                    traceId, 
                    publishedFare: fareToCache,
                    isRoundTrip: !!fareQuotes.inbount,
                    previousCachedAmount: existingCachedAmount || 'none'
                });
            } else {
                customLog(req.LogTraceId, "info", { 
                    message: "Skipped cache update - existing combined fare is higher", 
                    traceId, 
                    newFare: fareToCache,
                    existingCachedAmount,
                    isRoundTrip: !!fareQuotes.inbount
                });
            }
        }

        return res.status(200).json({
            status: true,
            message: "Fare Rules Fetch Successfully",
            responseCode: '000',
            data: {
                fareRules: fareRules, 
                fareQuotes: fareQuotes
            }
        })

    } catch (error) {
        if (isTraceIdExpiredError(error)) {
            customLog(req?.LogTraceId, "error", { message: "TraceId expired in fare rules fetch", error })
            return next(createTraceIdExpiredError("Your search session has expired. Please restart your search and try again."))
        }
        customLog(req?.LogTraceId, "error", { message: "Fair rules fetch api failed", data: error?.response?.data ?? error?.response ?? error?.message ?? error, stack: error?.stack })
        next(new ErrorResponse("We couldn't retrieve the flight fare details at the moment. Please try again shortly or contact support if the problem persists.", 500))
    }
})

// calls fare rules and fare quotes vendor api, handles error and return formatted data
const handleFetchFareRules = async (req, ResultIndex) => {
    try {
        let serviceDetails = await checkService(req)
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            throw new Error("Service details fetch failed")
        }

        const buildFareConfig = (urlPath) => (tokenId) => ({
            method: 'post',
            url: `${serviceDetails.vendor.apiUrl}${urlPath}`,
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({
                "EndUserIp": serviceDetails.vendor.optional4,
                "TokenId": tokenId,
                "TraceId": req.body.TraceId,
                "ResultIndex": ResultIndex
            }),
            timeout: 60000,
        });

        const fareRules = await callTboWithRetry({
            buildConfig: buildFareConfig('/rest/FareRule'),
            serviceDetails,
            loggerTraceId: req?.LogTraceId,
            endpoint: 'FareRule',
            logRequest: (config, isRetry) => customLog(req?.LogTraceId, "info", {
                message: `[airline:FareRule] request${isRetry ? ' (retry)' : ''}`,
                endpoint: "FareRule",
                vendorTraceId: req.body.TraceId,
                resultIndex: ResultIndex,
                requestUrl: config.url,
                requestMethod: config.method,
                requestBody: { ...JSON.parse(config.data), TokenId: "<redacted>" },
            }, "VENDOR"),
            logResponse: (response, isRetry) => customLog(req?.LogTraceId, "info", {
                message: `[airline:FareRule] response${isRetry ? ' (retry)' : ''}`,
                endpoint: "FareRule",
                statusCode: response?.status,
                vendorTraceId: response?.data?.Response?.TraceId,
                ruleCount: Array.isArray(response?.data?.Response?.FareRules) ? response.data.Response.FareRules.length : 0,
                vendorErrorCode: response?.data?.Response?.Error?.ErrorCode,
                vendorErrorMessage: response?.data?.Response?.Error?.ErrorMessage,
                responseData: response?.data,
            }, "VENDOR"),
        });

        const fareQuotes = await callTboWithRetry({
            buildConfig: buildFareConfig('/rest/FareQuote'),
            serviceDetails,
            loggerTraceId: req?.LogTraceId,
            endpoint: 'FareQuote',
            logRequest: (config, isRetry) => customLog(req?.LogTraceId, "info", {
                message: `[airline:FareQuote] request${isRetry ? ' (retry)' : ''}`,
                endpoint: "FareQuote",
                vendorTraceId: req.body.TraceId,
                resultIndex: ResultIndex,
                requestUrl: config.url,
                requestMethod: config.method,
                requestBody: { ...JSON.parse(config.data), TokenId: "<redacted>" },
            }, "VENDOR"),
            logResponse: (response, isRetry) => customLog(req?.LogTraceId, "info", {
                message: `[airline:FareQuote] response${isRetry ? ' (retry)' : ''}`,
                endpoint: "FareQuote",
                statusCode: response?.status,
                vendorTraceId: response?.data?.Response?.TraceId,
                publishedFare: response?.data?.Response?.Results?.Fare?.PublishedFare,
                offeredFare: response?.data?.Response?.Results?.Fare?.OfferedFare,
                isPriceChanged: response?.data?.Response?.IsPriceChanged,
                vendorErrorCode: response?.data?.Response?.Error?.ErrorCode,
                vendorErrorMessage: response?.data?.Response?.Error?.ErrorMessage,
                responseData: response?.data,
            }, "VENDOR"),
        });
        if (!fareRules || !fareQuotes) {
            customLog(req?.LogTraceId, "error", {
                message: "[airline:FareRule/FareQuote] empty result",
                endpoint: "FareRule/FareQuote",
            }, "VENDOR")
            throw new Error(`No Results found`)
        } else {
            if (fareRules && fareRules.data.Response.Error.ErrorCode !== 0) {
                if (isTraceIdExpiredError(fareRules.data)) {
                    customLog(req?.LogTraceId, "error", {
                        message: "[airline:FareRule] TraceId expired",
                        endpoint: "FareRule",
                        vendorErrorCode: fareRules?.data?.Response?.Error?.ErrorCode,
                        vendorErrorMessage: fareRules?.data?.Response?.Error?.ErrorMessage,
                    }, "VENDOR")
                    throw createTraceIdExpiredError("Your search session has expired. Please restart your search and try again.");
                }
                customLog(req?.LogTraceId, "error", {
                    message: "[airline:FareRule] failed",
                    endpoint: "FareRule",
                    vendorErrorCode: fareRules?.data?.Response?.Error?.ErrorCode,
                    vendorErrorMessage: fareRules?.data?.Response?.Error?.ErrorMessage,
                }, "VENDOR")
                throw new Error(`Fetching fair rules failed`)
            }
            if (fareQuotes && fareQuotes.data.Response.Error.ErrorCode !== 0) {
                if (isTraceIdExpiredError(fareQuotes.data)) {
                    customLog(req?.LogTraceId, "error", {
                        message: "[airline:FareQuote] TraceId expired",
                        endpoint: "FareQuote",
                        vendorErrorCode: fareQuotes?.data?.Response?.Error?.ErrorCode,
                        vendorErrorMessage: fareQuotes?.data?.Response?.Error?.ErrorMessage,
                    }, "VENDOR")
                    throw createTraceIdExpiredError("Your search session has expired. Please restart your search and try again.");
                }
                customLog(req?.LogTraceId, "error", {
                    message: "[airline:FareQuote] failed",
                    endpoint: "FareQuote",
                    vendorErrorCode: fareQuotes?.data?.Response?.Error?.ErrorCode,
                    vendorErrorMessage: fareQuotes?.data?.Response?.Error?.ErrorMessage,
                }, "VENDOR")
                throw new Error(`Fetching quotes rules failed`)
            }
            
            const fareRuleDetails = fareRules.data.Response.FareRules.map( fareRule => ({
                FareRuleDetail: fareRule.FareRuleDetail, 
                Destination: fareRule.Destination, 
                Origin: fareRule.Origin
            }))

            const fareQuoteDetails = fareQuotes.data.Response.Results;
            const formattedFareQuotes = {
                IsRefundable: fareQuoteDetails.IsRefundable, 
                IsPassportRequiredAtBook: fareQuoteDetails.IsPassportRequiredAtBook, 
                IsPassportRequiredAtTicket: fareQuoteDetails.IsPassportRequiredAtTicket, 
                IsPassportFullDetailRequiredAtBook: fareQuoteDetails.IsPassportFullDetailRequiredAtBook, 
                IsPanRequiredAtBook: fareQuoteDetails.IsPanRequiredAtBook, 
                IsPanRequiredAtTicket: fareQuoteDetails.IsPanRequiredAtTicket, 
                IsGSTMandatory: fareQuoteDetails.IsGSTMandatory, 
                FareBreakdown: fareQuoteDetails.FareBreakdown, 
                GSTAllowed: fareQuoteDetails.GSTAllowed, 
                RequiredFieldValidators: fareQuoteDetails.RequiredFieldValidators, 
                Fare: {
                    TaxBreakup: fareQuoteDetails.Fare.TaxBreakup, 
                    Tax: fareQuoteDetails.Fare.Tax, 
                    BaseFare: fareQuoteDetails.Fare.BaseFare, 
                    PublishedFare: fareQuoteDetails.Fare.PublishedFare,
                    OtherCharges: fareQuoteDetails.Fare.OtherCharges
                }
            }
            
            customLog(req.LogTraceId, "info", { 
                message: "Fare quotes fetched (combined caching handled by fetchFareRules)", 
                traceId: req.body.TraceId, 
                publishedFare: formattedFareQuotes.Fare.PublishedFare 
            });
            
            await applyServiceCommission(formattedFareQuotes, 'Fare.PublishedFare', accessKey, { baseField: 'Fare.BaseFare', credentialId: req.user?.id });
            return {    
                fareRules: fareRuleDetails, 
                fareQuotes: formattedFareQuotes
            }
        }
        
    } catch (error) {
        if (error?.response?.data) {
            const requestConfig = error.config;
            customLog(
                req?.LogTraceId,
                "error",
                {
                    message: "Fair rules fetch api failed",
                    response: error?.response?.data,
                    request: {
                        url: requestConfig?.url,
                        method: requestConfig?.method,
                        headers: requestConfig?.headers,
                        data: requestConfig?.data
                    },
                    errorStack: error?.stack,
                }
            )
        } else {
            customLog(req?.LogTraceId, "error", { message: "Fair rules fetch api failed", data: error, errorStack: error?.stack })
        }
        throw new Error("We couldn’t retrieve the flight fare details at the moment. Please try again shortly or contact support if the problem persists.")
    }
}

// in case of domestic round trip journey, we need to make two booking in one go
// in that case combining inbount and outbount farequotes
const mergeFareQuotes = (ob, ib) => {
    const obFareBreakDown = ob.FareBreakdown; 
    const ibFareBreakdown = ib.FareBreakdown;
    const combinedFareBreakDown = obFareBreakDown.map( obBreakDown => {
        const relativeIb = ibFareBreakdown.filter( ({ PassengerType }) => PassengerType === obBreakDown.PassengerType )[0]; 
        return {
            PassengerType: relativeIb.PassengerType, 
            PassengerCount: relativeIb.PassengerCount,
            BaseFare: relativeIb.BaseFare + obBreakDown.BaseFare,
            Tax: relativeIb.Tax + obBreakDown.Tax,
            YQTax: relativeIb.YQTax + obBreakDown.YQTax,
            AdditionalTxnFeeOfrd: relativeIb.AdditionalTxnFeeOfrd + obBreakDown.AdditionalTxnFeeOfrd,
            AdditionalTxnFeePub: relativeIb.AdditionalTxnFeePub + obBreakDown.AdditionalTxnFeePub,
        }
    })

    const fareQuote = {
        IsRefundable: ob.IsRefundable && ib.IsRefundable, 
        IsPassportRequiredAtBook: ob.IsPassportRequiredAtBook || ib.IsPassportRequiredAtBook, 
        IsPassportRequiredAtTicket: ob.IsPassportRequiredAtTicket || ib.IsPassportRequiredAtTicket, 
        IsPassportFullDetailRequiredAtBook: ob.IsPassportFullDetailRequiredAtBook || ib.IsPassportFullDetailRequiredAtBook, 
        IsPanRequiredAtBook: ob.IsPanRequiredAtBook || ib.IsPanRequiredAtBook, 
        IsPanRequiredAtTicket: ob.IsPanRequiredAtTicket || ib.IsPanRequiredAtTicket, 
        GSTAllowed: ob.GSTAllowed && ib.GSTAllowed, 
        IsGSTMandatory: ob.IsGSTMandatory || ib.IsGSTMandatory, 
        FareBreakdown: combinedFareBreakDown, 
        RequiredFieldValidators: {
            IsMealRequired: ib.RequiredFieldValidators?.IsMealRequired || ob.RequiredFieldValidators?.IsMealRequired, 
            IsSeatRequired: ib.RequiredFieldValidators?.IsSeatRequired || ob.RequiredFieldValidators?.IsSeatRequired
        }, 
        Fare: {
            // TaxBreakup: ob.Fare.TaxBreakup\, 
            Tax: ob.Fare.Tax + ib.Fare.Tax, 
            PublishedFare: ob.Fare.PublishedFare + ib.Fare.PublishedFare, 
            BaseFare: ob.Fare.BaseFare + ib.Fare.BaseFare, 
            OtherCharges: ob.Fare.OtherCharges + ib.Fare.OtherCharges
        }
    }

    return fareQuote;
}

// calls ssr vendor api and returns the result
exports.fetchSSR = asyncHandler(async (req, res, next) => {
    const loggerTraceId = req?.LogTraceId

    try {
        let serviceDetails = await checkService(req)
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400))
        }

        let payload = {
            ResultIndex: req.body.data.ResultIndex, 
            InbountResultIndex: req.body.data.InbountResultIndex,
            TraceId: req.body.data.TraceId
        }

        const outbountSSRDetails = await handleFetchSSR(payload, serviceDetails, loggerTraceId)

        const inbountResultIndex = payload.InbountResultIndex;
        let inbountSSRDetails;
        if (inbountResultIndex) {
            payload.ResultIndex = inbountResultIndex;
            inbountSSRDetails = await handleFetchSSR(payload, serviceDetails, loggerTraceId);
        }

        const responseData = {
            MealDynamic: outbountSSRDetails.MealDynamic,
            Baggage: outbountSSRDetails.Baggage,
            SeatDynamic: outbountSSRDetails.SeatDynamic
        };

        if (inbountSSRDetails) {
            responseData.inbount = {
                MealDynamic: inbountSSRDetails.MealDynamic,
                Baggage: inbountSSRDetails.Baggage,
                SeatDynamic: inbountSSRDetails.SeatDynamic
            };
        }
        
        return res.status(200).json({
            status: true,
            message: "SSR Fetched Successfully!",
            responseCode: '000',
            data: responseData
        })
    } catch (error) {
        customLog(loggerTraceId, "error", { message: "Flight SSR fetching api failed", data: error, errorStack: error?.stack, responseData: error?.response?.data })
        return res.status(200).json({
            status: true,
            message: "No special service requests available.",
            responseCode: '000',
            data: {
                MealDynamic: [],
                Baggage: [],
                SeatDynamic: []
            }
        })
    }
})

const handleFetchSSR = async (payload, serviceDetails, loggerTraceId) => {
    try {
        const buildSSRConfig = (tokenId) => ({
            method: 'post',
            url: `${serviceDetails.vendor.apiUrl}/rest/SSR`,
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({
                "EndUserIp": serviceDetails.vendor.optional4,
                "TokenId": tokenId,
                ResultIndex: payload.ResultIndex,
                TraceId: payload.TraceId
            }),
            timeout: 60000,
        });

        const result = await callTboWithRetry({
            buildConfig: buildSSRConfig,
            serviceDetails,
            loggerTraceId,
            endpoint: 'SSR',
            logRequest: (config, isRetry) => customLog(loggerTraceId, "info", {
                message: `[airline:SSR] request${isRetry ? ' (retry)' : ''}`,
                endpoint: "SSR",
                vendorTraceId: payload.TraceId,
                resultIndex: payload.ResultIndex,
                requestUrl: config.url,
                requestMethod: config.method,
                requestBody: { ...JSON.parse(config.data), TokenId: "<redacted>" },
            }, "VENDOR"),
            logResponse: (response, isRetry) => customLog(loggerTraceId, "info", {
                message: `[airline:SSR] response${isRetry ? ' (retry)' : ''}`,
                endpoint: "SSR",
                statusCode: response?.status,
                baggageCount: Array.isArray(response?.data?.Response?.Baggage) ? response.data.Response.Baggage.length : 0,
                mealCount: Array.isArray(response?.data?.Response?.MealDynamic) ? response.data.Response.MealDynamic.length : 0,
                seatCount: Array.isArray(response?.data?.Response?.SeatDynamic) ? response.data.Response.SeatDynamic.length : 0,
                vendorErrorCode: response?.data?.Response?.Error?.ErrorCode,
                vendorErrorMessage: response?.data?.Response?.Error?.ErrorMessage,
                responseData: response?.data,
            }, "VENDOR"),
        });

        if (!result || result.data.Response.Error.ErrorCode) {
            if (isTraceIdExpiredError(result.data)) {
                customLog(loggerTraceId, "error", {
                    message: "[airline:SSR] TraceId expired",
                    endpoint: "SSR",
                    vendorErrorCode: result?.data?.Response?.Error?.ErrorCode,
                    vendorErrorMessage: result?.data?.Response?.Error?.ErrorMessage,
                }, "VENDOR")
                throw createTraceIdExpiredError("Your search session has expired. Please restart your search and try again.");
            }
            customLog(loggerTraceId, "error", {
                message: "[airline:SSR] failed",
                endpoint: "SSR",
                vendorErrorCode: result?.data?.Response?.Error?.ErrorCode,
                vendorErrorMessage: result?.data?.Response?.Error?.ErrorMessage,
            }, "VENDOR")
            throw new Error('Failed to fetch SSR details.');
        } else {
            // format and return;
            const response = result.data.Response

            const { MealDynamic, Baggage, SeatDynamic } = response;
            return {
                MealDynamic,
                Baggage,
                SeatDynamic
            }

        }
    } catch (error) {
        if (isTraceIdExpiredError(error)) {
            customLog(loggerTraceId, "error", { message: "TraceId expired in SSR fetch", error })
            throw createTraceIdExpiredError("Your search session has expired. Please restart your search and try again.");
        }
        
        if (error?.response?.data) {
            const requestConfig = error.config;
            customLog(loggerTraceId, "error", {
                message: "Flight SSR fetching API failed",
                request: {
                    url: requestConfig?.url,
                    method: requestConfig?.method,
                    headers: requestConfig?.headers,
                    data: requestConfig?.data
                },
                response: error?.response?.data,
                errorStack: error?.stack,
            })
            throw new Error('Failed to fetch SSR details.');
        } else {
            customLog(loggerTraceId, "error", { message: "Flight SSR fetching api failed", data: error, errorStack: error?.stack })
        }
        throw new Error('Failed to fetch SSR details.');
    }
}

// the api calls book vendor api for non lcc flight and returns the pnr number provided by the vendor
// Test-only: forces a price change or a past ticketing deadline, neither of which can be
// provoked from outside the vendor. Off unless the env var is set; refused in production.
//   FLIGHT_HOLD_TEST_FORCE_PRICE_CHANGE=true
//   FLIGHT_HOLD_TEST_LAST_TICKET_OFFSET_MS=-60000
const applyHoldTestOverrides = (result, loggerTraceId) => {
    const forcePriceChange = process.env.FLIGHT_HOLD_TEST_FORCE_PRICE_CHANGE === 'true';
    const lastTicketOffset = process.env.FLIGHT_HOLD_TEST_LAST_TICKET_OFFSET_MS;

    if (!forcePriceChange && !lastTicketOffset) return result;

    if (process.env.NODE_ENV === 'production') {
        customLog(loggerTraceId, "error", { message: "Flight hold test overrides ignored in production" });
        return result;
    }

    if (forcePriceChange) result.isPriceChanged = true;

    if (lastTicketOffset && result.FlightItinerary) {
        result.FlightItinerary.LastTicketDate = new Date(Date.now() + Number(lastTicketOffset)).toISOString();
    }

    customLog(loggerTraceId, "info", {
        message: "TEST OVERRIDE APPLIED to hold — not a real vendor response",
        forcePriceChange,
        lastTicketDate: result.FlightItinerary?.LastTicketDate,
    });
    return result;
};

// FareRules are multi-KB of HTML we never read back — drop before persisting.
// The vendor's own fares (the itinerary's and each passenger's) go too: they are the price before our markup.
const trimItineraryForStorage = (flightItinerary) => {
    if (!flightItinerary) return {};
    const trimmed = { ...flightItinerary };
    delete trimmed.FareRules;
    removeCommissionFields(trimmed, ["Fare"]);
    if (Array.isArray(trimmed.Passenger))
        trimmed.Passenger = trimmed.Passenger.map((passenger) => removeCommissionFields({ ...passenger }, ["Fare"]));
    return trimmed;
};

// Shapes a stored hold into the booking endpoint's normal response shape.
const holdToBookingResponse = (hold) => ({
    PNR: hold.PNR,
    BookingId: Number(hold.BookingId),
    isPriceChanged: hold.isPriceChanged,
    isTimeChanged: hold.isTimeChanged,
    passengerFares: hold.passengerFares || [],
    fare: hold.fare || {},
    FlightItinerary: {
        BookingId: Number(hold.BookingId),
        PNR: hold.PNR,
        Source: hold.source,
        LastTicketDate: hold.lastTicketDate,
        Segments: hold.segments || [],
    },
    heldBookingId: hold.id,
    lastTicketDate: hold.lastTicketDate,
    holdExpiresAt: hold.releaseAt,
    reusedHold: true,
});

// Reuses a live hold for the same itinerary + passengers, else takes a fresh one and records it.
const resolveHeldBookingForLeg = async ({ leg, legType, groupKey, serviceDetails, req }) => {
    const credentialId = req.user.id;
    // ResultIndex is scoped to one search, so the client sends the itinerary to identify the flight.
    const segments = leg.itinerary || leg.journey;
    const matchHash = buildMatchHash({ credentialId, segments, passengers: leg.passengers });
    const routeHash = buildRouteHash({ credentialId, segments, passengers: leg.passengers });

    if (matchHash) {
        const existingHold = await findLiveHoldByMatchHash({
            credentialId,
            matchHash,
            legType,
            minRemainingMs: HOLD_MIN_REUSE_REMAINING_MS,
        });
        if (existingHold) {
            customLog(req.LogTraceId, "info", {
                message: "Reusing existing flight hold — skipping Book",
                heldBookingId: existingHold.id,
                bookingId: existingHold.BookingId,
                pnr: existingHold.PNR,
                legType,
                holdExpiresAt: existingHold.releaseAt,
            });
            return holdToBookingResponse(existingHold);
        }
    } else {
        customLog(req.LogTraceId, "info", {
            message: "No itinerary fingerprint on booking request — hold reuse disabled for this leg",
            legType,
        });
    }

    const result = applyHoldTestOverrides(await handleBookingApi(leg, serviceDetails, req), req.LogTraceId);

    // Record even without a fingerprint: reuse needs the hash, release does not.
    if (!result?.PNR || !result?.BookingId) return result;

    const itinerary = result.FlightItinerary || {};
    const lastTicketDate = itinerary.LastTicketDate || null;
    const releaseAt = computeReleaseAt(lastTicketDate);

    const hold = await createHeldBooking({
        credentialId,
        subCorporateUserId: req.user.subCorporateId || null,
        matchHash,
        routeHash,
        legType,
        groupKey: groupKey || null,
        PNR: result.PNR,
        BookingId: String(result.BookingId),
        source: itinerary.Source != null ? String(itinerary.Source) : null,
        traceId: leg.TraceId,
        resultIndex: leg.ResultIndex,
        lastTicketDate,
        releaseAt,
        isPriceChanged: !!result.isPriceChanged,
        isTimeChanged: !!result.isTimeChanged,
        fare: result.fare || {},
        passengerFares: result.passengerFares || [],
        segments: itinerary.Segments || [],
        passengers: leg.passengers || [],
        userContactDetails: leg.userContactDetails || {},
    });

    customLog(req.LogTraceId, "info", {
        message: "Recorded new flight hold",
        heldBookingId: hold?.id,
        bookingId: result.BookingId,
        pnr: result.PNR,
        source: itinerary.Source,
        lastTicketDate,
        releaseAt,
        isPriceChanged: !!result.isPriceChanged,
    });

    await releaseConflictingHolds({ credentialId, routeHash, excludeId: hold?.id, serviceDetails, req });

    return {
        ...result,
        FlightItinerary: trimItineraryForStorage(itinerary),
        heldBookingId: hold?.id,
        lastTicketDate,
        holdExpiresAt: releaseAt,
        reusedHold: false,
    };
};

// A re-search at a different fare, or a raced double submit, would leave an earlier hold blocking.
const releaseConflictingHolds = async ({ credentialId, routeHash, excludeId, serviceDetails, req }) => {
    try {
        const stale = await findLiveHoldsByRouteHash({ credentialId, routeHash, excludeId });
        for (const hold of stale) {
            const releaseResult = await handleReleasePNRRequest(serviceDetails, hold.BookingId, req.LogTraceId, hold.source);
            await markHoldReleased(hold.id, { error: releaseResult?.success ? null : releaseResult?.error });
            customLog(req.LogTraceId, "info", {
                message: "Released superseded hold on the same flights",
                heldBookingId: hold.id,
                bookingId: hold.BookingId,
                released: !!releaseResult?.success,
            });
        }
    } catch (error) {
        // Never fail the booking over cleanup — the sweeper catches these at releaseAt.
        customLog(req.LogTraceId, "error", { message: "Failed releasing superseded holds", error });
    }
};

// Non-LCC legs are held with TBO immediately before ticketing. A fare that moved in the
// meantime is accepted rather than blocking the payment, so the ticket is issued at the
// vendor's current fare — the difference against what the customer paid is logged.
const holdLegBeforeTicketing = async ({ leg, legType, groupKey, serviceDetails, req }) => {
    if (!leg || leg.isLcc || (leg.PNR && leg.BookingId)) return leg;

    const held = await resolveHeldBookingForLeg({ leg, legType, groupKey, serviceDetails, req });

    leg.PNR = held.PNR;
    leg.BookingId = held.BookingId;

    if (held.isPriceChanged || held.isTimeChanged) {
        leg.IsPriceChangeAccepted = true;
        customLog(req?.LogTraceId, "info", {
            message: "Fare or schedule moved between search and hold; ticketing at the vendor's fare",
            legType,
            pnr: held.PNR,
            bookingId: held.BookingId,
            collectedFare: leg.amount,
            vendorFare: held.fare?.PublishedFare,
            isPriceChanged: !!held.isPriceChanged,
            isTimeChanged: !!held.isTimeChanged,
        });
    }
    return leg;
};

exports.booking = asyncHandler(async (req, res, next) => {
    let serviceDetails = await checkService(req)
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        throw new Error(serviceDetails.error)
    }

    try {
        const groupKey = req.body.data.inbount ? `${req.user.id}-${Date.now()}` : null;

        const outbountResult = await resolveHeldBookingForLeg({
            leg: req.body.data.outbount,
            legType: 'OUTBOUND',
            groupKey,
            serviceDetails,
            req,
        })
        let inbountResult;
        if(req.body.data.inbount) {
            inbountResult = await resolveHeldBookingForLeg({
                leg: req.body.data.inbount,
                legType: 'INBOUND',
                groupKey,
                serviceDetails,
                req,
            })
        }

        const traceId = req.body.data.outbount?.TraceId || req.body.data.inbount?.TraceId;
        if (traceId) {
            const outboundFare = Number(outbountResult?.fare?.PublishedFare || 0);
            const inboundFare = Number(inbountResult?.fare?.PublishedFare || 0);
            const combinedFare = outboundFare + inboundFare;
            
            if (combinedFare > 0) {
                const baseFareKey = `${accessKey}-${traceId}-paymentAmount`;
                const flightFaresKey = `${accessKey}-${traceId}-flightFares`;
                await setValue(baseFareKey, 60 * 60, combinedFare);
                await setValue(flightFaresKey, 60 * 60, JSON.stringify({ outbound: outboundFare, inbound: inboundFare }));
                customLog(req.LogTraceId, "info", { 
                    message: "Updated cached fare after prebook (combined for round trip)", 
                    traceId,
                    outboundFare,
                    inboundFare,
                    combinedFare,
                    isRoundTrip: !!inbountResult
                });
            }
        }

        return res.status(200).json({
            status: true,
            message: 'Pro-book successful',
            responseCode: '000',
            data: {
                outbount: outbountResult,
                inbount: inbountResult,
                holdExpiresAt: outbountResult?.holdExpiresAt,
                lastTicketDate: outbountResult?.lastTicketDate,
            }
        })
    } catch (error) {
        if (isTraceIdExpiredError(error) || error.isTraceIdExpired) {
            customLog(req?.LogTraceId, "error", { message: "TraceId expired in booking api", error, errorStack: error?.stack })
            return next(createTraceIdExpiredError("Your search session has expired. Please restart your search and try again."));
        }
        customLog(req?.LogTraceId, "error", {
            message: "Flight ticket booking api failed",
            error,
            errorStack: error?.stack,
            responseData: error?.response?.data,
            vendorErrorCode: error?.vendorErrorCode,
            vendorStatus: error?.vendorStatus,
            vendorMessage: error?.vendorMessage,
        })
        return res.status(400).json({
            status: false,
            message: `Unable to proceed with the booking. Please try again.`,
            responseCode: '001',
            data: {}
        })
    }
})

const handleBookingApi = async ( details, serviceDetails, req) => {
    const buildBookConfig = (tokenId) => ({
        method: 'post',
        url: `${serviceDetails.vendor.optional5}/rest/Book`,
        headers: {
            'Content-Type': 'application/json',
        },
        data: JSON.stringify({
            "EndUserIp": serviceDetails.vendor.optional4,
            "TokenId": tokenId,
            TraceId: details.TraceId,
            ResultIndex: details.ResultIndex,
            Passengers: details.passengers
        })
    });

    try {
        const result = await callTboWithRetry({
            buildConfig: buildBookConfig,
            serviceDetails,
            loggerTraceId: req?.LogTraceId,
            endpoint: 'Book',
            logRequest: (config, isRetry) => customLog(req?.LogTraceId, "info", {
                message: `[airline:Book] request${isRetry ? ' (retry)' : ''}`,
                endpoint: "Book",
                vendorTraceId: details.TraceId,
                resultIndex: details.ResultIndex,
                passengerCount: Array.isArray(details.passengers) ? details.passengers.length : 0,
                requestUrl: config.url,
                requestMethod: config.method,
                requestBody: { ...JSON.parse(config.data), TokenId: "<redacted>" },
            }, "VENDOR"),
            logResponse: (response, isRetry) => customLog(req?.LogTraceId, "info", {
                message: `[airline:Book] response${isRetry ? ' (retry)' : ''}`,
                endpoint: "Book",
                statusCode: response?.status,
                bookingId: response?.data?.Response?.Response?.BookingId,
                pnr: response?.data?.Response?.Response?.PNR,
                status: response?.data?.Response?.Response?.Status,
                isPriceChanged: response?.data?.Response?.Response?.IsPriceChanged,
                vendorErrorCode: response?.data?.Response?.Error?.ErrorCode,
                vendorErrorMessage: response?.data?.Response?.Error?.ErrorMessage,
                responseData: response?.data,
            }, "VENDOR"),
        });

        if (!result || result.data.Response.Error.ErrorCode) {
            const errorCode = result?.data?.Response?.Error?.ErrorCode;
            const errorMessage = result?.data?.Response?.Error?.ErrorMessage;

            if (errorCode === 5 || (errorMessage && errorMessage.toLowerCase().includes('traceid') && errorMessage.toLowerCase().includes('expired'))) {
                customLog(req?.LogTraceId, "error", {
                    message: "[airline:Book] TraceId expired",
                    endpoint: "Book",
                    vendorErrorCode: errorCode,
                    vendorErrorMessage: errorMessage,
                }, "VENDOR")
                throw createTraceIdExpiredError("Your search session has expired. Please restart your search and try again.");
            }

            // Also check using the helper function
            if (result && result.data && isTraceIdExpiredError(result.data)) {
                customLog(req?.LogTraceId, "error", {
                    message: "[airline:Book] TraceId expired (via helper)",
                    endpoint: "Book",
                    vendorErrorCode: errorCode,
                    vendorErrorMessage: errorMessage,
                }, "VENDOR")
                throw createTraceIdExpiredError("Your search session has expired. Please restart your search and try again.");
            }

            customLog(req?.LogTraceId, "error", {
                message: "[airline:Book] failed",
                endpoint: "Book",
                vendorErrorCode: errorCode,
                vendorErrorMessage: errorMessage,
            }, "VENDOR")
            const vendorErr = new Error(`Unable to proceed with the booking. Please try again.`);
            vendorErr.vendorMessage = errorMessage;
            vendorErr.vendorErrorCode = errorCode;
            throw vendorErr;
        } else {

            // result = await recursiveFetch(result, serviceDetails, config);
            const response = result.data.Response.Response
            const status = response.Status;

            if (status === 6) {
                customLog(req?.LogTraceId, "error", {
                    message: "[airline:Book] TraceId reset (Status 6)",
                    endpoint: "Book",
                    bookingId: response?.BookingId,
                    pnr: response?.PNR,
                    status,
                }, "VENDOR")
                throw createTraceIdExpiredError("Your search session has expired. Please restart your search and try again.");
            }

            if([0, 2, 4, 5].includes(status)) {
                const responseError = response?.Error?.ErrorMessage
                    || result?.data?.Response?.Error?.ErrorMessage;
                customLog(req?.LogTraceId, "error", {
                    message: "[airline:Book] failed (non-success status)",
                    endpoint: "Book",
                    bookingId: response?.BookingId,
                    pnr: response?.PNR,
                    status,
                    responseError,
                }, "VENDOR")
                const statusErr = new Error(`Unable to proceed with the booking. Please try again.`);
                statusErr.vendorMessage = responseError;
                statusErr.vendorStatus = status;
                throw statusErr;
            }

            let passengerFares = []; 
            if(!response.IsPriceChanged) {
                const fareObject = {}; 
                response.FlightItinerary.Passenger.forEach( passenger => {
                    fareObject[passenger.PaxType] = {
                        PaxType: passenger.PaxType, 
                        Fare: {
                            BaseFare: passenger.Fare.BaseFare, 
                            AdditionalTxnFeeOfrd: passenger.Fare.AdditionalTxnFeeOfrd,
                            AdditionalTxnFeePub: passenger.Fare.AdditionalTxnFeePub,
                            Tax: passenger.Fare.Tax,
                            YQTax: passenger.Fare.YQTax
                        }
                    }; 
                })

                passengerFares = Object.values(fareObject);
            }

            const fareDetails = response.FlightItinerary.Fare
            const data = {
                PNR: response.PNR, 
                BookingId: response.BookingId, 
                isPriceChanged: response.IsPriceChanged, 
                isTimeChanged: response.IsTimeChanged, 
                passengerFares: passengerFares, 
                fare: {
                    BaseFare: fareDetails.BaseFare, 
                    Tax: fareDetails.Tax, 
                    PublishedFare: fareDetails.PublishedFare
                },
                FlightItinerary: response.FlightItinerary // Include FlightItinerary to access LastTicketDate
            }
            await applyServiceCommission(data.fare, 'PublishedFare', accessKey, { baseField: 'BaseFare', credentialId: req.user?.id });
            
            customLog(req.LogTraceId, "info", { 
                message: "Prebook response fare (not updating cache - handled at booking level)", 
                traceId: details.TraceId, 
                publishedFare: fareDetails.PublishedFare 
            });

            // Store pending booking for periodic check (persistent across server restarts)
            // Note: This booking API is only for non-LCC flights, so we store for all bookings
            if (data.PNR && data.BookingId) {
                const lastTicketDate = data.FlightItinerary?.LastTicketDate;
                const bookingInfo = {
                    bookingId: data.BookingId,
                    createdAt: new Date().toISOString(),
                    lastTicketDate: lastTicketDate || null,
                    serviceDetails: {
                        vendor: {
                            apiUrl: serviceDetails.vendor.apiUrl,
                            optional4: serviceDetails.vendor.optional4
                        }
                    }
                };
                
                // Store in Redis Set for periodic checking (TTL: 48 hours to cover all cases)
                const pendingBookingKey = `${accessKey}_pendingBookings`;
                await addToSet(pendingBookingKey, JSON.stringify(bookingInfo));
                await setValue(`${accessKey}_pendingBooking_${data.BookingId}`, 48 * 60 * 60, JSON.stringify(bookingInfo));
                
                // If LastTicketDate is very short (within 2 hours), schedule a specific job for this booking
                if (lastTicketDate) {
                    const lastTicketDateTime = new Date(lastTicketDate);
                    const now = new Date();
                    const hoursUntilTicketDate = (lastTicketDateTime - now) / (1000 * 60 * 60);
                    
                    // If LastTicketDate is within 2 hours, schedule a specific job
                    if (hoursUntilTicketDate > 0 && hoursUntilTicketDate <= 2) {
                        const scheduleTime = new Date(lastTicketDateTime.getTime() - 30 * 60 * 1000); // 30 minutes before LastTicketDate
                        if (scheduleTime > now) {
                            scheduleFunction(async () => {
                                await checkAndReleasePNRIfNeeded(data.BookingId, serviceDetails, req.LogTraceId);
                            }, scheduleTime);
                            customLog(req.LogTraceId, "info", { 
                                message: "Scheduled specific ReleasePNRRequest job for short LastTicketDate", 
                                bookingId: data.BookingId,
                                lastTicketDate: lastTicketDate,
                                scheduledTime: scheduleTime.toISOString(),
                                hoursUntilTicketDate: hoursUntilTicketDate.toFixed(2)
                            });
                        }
                    }
                }
                
                customLog(req.LogTraceId, "info", { 
                    message: "Stored pending booking for periodic ReleasePNRRequest check", 
                    bookingId: data.BookingId,
                    createdAt: bookingInfo.createdAt,
                    lastTicketDate: lastTicketDate || "Not provided"
                });
            }
            
            return data;
        }

    } catch (error) {
        if (isTraceIdExpiredError(error)) {
            customLog(req?.LogTraceId, "error", { message: "TraceId expired in booking api", error, errorStack: error?.stack })
            throw createTraceIdExpiredError("Your search session has expired. Please restart your search and try again.");
        }

        if (error?.response?.data) {
            const requestConfig = error.config;
            customLog(
                req?.LogTraceId,
                "error",
                {
                    message: "Flight ticket booking api failed",
                    response: error?.response?.data,
                    request: {
                        url: requestConfig?.url,
                        method: requestConfig?.method,
                        headers: requestConfig?.headers,
                        data: requestConfig?.data
                    },
                    errorStack: error?.stack,
                }
            )
        } else {
            customLog(req?.LogTraceId, "error", { message: "Flight ticket booking api failed", data: error, errorStack: error?.stack })
        }
        throw error;
    }
}

// checks wether the agency balance has enought to make the booking
exports.validateAgencyBalance = asyncHandler( async (req, res, next) => {
    try {
        const { amount, traceId, outbount, inbount } = req.body;
        
        const passengers = req.body.passengers || outbount?.passengers || [];
        const inbountPassengers = inbount?.passengers || [];
        
        const finalTraceId = traceId || outbount?.TraceId;
        if (!finalTraceId) {
            throw new Error("TraceId is required");
        }

        let serviceDetails = await checkService(req)
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            throw new Error(serviceDetails.error)
        }

        const baseFareKey = `${accessKey}-${finalTraceId}-paymentAmount`;
        const cachedAmount = await getValue(baseFareKey);
        if (!cachedAmount) {
            throw new Error("Base fare missing from cache");
        }
        
        // Check if this is a non-LCC flight (has PNR/BookingId from prebook)
        // For non-LCC: Prebook includes SSR in PublishedFare, so cache already has base + SSR
        // For LCC: No prebook, cache has base only, SSR needs to be added
        const isNonLcc = outbount?.PNR || outbount?.BookingId || inbount?.PNR || inbount?.BookingId || outbount?.isLcc === false;
        
        // Add-on amounts come from the client; a negative value would lower the total saved for /payment.
        const hasNegativeAddon = [...(Array.isArray(passengers) ? passengers : []), ...(Array.isArray(inbountPassengers) ? inbountPassengers : [])]
            .some(pax => ['baggageAmount', 'mealAmount', 'seatAmount'].some(field => Number(pax?.[field] || 0) < 0));
        if (hasNegativeAddon) {
            return next(new ErrorResponse("Invalid add-on amount", 400));
        }

        // Calculate SSR addons total from passengers
        let addonsTotal = 0;
        if (Array.isArray(passengers)) {
            for (const pax of passengers) {
                addonsTotal += Number(pax.baggageAmount || 0);
                addonsTotal += Number(pax.mealAmount || 0);
                addonsTotal += Number(pax.seatAmount || 0);
            }
        }
        
        if (Array.isArray(inbountPassengers) && inbountPassengers.length > 0) {
            for (const pax of inbountPassengers) {
                addonsTotal += Number(pax.baggageAmount || 0);
                addonsTotal += Number(pax.mealAmount || 0);
                addonsTotal += Number(pax.seatAmount || 0);
            }
        }
        
        let totalAmount;
        
        if (isNonLcc) {
            // Non-LCC: Cache already includes SSR addons from prebook response
            // Use cached amount directly (it's already base + SSR)
            totalAmount = Number(cachedAmount);
            customLog(req?.LogTraceId, "info", {
                message: "Non-LCC flight: Using cached amount (already includes SSR)",
                cachedAmount,
                totalAmount,
                ssrAddonsInCache: true
            });
        } else if (Number(cachedAmount) === Number(amount)) {
            // If cached amount matches frontend amount, cache already includes SSR
            // This handles cases where cache was updated from prebook but PNR/BookingId not in request
            totalAmount = Number(cachedAmount);
            customLog(req?.LogTraceId, "info", {
                message: "Cache amount matches frontend amount (SSR already included)",
                cachedAmount,
                frontendAmount: amount,
                totalAmount
            });
        } else {
            // LCC: Cache has base fare only, need to add SSR addons
            totalAmount = Number(cachedAmount) + addonsTotal;
            customLog(req?.LogTraceId, "info", {
                message: "LCC flight: Adding SSR addons to base fare",
                cachedBaseFare: cachedAmount,
                addonsTotal,
                totalAmount
            });
        }
        
        // 6. Validate against payload
        customLog(req?.LogTraceId, "info", {
            message: "Amount validation in validateAgencyBalance",
            isNonLcc,
            cachedAmount,
            addonsTotal: isNonLcc || Number(cachedAmount) === Number(amount) ? "N/A (included in cache)" : addonsTotal,
            calculatedTotal: totalAmount,
            receivedAmount: amount,
            outbountPassengersCount: passengers.length,
            inbountPassengersCount: inbountPassengers.length
        });
        if (Number(amount) !== totalAmount) {
            customLog(req?.LogTraceId, "error", {
                message: "Amount mismatch in validateAgencyBalance",
                cachedAmount,
                addonsTotal,
                calculatedTotal: totalAmount,
                receivedAmount: amount,
                difference: Math.abs(totalAmount - amount),
                isNonLcc
            });
            throw new Error("Amount mismatch. Please retry booking.");
        }

        // 7. Update cache with final amount (only if different from cached amount)
        if (Number(cachedAmount) !== totalAmount) {
            await setValue(baseFareKey, 60 * 60, totalAmount);
        }
        // 6. Check agency balance
        const agencyBalance = await findAgencyBalance(
            serviceDetails,
            req?.LogTraceId
        );

        if (agencyBalance < totalAmount) {
            customLog(req?.LogTraceId, "error", {
                message: "Flight booking failed due to insufficient agency balance",
                data: { currentBalance: agencyBalance, requiredAmount: totalAmount },
            });
            throw new Error("Agency insufficient balance");
        }
        res.status(200).json({
            status: true,
            message: "Agency has sufficient balance.",
            responseCode: "000",
            data: { validatedAmount: totalAmount },
        });
    } catch (error) {
        if (error?.response?.data) {
            const requestConfig = error.config;
            customLog(
                req?.LogTraceId, 
                "error", 
                { 
                    message: "Agency balance fetch API failed", 
                    response: error?.response?.data, 
                    request: {
                        url: requestConfig?.url,
                        method: requestConfig?.method,
                        headers: requestConfig?.headers,
                        data: requestConfig?.data
                    }
                }
            )
        } else {
            customLog(req?.LogTraceId, "error", { message: "Agency balance fetch API failed", data: error })
        }
        next(new ErrorResponse("Something went wrong while processing your request.", 500))
    }
})

// process user payment and call vendor ticket api to book ticket
exports.payment = asyncHandler(async (req, res, next) => {
    let serviceDetails = await checkService(req)
    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
        return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 500));
    }

    const { token } = await getSession(serviceDetails)
    if (!token) {
        return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 500));
    }

    let transactionCategory = 'Travel'

    const transactionId = new Date().valueOf().toString();
    const providerId = transactionId

    const name = req.user.name
    let { userContactDetails } = req.body.outbount
    const amount = parseFloat(req.body.outbount.amount)
    const credentialId = req.user.id
    // const emailId = req.user.email
    const corporateTxnId = transactionId

    // zoho credentials
    // const customer_id = req.user.zoho_id;
    let templateDetails;
    templateDetails = await fetchPartnerDetails(req.user.registeredBy)


    let commissionType = serviceDetails.commissionType
    let cashbackType = serviceDetails.cashbackType || 'PERCENTAGE'
    let providerCommission = serviceDetails.providerCommission
    let corporateCashback = serviceDetails.cashback || 0
    let serviceOperatorId = serviceDetails.id
    const surchargeDetails = await calculateSurchargeWithTax(
        serviceDetails.surcharge,
        serviceDetails.surchargeType,
        amount,
        credentialId
    );
    const surcharge = surchargeDetails.surcharge;

    // Each flight's fare (marked up, before the add-ons) was saved at fare quote and prebook; what is paid above them is add-ons (seat, meal, baggage), which carry no commission.
    const flightFaresKey = `${accessKey}-${req.body.outbount.TraceId}-flightFares`;
    const { outbound = 0, inbound = 0 } = JSON.parse((await getValue(flightFaresKey)) || "{}");
    const fareCommission = serviceCommissionFields(serviceDetails);
    const addOns = amountPrecision(amount - outbound - inbound);

    const reportData = await computeJournalData({
        serviceDetails,
        amount,
        planDetails:
            fareCommission && outbound > 0 && addOns >= 0
                ? [
                      { ...fareCommission, amount: outbound },
                      ...(inbound ? [{ ...fareCommission, amount: inbound }] : []),
                      ...(addOns ? [{ amount: addOns }] : []),
                  ]
                : [],
        paymentMethod: "WALLET",
        partnerDetails: templateDetails,
        paymentGatewayName: "WALLET",
        couponTotalDiscount: req.body.couponTotalDiscount,
        corporateState: req.user.state || "",
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

    //first we will  do transaction
    let transactionResponse = {}
    const commonParams = {
        providerId,
        corporateTxnId,
        credentialId,
        serviceOperatorId,
        corporateCashback,
        transactionCategory,
        orderAmount: amount,
        commissionType,
        cashbackType,
        providerCommission,
        surcharge,
        reportData
    };

    try {
        transactionResponse = await createWalletTransaction({
            ...commonParams,
            amount
        });
        if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
            return next(new ErrorResponse(transactionResponse['error'], 400))
        }

        publishJournal("payment");

        // ⚠️⚠️
        // const invoice_id = await createZohoInvoice(customer_id, undefined, corporateTxnId, surchargeWithoutTax, parseFloat(amount).toFixed(2))

        const outbountData = req.body.outbount;

        const walletDetails = await wallet.findOne({
            where: { credentialId },
            attributes: ['balance']
        })

        let result, bookingStatus;
        let booking, inbountBooking;

        let ticketData = {
            name: req.user.name,
            email: userContactDetails?.emailAddress || req.user.email,
            url: `${req.protocol}://${req.get('host')}`,
            orderId: transactionResponse.orderId,
            surcharge: surcharge,
            // invoice_id,
            corporateTxnId,
            paymentDetailAmount: (parseFloat(amount) + parseFloat(surcharge)).toFixed(2),
            registeredBy: req.user.registeredBy,
            passengers: req.body.outbount.passengers,
            EndUserIp: serviceDetails.vendor.optional4,
            TokenId: token,
            TraceId: req.body.outbount.TraceId,
        }
        let mockReq = {
            LogTraceId: req.LogTraceId, 
            user: {
                id: req.user.id,
                role: req.user.role, 
                username: req.user.username,
                subCorporateId: req.user.subCorporateId, 
                registeredBy: req.user.registeredBy
            },
            body: {
                outbount: req.body.outbount, 
                customerInfo: {}
            }
        }
        const inbountData = req.body.inbount;
        const inbountResultIndex = inbountData?.ResultIndex;

        try {
            // Hold both legs first so an inbound failure cannot leave an outbound already ticketed.
            const holdGroupKey = inbountData ? `${req.user.id}-${Date.now()}` : null;
            await holdLegBeforeTicketing({ leg: outbountData, legType: 'OUTBOUND', groupKey: holdGroupKey, serviceDetails, req });
            if (inbountData) {
                await holdLegBeforeTicketing({ leg: inbountData, legType: 'INBOUND', groupKey: holdGroupKey, serviceDetails, req });
            }

            const response = await handleTicketApi(req.LogTraceId, serviceDetails, outbountData.TraceId, outbountData.passengers, outbountData.ResultIndex, outbountData.isLcc, outbountData.PNR, outbountData.BookingId, outbountData.IsPriceChangeAccepted);

            result = response.result
            bookingStatus = response.bookingStatus
            booking = result?.Response;

            if (!response || !response?.result || failedTicketStatus.includes(response?.bookingStatus)) {
                throw new Error("Booking failed from vendor side")
            }

            await createFlightBooking({ booking, transactionResponse, req, traceId: result?.TraceId  })
            await markHoldConsumed(booking?.BookingId, req?.LogTraceId)
            
            // Remove from pending bookings set when payment is completed
            if (booking?.BookingId) {
                const pendingBookingKey = `${accessKey}_pendingBookings`;
                const bookingInfo = await getValue(`${accessKey}_pendingBooking_${booking.BookingId}`);
                if (bookingInfo) {
                    await removeFromSet(pendingBookingKey, bookingInfo);
                    customLog(req.LogTraceId, "info", {
                        message: "Removed booking from pending list after payment completion",
                        bookingId: booking.BookingId
                    });
                }
            }

            if (bookingStatus == 2 || bookingStatus == 5) {
                const date = new Date(Date.now() + 5 * 60 * 1000); // after five minutes
                // MARK: Outbount scheduler
                scheduleFunction(() => {
                    handleFetchStatusAndUpdate(
                        booking.PNR, 
                        booking.BookingId, 
                        req.body.outbount.passengers,
                        serviceDetails, 
                        ticketData,
                        amount,
                        transactionResponse,
                        mockReq,
                        // the rest of the parameters are for inbount booking
                        outbountData.TraceId,
                        inbountResultIndex,
                        inbountData?.passengers, 
                        inbountData?.isLcc, 
                        inbountData?.PNR, 
                        inbountData?.BookingId, 
                        inbountData?.IsPriceChangeAccepted,
                        reportData
                    );
                }, date)
                // call scheduler 
                    // to check status after 5 minutes
                    // if status is success
                        // create db doc
                        // if(inbount) create inbount
                    // else 
                        // initiate full refund
                return res.status(200).json({
                    status: false,
                    message: 'Ticket booking is in progress',
                    responseCode: '001',
                    data: {
                        corporateFinalBalance: walletDetails['balance'],
                        pending: true,
                        details: {
                            message: "The booking status is pending, will let you know once confirmed."
                        }
                    }
                })
            }
        } catch (error) {
            // must use this in transaction events
            // ⚠️⚠️
            // cleverTap.uploadEvent({
            //     eventName: "Transactions",
            //     eventData: {
            //         Status: "Payment Failure",
            //     },
            //     email: emailId,
            // }, templateDetails);
            customLog(req.LogTraceId, 'error', { message: "Ticket API failed", error })

            let errorMessage = 'Something went wrong, please try again later.'
            if (error.vendorResponse) {
                errorMessage = error?.vendorResponse?.Response?.Error?.ErrorMessage
            }

            let updateDetails = {
                corporateTxnId,
                providerId: "Not Available",
                status: "FAILURE",
                message: errorMessage,
                registeredById: req.user.registeredBy
            }
            if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
                const { status } = await cancelPGTransaction(corporateTxnId);
                if (status) {
                    await refundWalletTransaction(updateDetails);
                    publishJournal("refund");
                }
            } else {
                await refundWalletTransaction(updateDetails);
                publishJournal("refund");
            }

        const notificationAmount = (Number(amount) + Number(surcharge)).toFixed(2);
        const notificationData = {
            notificationTitle: 'Flight Booking - Payment unsuccessful',
            notificationBrief: `Payment of ₹ ${notificationAmount} for Flight Booking was unsuccessful. Transaction ID: ${corporateTxnId}.`,
                notificationTo: [req.user.username], // Replace with the user ID or username to send the notification to
                notificationCategory: 'CORPORATE', // Replace with the relevant category
                notificationBy: 'ADMIN' // Replace with the user or system that triggered the notification
            };
            createNotification(notificationData);

            const to = userContactDetails.emailAddress;
            await sendFlightBookingFailedEmail(to, name, templateDetails, req?.LogTraceId);

            // Refund above runs either way; only the code the client sees differs.
            if (error.isTraceIdExpired || isTraceIdExpiredError(error)) {
                return res.status(400).json({
                    status: false,
                    message: "Your search session has expired. Please restart your search and try again.",
                    responseCode: '005',
                    data: {
                        corporateFinalBalance: walletDetails['balance']
                    }
                })
            }

            return res.status(500).json({
                status: false,
                message: 'Ticket booking failed',
                responseCode: '001',
                data: {
                    corporateFinalBalance: walletDetails['balance']
                }
            })
        }

        let inbountResult, inbountBookingStatus;
        if (inbountResultIndex) {
            try {
                const inbountTicketResult = await handleTicketApi(req.LogTraceId, serviceDetails, outbountData.TraceId, inbountData.passengers, inbountResultIndex, inbountData.isLcc, inbountData.PNR, inbountData.BookingId, inbountData.IsPriceChangeAccepted);
                
                inbountResult = inbountTicketResult.result
                inbountBookingStatus = inbountTicketResult.bookingStatus
                inbountBooking = inbountResult?.Response

                if (!inbountTicketResult || !inbountTicketResult.result || failedTicketStatus.includes(inbountTicketResult?.bookingStatus)) {
                    throw new Error("Booking failed from vendor side")
                }

                await createFlightBooking({ booking: inbountBooking, transactionResponse, req, traceId: inbountResult?.TraceId   })
                await markHoldConsumed(inbountBooking?.BookingId, req?.LogTraceId)
                
                // Remove from pending bookings set when payment is completed for return flight
                if (inbountBooking?.BookingId) {
                    const pendingBookingKey = `${accessKey}_pendingBookings`;
                    const bookingInfo = await getValue(`${accessKey}_pendingBooking_${inbountBooking.BookingId}`);
                    if (bookingInfo) {
                        await removeFromSet(pendingBookingKey, bookingInfo);
                        customLog(req.LogTraceId, "info", {
                            message: "Removed return booking from pending list after payment completion",
                            bookingId: inbountBooking.BookingId
                        });
                    }
                }

                if (inbountBookingStatus == 2 || inbountBookingStatus == 5) {
                    // MARK: Inbount scheduler
                    const date = new Date(Date.now() + 5 * 60 * 1000); // after five minutes
                    scheduleFunction(() => {
                        handleFetchStatusAndUpdate(
                            inbountBooking.PNR, 
                            inbountBooking.BookingId, 
                            req.body.inbount.passengers, 
                            serviceDetails, 
                            ticketData,
                            amount, 
                            transactionResponse, 
                            mockReq,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            reportData
                        );
                    }, date)
                    
                }
            } catch (error) {
                // handle partial refund
                // let updateDetails = {
                //     corporateTxnId,
                //     providerId: "Not Available",
                //     status: "FAILURE",
                //     message: "Booking failed",
                //     registeredById: req.user.registeredBy
                // }
                // await refundWalletTransaction(updateDetails);
                customLog(req.LogTraceId, 'error', { message: "Return ticket API failed", error })
            }
        }


        // ⚠️⚠️
        // cleverTap.uploadEvent({
        //     eventName: "Transactions",
        //     eventData: {
        //         Status: "Payment Success",
        //     },
        //     email: emailId,
        // }, templateDetails);

        // if inbount booking is failed reduce payment amount in notification and email
        const successNotificationAmount = (Number(amount) + Number(surcharge)).toFixed(2);
        const notificationData = {
            notificationTitle: 'Flight Booking - Payment successful',
            notificationBrief: `Payment of ₹ ${successNotificationAmount} for Flight Booking was successful. Transaction ID: ${transactionId}.`,
            notificationTo: [req.user.username], // Replace with the user ID or username to send the notification to
            notificationCategory: 'CORPORATE', // Replace with the relevant category
            notificationBy: 'ADMIN' // Replace with the user or system that triggered the notification
        };
        createNotification(notificationData);

        // createExpense({
        //     credentialId,
        //     packageId,
        //     corporateUserId
        // }, {
        //     accounts_id, amount: paymentDetails.amount, credentialId: req.user.id, category: serviceDetails?.serviceCategory,
        //     merchant: serviceDetails?.vendor?.vendorName
        // })

        // ⚠️⚠️
        // await createZohoPaymentRecord({ customer_id, paymentMode: transactionResponse?.paymentMode, reference_number: corporateTxnId, amount: paymentDetails.amount })

        const updateDetails = {
            corporateTxnId,
            providerId: "Not Available",
            status: "SUCCESS",
            orderResponse: JSON.stringify([booking, inbountBooking]),
            message: "Payment Successful"
        }
        await updateWalletTransaction(updateDetails)

        // send agency balance notification
        try {
            const agencyBalance = await findAgencyBalance(serviceDetails, req?.LogTraceId)
            const fieldname = "pekoWebsite"
            const result = await findByEmail({ name: fieldname })
            const to = result.details.emails;
            const body = BalanceEmailTemplate({ CashBalance: agencyBalance }, templateDetails)
            const subject = "Peko India | Airline balance reminder"
            emailer.email(to, subject, body, function () {
                customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
            });
        } catch (error) {
            customLog(req.LogTraceId, 'error', { message: error.message || "Something went wrong while sending agency balance reminder email", err: error })
        }

        //here need to send the ticket to user email
        // MARK: Genearte mail call
        ticketData = {
            ...ticketData,
            PNR: booking?.PNR,
            inbountPNR: inbountBooking?.PNR
        }
        await generateAttachmentAndSendEmailAndNotification(ticketData, req, serviceDetails, (err) => {
            if (err) {
                customLog(req.LogTraceId, 'error', { message: "Flight ticket send confirmation mail failed", data: err })
            } else {
                customLog(req.LogTraceId, 'info', { message: "Flight ticket confirmation mail sent to " + userContactDetails.emailAddress })
            }
        }, reportData);

        return res.status(200).json({
            status: true,
            message: 'Payment Successful',
            responseCode: '000',
            data: {
                ...transactionResponse,
                corporateTxnId
            }
        })
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: "Flight ticket wallet payment failed", data: error })
        return next(new ErrorResponse("Something went wrong while purchasing flight ticket", 500))
    }
})

const handleTicketApi = async (loggerTraceId, serviceDetails, TraceId, passengers, resultIndex, isLcc, PNR, BookingId, IsPriceChangeAccepted) => {
    // Decide the Ticket request shape by the ACTUAL hold state, not the client isLcc flag. A leg
    // that was Hold-booked (has its own PNR + BookingId from /rest/Book) MUST be ticketed by those
    // hold identifiers and must NOT carry ResultIndex — TBO rejects ResultIndex in a hold-Ticket.
    // Only a direct-ticket LCC leg (no hold) uses ResultIndex. This is immune to a wrong/mismatched
    // isLcc (e.g. a non-LCC inbound whose search result was tagged IsLCC=true).
    const isHeldLeg = Boolean(PNR && BookingId);
    if (isLcc && isHeldLeg) {
        customLog(loggerTraceId, "info", {
            message: "[airline:Ticket] isLcc=true but leg is held (PNR+BookingId present) — ticketing by hold identifiers",
            pnr: PNR,
            bookingId: BookingId,
        }, "VENDOR");
    }
    let preparedPassengers = passengers;

    if (!isHeldLeg) {
        // remove ssr properties if they are empty
        preparedPassengers = passengers.map(passenger => {
            if (passenger.SeatDynamic.length === 0) {
                delete passenger.SeatDynamic;
            }
            if (passenger.MealDynamic.length === 0) {
                delete passenger.MealDynamic;
            }
            if (passenger.Baggage.length === 0) {
                delete passenger.Baggage;
            }
            return passenger
        })
    }

    const buildTicketConfig = (tokenId) => {
        const data = isHeldLeg
            ? {
                EndUserIp: serviceDetails.vendor.optional4,
                TokenId: tokenId,
                TraceId: TraceId,
                "PNR": PNR,
                "BookingId": BookingId,
                ...(IsPriceChangeAccepted ? { IsPriceChangeAccepted: true } : {})
            }
            : {
                EndUserIp: serviceDetails.vendor.optional4,
                TokenId: tokenId,
                TraceId: TraceId,
                ResultIndex: resultIndex,
                PreferredCurrency: null,
                Passengers: preparedPassengers
            };

        return {
            method: 'post',
            url: `${serviceDetails.vendor.optional5}/rest/Ticket`,
            headers: {
                'Content-Type': 'application/json',
            },
            data,
            timeout: 300000, // 5 minute
        };
    };

    try {
        const result = await callTboWithRetry({
            buildConfig: buildTicketConfig,
            serviceDetails,
            loggerTraceId,
            endpoint: 'Ticket',
            logRequest: (config, isRetry) => customLog(loggerTraceId, "info", {
                message: `[airline:Ticket] request${isRetry ? ' (retry)' : ''}`,
                endpoint: "Ticket",
                vendorTraceId: TraceId,
                pnr: PNR,
                bookingId: BookingId,
                requestUrl: config.url,
                requestMethod: config.method,
                requestBody: { ...config.data, TokenId: "<redacted>" },
            }, "VENDOR"),
            logResponse: (response, isRetry) => customLog(loggerTraceId, "info", {
                message: `[airline:Ticket] response${isRetry ? ' (retry)' : ''}`,
                endpoint: "Ticket",
                statusCode: response?.status,
                bookingId: response?.data?.Response?.Response?.BookingId,
                pnr: response?.data?.Response?.Response?.PNR,
                ticketStatus: response?.data?.Response?.Response?.TicketStatus,
                flightStatus: response?.data?.Response?.Response?.FlightStatus,
                vendorErrorCode: response?.data?.Response?.Error?.ErrorCode,
                vendorErrorMessage: response?.data?.Response?.Error?.ErrorMessage,
                responseData: response?.data,
            }, "VENDOR"),
        });

        if (result && result?.data?.Response?.Error?.ErrorCode !== 0) {
            if (isTraceIdExpiredError(result.data)) {
                customLog(loggerTraceId, "error", {
                    message: "[airline:Ticket] TraceId expired",
                    endpoint: "Ticket",
                    vendorErrorCode: result?.data?.Response?.Error?.ErrorCode,
                    vendorErrorMessage: result?.data?.Response?.Error?.ErrorMessage,
                }, "VENDOR")
                throw createTraceIdExpiredError("Your search session has expired. Please restart your search and try again.");
            }
            throw new Error("Booking failed from vendor side")
        }
        // result = await recursiveFetch(result, serviceDetails, config);

        return {
            result: result.data.Response,
            bookingStatus: result?.data?.Response?.Response?.TicketStatus
        }
    } catch (error) {
        if (isTraceIdExpiredError(error)) {
            customLog(loggerTraceId, "error", {
                message: "[airline:Ticket] TraceId expired",
                endpoint: "Ticket",
                errorMessage: error?.message,
                vendorErrorCode: error?.response?.data?.Response?.Error?.ErrorCode,
                vendorErrorMessage: error?.response?.data?.Response?.Error?.ErrorMessage,
            }, "VENDOR")
            throw createTraceIdExpiredError("Your search session has expired. Please restart your search and try again.");
        }

        if (axios.isAxiosError(error) && error.code === 'ECONNABORTED' && isHeldLeg) {
            customLog(loggerTraceId, "info", {
                message: "[airline:Ticket] timeout — returning synthetic in-progress result",
                endpoint: "Ticket",
                bookingId: BookingId,
                pnr: PNR,
                errorCode: error?.code,
            }, "VENDOR")
            // incase of time out (non lcc), return a result with booking, pnr and inprogress ticket status
            return {
                result: {
                    Response: {
                        BookingId,
                        PNR,
                        TicketStatus: 2,
                    }
                },
                bookingStatus: 2
            }
        }
        customLog(loggerTraceId, "error", {
            message: "[airline:Ticket] error",
            endpoint: "Ticket",
            bookingId: BookingId,
            pnr: PNR,
            errorMessage: error?.message,
            statusCode: error?.response?.status,
            errorCode: error?.code,
            vendorErrorCode: error?.response?.data?.Response?.Error?.ErrorCode,
            vendorErrorMessage: error?.response?.data?.Response?.Error?.ErrorMessage,
            responseData: error?.response?.data,
            errorStack: error?.stack,
        }, "VENDOR")
        const err = new Error("Booking failed from vendor side");
        err.vendorResponse = error.response?.data;
        err.statusCode = error.response?.status || 500;
        throw err;

    }
}

// MARK: Schedule function
const handleFetchStatusAndUpdate = async function(pnr, bookingId, passengers, serviceDetails, ticketData, amount, transactionResponse, req, TraceId, inbountResultIndex, inbountPassengers, inbountDataIsLcc, inbountDataPNR, inbountDataBookingId, inbountDataIsPriceChangeAccepted, reportData) {
    const publishRefundJournal = () => {
        if (!reportData) return;
        publishJournalEvent(
            {
                transactionRef: ticketData?.corporateTxnId || transactionResponse?.corporateTxnId,
                type: "refund",
                contextSnapshot: {
                    credentialId: req?.user?.id || null,
                    vendor: serviceDetails?.vendor || null,
                    registeredBy: req?.user?.registeredBy || null,
                },
                reportData,
            },
            req?.LogTraceId
        );
    };
    const { token } = await getSession(serviceDetails)
    if (!token) {
        return;
        // return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 500));
    }

    const leadPax = passengers.filter((passenger) => {
        return passenger.IsLeadPax
    })[0]

    const payload = { 
        token, 
        BookingId: bookingId, 
        PNR: pnr, 
        firstName: leadPax.FirstName, 
        lastName: leadPax.LastName, 
        serviceDetails, 
        LogTraceId: null
    }

    let { status, booking } = await retrieveBooking(payload)
    if (!status) {
        // do we need to schedule again
        return;
    }
    
    const ticketStatus = booking.Status;
    let inbountBooking; 
    if(ticketStatus === 5) {
        await updateTicketDataByPNR(
            pnr, 
            {
                bookingStatus: "Successful", 
                journey: booking.Segments,
                passengers: booking.Passenger,
                fare: booking.Fare,
            }
        )

        if(inbountResultIndex) {
            try {
                const inbountTicketResult = await handleTicketApi(null, serviceDetails, TraceId, inbountPassengers, inbountResultIndex, inbountDataIsLcc, inbountDataPNR, inbountDataBookingId, inbountDataIsPriceChangeAccepted);
                if (!inbountTicketResult || !inbountTicketResult.result || failedTicketStatus.includes(inbountTicketResult?.bookingStatus)) {
                    throw new Error("Booking failed from vendor side")
                }
                let inbountResult = inbountTicketResult.result
                let inbountBookingStatus = inbountTicketResult.bookingStatus
                inbountBooking = inbountResult?.Response

                await createFlightBooking({ booking: inbountBooking, transactionResponse, req, traceId: inbountResult?.TraceId   })
                await markHoldConsumed(inbountBooking?.BookingId, req?.LogTraceId)
                
                // Remove from pending bookings set when payment is completed for return flight
                if (inbountBooking?.BookingId) {
                    const pendingBookingKey = `${accessKey}_pendingBookings`;
                    const bookingInfo = await getValue(`${accessKey}_pendingBooking_${inbountBooking.BookingId}`);
                    if (bookingInfo) {
                        await removeFromSet(pendingBookingKey, bookingInfo);
                        customLog(req.LogTraceId, "info", {
                            message: "Removed return booking from pending list after payment completion",
                            bookingId: inbountBooking.BookingId
                        });
                    }
                }

                if (inbountBookingStatus == 2 || inbountBookingStatus == 5) {
                    const date = new Date(Date.now() + 5 * 60 * 1000); // after five minutes
                    scheduleFunction(() => {
                        handleFetchStatusAndUpdate(inbountBooking.PNR, inbountBooking.BookingId, inbountBooking.FlightItinerary.Passenger, serviceDetails, ticketData);
                    }, date)
                }
            } catch (error) {
                // The first flight costs the customer its marked-up fare (saved at fare quote and prebook) plus its add-ons; the rest is refunded. Without the saved fare, TBO's total for it.
                const { outbound = 0 } = JSON.parse((await getValue(`${accessKey}-${TraceId}-flightFares`)) || "{}");
                const outboundAddOns = ["TotalBaggageCharges", "TotalMealCharges", "TotalSeatCharges"].reduce((sum, field) => sum + (Number(booking.Fare?.[field]) || 0), 0);
                const totalOutbountAmount = outbound ? outbound + outboundAddOns : Number(booking.Fare?.PublishedFare);
                const totalInbountAmount = Math.max(0, amountPrecision(amount - totalOutbountAmount));
                // handle partial refund
                // let updateDetails = {
                //     corporateTxnId,
                //     providerId: "Not Available",
                //     status: "FAILURE",
                //     message: "Booking failed",
                //     registeredById: req.user.registeredBy
                // }
                // await refundWalletTransaction(updateDetails);
                const updateDetails = {
                    corporateTxnId: transactionResponse.corporateTxnId, 
                    registeredById: req.user.registeredBy, 
                    partialRefund: {
                        status: true, 
                        walletRefund: totalInbountAmount
                    }
                }
                // if (ticket.order.paymentMode === 'PAYMENT GATEWAY') {
                //     const { status } = await cancelPGTransaction(ticket.order.corporateTxnId, ticket.refundedAmount);
                //     if (status) {
                //         await refundWalletTransaction(updateDetails);
                //     }
                // } else {
                    await refundWalletTransaction(updateDetails);
                    publishRefundJournal();
                // }
                customLog(req.LogTraceId, 'error', { message: "Return ticket API failed", error })
            }
        }

        ticketData = {
            ...ticketData,
            PNR: booking?.PNR,
            inbountPNR: inbountBooking?.PNR,
        }
        await generateAttachmentAndSendEmailAndNotification(ticketData, req, serviceDetails, (err) => {
            if (err) {
                customLog(req.LogTraceId, 'error', { message: "Flight ticket send confirmation mail failed", data: err })
            } else {
                customLog(req.LogTraceId, 'info', { message: "Flight ticket confirmation mail sent to " + req.body.outbount.userContactDetails.emailAddress })
            }
        }, reportData);
    }
    else if(ticketStatus === 4) {
        // still in progress
        // do we need to put another scheduler
        customLog(req.LogTraceId, 'error', { message: "Flight ticket status scheduler triggered: ticket status is 'in progress' again", booking})
    }
    else {
        let updateDetails = {
            corporateTxnId: transactionResponse.corporateTxnId,
            providerId: "Not Available",
            status: "FAILURE",
            message: "Something went wrong while booking ticket.",
            registeredById: req.user.registeredBy
        }
        // if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
        //     const { status } = await cancelPGTransaction(transactionResponse.corporateTxnId);
        //     if (status) {
        //         await refundWalletTransaction(updateDetails);
        //     }
        // } else {
            await refundWalletTransaction(updateDetails);
            publishRefundJournal();
        // }

        const notificationData = {
            notificationTitle: 'Flight Booking - Payment unsuccessful',
            notificationBrief: `Payment of ₹ ${amount} for Flight Booking was unsuccessful. Transaction ID: ${transactionResponse.corporateTxnId}.`,
            notificationTo: [req.user.username], // Replace with the user ID or username to send the notification to
            notificationCategory: 'CORPORATE', // Replace with the relevant category
            notificationBy: 'ADMIN' // Replace with the user or system that triggered the notification
        };
        createNotification(notificationData);

        let templateDetails = req.user.registeredBy ? await fetchPartnerDetails(req.user.registeredBy) : await partnerLogos()
        const to = req.body.outbount.userContactDetails.emailAddress;
        await sendFlightBookingFailedEmail(to, name, templateDetails, req?.LogTraceId);
    }
}

// fetch all user booking, fetch latest status from vendor and initiate refund
exports.listAllBookings = asyncHandler(async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const availability = req.query.availability;
        const credentialId = req.user.id;

        const bookingData = await fetchAllFlightBookings({ credentialId, limit, page, availability });
        
        if (!bookingData) {
            return next(new ErrorResponse("No bookings found", 404));
        }
        
        const bookingsPendingCancellation = bookingData.rows.filter( (item) => {
            if(item.bookingStatus === "CANCELLED_REQUEST_FOR_REFUND")
                    return true;
        })

        if(bookingsPendingCancellation.length != 0) {
            let serviceDetails = await checkService(req)
            if (!Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
                for (const item of bookingsPendingCancellation) {
                    await updateChangeRequestStatus(
                      item,
                      serviceDetails,
                      req.user.registeredBy,
                      req?.LogTraceId
                    );
                }
            }

        }

        // merge flight ticket with same orderId;
        const bookingObj = {};
        bookingData.rows.forEach( curr => {
            const orderId = curr.orderId; 
            if(bookingObj[orderId]) {
                bookingObj[orderId].push(curr)
            }
            else {
                bookingObj[orderId] = [curr];
            }
        })

        let booking = Object.values(bookingObj).map( curr => {
            const journey1 = curr[0]; 
            const journey2 = curr[1]

            let inbount, outbount;
            if(journey2) {
                // find which one is first
                const j1Depart = (journey1?.journey[0]?.Origin?.DepTime)
                const j2Depart = (journey2?.journey[0]?.Origin?.DepTime)

                if(j1Depart && j2Depart) {
                    const j1DepartDate = new Date(j1Depart);
                    const j2DepartDate = new Date(j2Depart);

                    if(j1DepartDate < j2DepartDate) {
                        outbount = journey1;
                        inbount = journey2; 
                    }
                    else {
                        outbount = journey2; 
                        inbount = journey1;
                    }
                }
                else {
                    outbount = journey1; 
                    inbount = journey2;
                }
                outbount.inbountPNR = inbount.PNR; 
                outbount.inbountBookingId = inbount.BookingId; 
                outbount.inbountJourney = inbount.journey
                outbount.inbountId = inbount.id
                outbount.inbountBookingStatus = inbount.bookingStatus
            }
            else {
                outbount = journey1;
            }
            return outbount;
        })

        booking = booking.sort( (a, b) => new Date(b.createdAt) - new Date(a.createdAt))

        // Return a standard success response
        return res.status(200).json({
            status: true,
            message: "Bookings fetched successfully",
            responseCode: "000",
            data: {
                page: page,
                limit: limit,
                count: bookingData.count,
                bookings: booking,
            },
        });
    } catch (error) {
      customLog(req?.LogTraceId, "error", { message: error?.message, error: error })
      return next(new ErrorResponse("Something went wrong", 400));
    }
});

// fetch details of one flight ticket
exports.fetchOneBooking = asyncHandler(async (req, res, next) => {
    try {
        let { id } = req.query
        let serviceDetails = await checkService(req)
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse(`Apologies, the service you are trying to access is currently unavailable.`, 404));
        }
   
        const { token } = await getSession(serviceDetails)
        if(!token) {
            throw new Error("Fetch authentication token failed")
        }


        let flightBooking = await findFlightBookingByOrderID(id, req.user.id)
        if(!flightBooking || flightBooking.length === 0) {
            return next(new ErrorResponse("Unable to fetch ticket details, please try again later", 404))
        }
        
        const journey1 = flightBooking[0];
        let outbount = journey1;
        
        const journey2 = flightBooking[1];
        if(journey2) {
            outbount = mergeDomesticRoundTripTickets(journey1, journey2)
        }
        
        return res.status(200).json({
            status: true,
            message: 'Bookings fetched successfully',
            responseCode: '000',
            data: outbount
        })
    } catch (error) {
        if (error?.response?.data) {
            customLog(req?.LogTraceId, "error", { message: "Flight Details fetch failed", data: error?.response?.data })
        } else {
            customLog(req?.LogTraceId, "error", { message: "Flight Details fetch failed", data: error })
        }
        return next(new ErrorResponse("Something went wrong", 400))
    }
});

// eslint-disable-next-line no-unused-vars
const handeUpdateOrderStatus = async (flightBooking, serviceDetails, token, req) => {
    let order = await flightBooking.order
    const leadPax = flightBooking.passengers.filter((passenger) => {
        return passenger.IsLeadPax
    })[0]
        
    let orderResponse = JSON.parse(order?.orderResponse) || false
    let { BookingId, PNR } = flightBooking
    if (!orderResponse || !BookingId || !PNR || !leadPax) {
        throw new Error("Unable to find ticket details, please try again later")
    }
        
    //retrieve booking and check status
    let { status, booking } = await retrieveBooking({ token, BookingId, PNR, serviceDetails, firstName: leadPax.FirstName, lastName: leadPax.LastName, LogTraceId: req.LogTraceId })
    if (!status) {
        // ⚠️⚠️ whats here
        return flightBooking;
    }

    if(booking.TicketStatus){
        flightBooking.bookingStatus = ticketStatus[booking.TicketStatus]
    }
    flightBooking.passengers = booking.Passenger

    orderResponse.data = booking
    order.orderResponse = JSON.stringify(orderResponse)
    await order.save()
    let savedFlightBooking = await flightBooking.save()

    return savedFlightBooking
}

// Generate and send an OTP to the user's provided contact email when initiating a ticket cancellation request
exports.getOtpCancel = asyncHandler(async (req, res, next) => {
    let { scope, id } = req.query;
    let templateDetails = await fetchPartnerDetails();
    let otp;    
  
    // Owner-scoped: otherwise any user could trigger OTP emails for — or, when the booking has
    // no contact email, receive the OTP for — someone else's booking.
    const flightDetails = id ? await findOneFlightBookingWithAllDetails({ id, credentialId: req.user.id }) : null
    if(!flightDetails) {
      return next(new ErrorResponse("Unable to find flight booking details", 400))
    }
    if (scope == "email") {
        const to = flightDetails.userContactDetails?.email || req.user.email; 
        //it will create a bycrypted otp in db and return the created otp to send via email
        otp = await createOtp({ contact: to });
        if (!otp) {
            return res.status(500).json({ status: false, message: "Failed to create OTP.", responseCode: '001', data: {} });
        }
        //Sending Email with otp
        const otpFallbackSubject = "Your OTP for Flight Booking Cancellation ";
        const resolvedOtp = await resolveEmailTemplate({
            key: EMAIL_TEMPLATE_KEYS.FLIGHT_CANCELLATION_OTP,
            service: EMAIL_TEMPLATE_SERVICES.FLIGHT,
            variables: {
                name: req.user.name,
                otp,
                branding: templateDetails?.branding || 'Peko',
                website: templateDetails?.website || 'https://www.peko.one',
                ...v2LayoutVariables(templateDetails),
            },
            fallback: () => flightCancellationOTPTemplate(req.user.name, otp, templateDetails),
            fallbackSubject: otpFallbackSubject,
            logTraceId: req?.LogTraceId,
        });
        await emailer.email(to, resolvedOtp.subject, resolvedOtp.html);
      
    }
    return res.status(200).json({
        status: true,
        message: "OTP sent successfully via email.",
        data: process.env.NODE_ENV !== "production" ? { otp } : {},
        responseCode: '000'
      });
});

// validate otp and call cancel vendor api
exports.cancelBooking = asyncHandler(async (req, res, next) => {
	const { flightBookingId, otp, scope, reasonForCancellation } = req.body
	let serviceDetails = await checkService(req)

	let flightBooking = flightBookingId
		? await findOneFlightBookingWithAllDetails({ BookingId: flightBookingId, credentialId: req.user.id })
		: null
    if(!flightBooking) {
        return next(new ErrorResponse("Unable to find flight bookind details", 400))
    }

	// validate otp start ----------------------------
	if (scope === 'email') {
        const to = flightBooking.userContactDetails?.email || req.user.email; 
		let result = await verifyOtp({ contact: to, otp: otp, context: 'email' })
		if (result.isVerified === false) {
			return res.status(401).json({ status: false, message: result.message, data: {}, responseCode: '001' });
		}
	} else {
		return next(new ErrorResponse('OTP verification failed due to invalid scope or an unexpected error.', 400))
	}
	// validate otp ends ----------------------------



	// fetch the flight booking doc
	let { bookingStatus, transaction } = flightBooking
	let corporateTxnId = transaction?.corporateTxnId
	
	if (!corporateTxnId || !flightBooking) return next(new ErrorResponse('No transactions found!', 404))
	if (bookingStatus == 'CANCELLED_REQUEST_FOR_REFUND') return next(new ErrorResponse('Already cancelled and requested for refund', 400))
	if (bookingStatus == 'CANCELLED_AND_REFUNDED') return next(new ErrorResponse('Already cancelled and refunded', 400))


    let result;
	if (bookingStatus === 'Successful') {
		result = await handleAirCancellationByApi({ flightBooking, serviceDetails, user: req.user, reasonForCancellation, LogTraceId: req?.LogTraceId })
	} else {
		return next(new ErrorResponse('Unable to cancel this ticket', 400))
	}

  let { status, message = '', data = {} } = result
  if (!status) {
      return res.status(400).json({
          status: false,
          message: message,
          responseCode: '001',
          data: data
      })
  }
  return res.status(200).json({
      status: true,
      message: 'Ticket cancelled successfully',
      responseCode: '000',
      data: data
  })
})

// fetch cancelation charges from the vendor and returns
exports.cancellationCharges = asyncHandler(async (req, res, next) => {
    let { id: BookingId } = req.body;
    let serviceDetails = await checkService(req)

    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse(serviceDetails.error, 400))
    }

    const ownBooking = BookingId
        ? await findOneFlightBookingWithAllDetails({ BookingId, credentialId: req.user.id })
        : null;
    if (!ownBooking) {
        return next(new ErrorResponse("Unable to find flight booking details", 400))
    }

    const buildCancellationChargesConfig = (tokenId) => ({
        method: 'post',
        url: `${serviceDetails.vendor.apiUrl}/rest/GetCancellationCharges`,
        headers: {
            'Content-Type': 'application/json',
        },
        data: JSON.stringify({
            EndUserIp: serviceDetails.vendor.optional4,
            TokenId: tokenId,
            BookingId: BookingId,
        }),
        timeout: 60000,
    });

    try {
        const result = await callTboWithRetry({
            buildConfig: buildCancellationChargesConfig,
            serviceDetails,
            loggerTraceId: req?.LogTraceId,
            endpoint: 'GetCancellationCharges',
            logRequest: (config, isRetry) => customLog(req?.LogTraceId, "info", {
                message: `[airline:GetCancellationCharges] request${isRetry ? ' (retry)' : ''}`,
                endpoint: "GetCancellationCharges",
                bookingId: BookingId,
                requestUrl: config.url,
                requestMethod: config.method,
                requestBody: { ...JSON.parse(config.data), TokenId: "<redacted>" },
            }, "VENDOR"),
            logResponse: (response, isRetry) => customLog(req?.LogTraceId, "info", {
                message: `[airline:GetCancellationCharges] response${isRetry ? ' (retry)' : ''}`,
                endpoint: "GetCancellationCharges",
                statusCode: response?.status,
                bookingId: BookingId,
                cancellationCharge: response?.data?.Response?.CancellationCharge,
                refundAmount: response?.data?.Response?.RefundAmount,
                vendorErrorCode: response?.data?.Response?.Error?.ErrorCode,
                vendorErrorMessage: response?.data?.Response?.Error?.ErrorMessage,
                responseData: response?.data,
            }, "VENDOR"),
        });

        if(!result || result.data.Response.Error?.ErrorCode) {
            throw new Error("Fetch cancelation charge failed from vendor side")
        }

        return res.status(200).json({
            status: true,
            message: "Cancellation charges fetched successfully",
            responseCode: "000",
            data: result.data.Response,
          });

    } catch (error) {
        customLog(req?.LogTraceId, "error", {
            message: "[airline:GetCancellationCharges] error",
            endpoint: "GetCancellationCharges",
            bookingId: BookingId,
            errorMessage: error?.message,
            statusCode: error?.response?.status,
            errorCode: error?.code,
            vendorErrorCode: error?.response?.data?.Response?.Error?.ErrorCode,
            vendorErrorMessage: error?.response?.data?.Response?.Error?.ErrorMessage,
            responseData: error?.response?.data,
            errorStack: error?.stack,
        }, "VENDOR")
        next( new ErrorResponse("We are unable to process your cancellation request at the moment. Please try again later or contact customer support for assistance.", 500))
    }
});

// ticket pdf download
// Generate the flight-ticket PDF with bounded retries + strict validation. The ticket PDF is a
// mandatory deliverable, so we retry a few times before giving up: the pooled, font-guarded renderer
// makes a single attempt succeed in almost all cases, and the retries cover rare transient failures
// (a chromium crash, a transient blip) with short backoff. A valid PDF must have status=true, be a
// Buffer > 1024 bytes, and start with the "%PDF" magic header (catches 0-byte timeouts and any
// non-PDF error buffer). Returns { isValidPdf, buffer }. Used by every airline ticket-PDF path below.
// Repeating page footer for the ticket PDF: Peko contact + "Page X of Y" on every page (via
// Puppeteer displayHeaderFooter), so a multi-page ticket is clearly a set and a partial print is
// obviously incomplete. pageNumber/totalPages are substituted by Puppeteer.
const TICKET_PDF_FOOTER = `<div style="width:100%; font-family:Arial,Helvetica,sans-serif; font-size:8px; color:#666; padding:0 12mm; box-sizing:border-box;"><table style="width:100%; border-collapse:collapse;"><tr><td style="text-align:left;">Peko Helpline: 022 489 30373 &nbsp;&middot;&nbsp; reach@peko.one</td><td style="text-align:right;">Page <span class="pageNumber"></span> of <span class="totalPages"></span> &nbsp;&middot;&nbsp; www.peko.one</td></tr></table></div>`;

// Web-font hosts. The airline ticket template links Google Fonts; a PENDING font request makes
// page.pdf() hang until the timeout (the "PDF generation timed out" root cause). Aborting web fonts
// lets Chromium fall back to system fonts immediately — a PDF must never BLOCK on a remote font.
const FONT_HOST_DENYLIST = ["fonts.googleapis.com", "fonts.gstatic.com", "use.typekit.net"];

const generateFlightTicketPdf = async (html, traceId) => {
    const MAX_PDF_ATTEMPTS = 3;
    const PAGE_TIMEOUT_MS = 60000;
    const IMAGE_WAIT_MS = 8000;
    let buffer = null;
    let isValidPdf = false;

    for (let attempt = 1; attempt <= MAX_PDF_ATTEMPTS; attempt += 1) {
        let browser = null;
        const outputFile = `flight-ticket-${traceId || "na"}-${new Date().valueOf()}-${attempt}.pdf`;
        try {
            // eslint-disable-next-line no-await-in-loop
            browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"] });
            // eslint-disable-next-line no-await-in-loop
            const page = await browser.newPage();

            // The logo is inlined as a data URI, so web fonts are the only remaining external
            // resource that can block the print — abort them (data: URIs and images pass through).
            // eslint-disable-next-line no-await-in-loop
            await page.setRequestInterception(true);
            page.on("request", (request) => {
                try {
                    const url = request.url();
                    if (url.startsWith("data:")) {
                        request.continue();
                        return;
                    }
                    if (request.resourceType() === "font" || FONT_HOST_DENYLIST.some((host) => url.includes(host))) {
                        request.abort();
                        return;
                    }
                    request.continue();
                } catch (_) {
                    try { request.continue(); } catch (__) { /* request already handled */ }
                }
            });

            // eslint-disable-next-line no-await-in-loop
            await page.setContent(html, { waitUntil: "domcontentloaded", timeout: PAGE_TIMEOUT_MS });

            // eslint-disable-next-line no-await-in-loop
            await Promise.race([
                page.evaluate(
                    () => Promise.all(
                        Array.from(document.images || []).map((img) => (img.complete
                            ? Promise.resolve()
                            : new Promise((resolve) => {
                                const t = setTimeout(resolve, 5000);
                                img.addEventListener("load", () => { clearTimeout(t); resolve(); });
                                img.addEventListener("error", () => { clearTimeout(t); resolve(); });
                            })))
                    )
                ),
                new Promise((resolve) => { setTimeout(resolve, IMAGE_WAIT_MS); }),
            ]);

            // Print to a temp file and read it back — the same mechanism the subscription invoice
            // PDF uses (stable in staging): a fresh browser per render, printed to disk, no shared
            // browser pool. The temp file is cleaned up in the finally block.
            // eslint-disable-next-line no-await-in-loop
            await page.pdf({
                path: outputFile,
                format: "A4",
                preferCSSPageSize: false,
                displayHeaderFooter: true,
                headerTemplate: '<span></span>',
                footerTemplate: TICKET_PDF_FOOTER,
                margin: { top: '6mm', bottom: '16mm', left: '0mm', right: '6mm' },
                timeout: PAGE_TIMEOUT_MS,
            });
            buffer = fs.readFileSync(outputFile);

            const pdfHeader = Buffer.isBuffer(buffer) ? buffer.subarray(0, 4).toString() : "";
            isValidPdf = Buffer.isBuffer(buffer) && buffer.length > 1024 && pdfHeader === "%PDF";
            if (isValidPdf) break;

            customLog(traceId, "error", {
                message: "Flight ticket PDF attempt produced invalid output, will retry",
                attempt,
                maxAttempts: MAX_PDF_ATTEMPTS,
                reason: `Invalid PDF buffer (${buffer?.length || 0} bytes, header: ${pdfHeader || "empty"})`,
                htmlLength: html?.length || 0,
            });
        } catch (err) {
            customLog(traceId, "error", {
                message: "Flight ticket PDF attempt threw, will retry",
                attempt,
                maxAttempts: MAX_PDF_ATTEMPTS,
                errorMessage: err?.message || String(err),
                errorStack: err?.stack,
                htmlLength: html?.length || 0,
            });
        } finally {
            try { if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile); } catch (_) { /* temp file already gone */ }
            if (browser) {
                try {
                    // eslint-disable-next-line no-await-in-loop
                    await browser.close();
                } catch (_) { /* browser already gone */ }
            }
        }
        if (attempt < MAX_PDF_ATTEMPTS) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise((resolve) => { setTimeout(resolve, 1500 * attempt); });
        }
    }

    return { isValidPdf, buffer };
};

exports.downloadBookingTicket = asyncHandler(async (req, res, next) => {
    try {
        let serviceDetails = await checkService(req)
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse(serviceDetails.error, 400))
        }

        const { token } = await getSession(serviceDetails)
        if(!token) {
            throw new Error("Fetch authentication token failed")
        }
    

        const flightDetails = await findFlightBookingByOrderID(req.query.orderId, req.user.id)
        if(!flightDetails || flightDetails.length === 0) {
            return next(new ErrorResponse("Couldn't find flight details", 404))
        }

        const journey1 = flightDetails[0];
        let flightData = journey1; 

        const journey2 = flightDetails[1];
        if(journey2) {
            flightData = mergeDomesticRoundTripTickets(journey1, journey2)
        }

        const data = {
            name: req.user.name,
            email: flightData.userContactDetails.email,
            url: `${req.protocol}://${req.get('host')}`,
            orderId: req.query.orderId,
            surcharge: formatNumberWithLocalString(flightData.order.surcharge),
            // invoice_id,
            corporateTxnId: flightData.order.corporateTxnId,
            paymentDetailAmount: parseFloat( flightData.order.amountInINR ).toFixed(2),
            registeredBy:req.user.registeredBy, 
            passengers: flightData.passengers, 
            
            PNR: flightData.PNR,
            EndUserIp: serviceDetails.vendor.optional4,
            TokenId: token,
            TraceId: req.body.TraceId,
            inbountPNR: flightData.inbountPNR
        }
        
        const ticketData = await createDataForFlightTicket(data, serviceDetails)

        let templateDetails = await fetchPartnerDetails(data?.registeredBy)
        // Inline the logo as a data URI so it renders in the PDF without the headless browser
        // needing network egress to the logo CDN.
        templateDetails = { ...templateDetails, logo: await fetchAsDataUri(templateDetails?.logo) };

        const html = airLineTicketTemplate({ ...ticketData, ...data }, templateDetails);
        const { isValidPdf, buffer } = await generateFlightTicketPdf(html, req?.LogTraceId);
        if (!isValidPdf) {
            // Retries exhausted — surface the failure so the client can retry the download.
            return next(new ErrorResponse("Error generating PDF", 500))
        }
        const pdfBaseName = (ticketData?.pdfName || "Flight Ticket").replace(/\.pdf$/i, "");
        return res.status(200).json({
            status: true,
            message: 'Ticket fetched successfully',
            responseCode: '000',
            data: {
                pdfFile: buffer,
                pdfBase64: buffer.toString("base64"),
                pdfSize: buffer.length,
                pdfName: `${pdfBaseName}.pdf`
            }
        })
      
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: "Flight ticket generate pdf failed", error})
        next(new ErrorResponse("Something went wrong while generating ticket", 500))
    }
})

// send ticket booking confirmation mail
// Upper bound on how long the ticket mailer may run before an awaiting caller is released. The
// mailer is callback-based, so this guards against a transport that never invokes its callback and
// would otherwise hang any caller awaiting delivery.
const TICKET_DELIVERY_TIMEOUT_MS = 120000;

async function generateAttachmentAndSendEmailAndNotification(data, req, serviceDetails, callback, reportData) {
    try {
        const ticketData = await createDataForFlightTicket(data, serviceDetails)
        
        const { ticketReceiverEmailId } = ticketData
        const templateDetails = data?.registeredBy ? await fetchPartnerDetails(data?.registeredBy) : await partnerLogos()
        // Inline the logo as a data URI so it renders in the PDF without the headless browser
        // needing network egress to the logo CDN. Kept separate from templateDetails (used below
        // for the actual email) since an email client just needs the real logo URL, not a data URI.
        const pdfTemplateDetails = { ...templateDetails, logo: await fetchAsDataUri(templateDetails?.logo) };

        const html = airLineTicketTemplate({ ...ticketData, ...data }, pdfTemplateDetails);
        customLog(req?.LogTraceId, "info", { message: "HTML created, create pdf buffer"})
        // Retry generation (the ticket PDF is a mandatory deliverable). On final failure, send the
        // confirmation WITHOUT a broken/empty attachment and log it (visible in Logtail) — the booking
        // already succeeded, so the customer is still notified and the ticket can be re-sent.
        const { isValidPdf: pdfValid, buffer } = await generateFlightTicketPdf(html, req?.LogTraceId);
        if (pdfValid) {
            customLog(req?.LogTraceId, "info", { message: "PDF buffer created", bufferSize: buffer.length })
        } else {
            customLog(req?.LogTraceId, "error", {
                message: "Flight ticket PDF generation failed after retries — sending confirmation email without attachment",
                htmlLength: html?.length || 0,
            })
        }

        const pdfBaseName = (ticketData?.pdfName || "Flight Ticket").replace(/\.pdf$/i, "");
        const files = pdfValid ? [{ filename: `${pdfBaseName}.pdf`, content: buffer }] : []
        const fallbackSubject = "Your flight ticket confirmed";
        const resolved = await resolveEmailTemplate({
            key: EMAIL_TEMPLATE_KEYS.FLIGHT_CONFIRMATION,
            service: EMAIL_TEMPLATE_SERVICES.FLIGHT,
            variables: {
                userName: ticketData?.userName,
                branding: templateDetails?.branding || 'Peko',
                website: templateDetails?.website || 'https://www.peko.one',
                baseUrl: templateDetails?.baseUrl,
                ...v2LayoutVariables(templateDetails),
            },
            fallback: () => flightConfirmationTemplate(ticketData, templateDetails),
            fallbackSubject,
            partnerId: data?.registeredBy || null,
            logTraceId: req?.LogTraceId,
        });
        const subject = resolved.subject;
        const body = resolved.html;

        const grossAmount =
            parseFloat(data?.paymentDetailAmount || 0) - parseFloat(data?.surcharge || 0);
        const orderId =
            data?.orderId ?? (await findOneOrderByTxnId(data?.corporateTxnId))?.id;
        const planDetails = [{
            name: data?.PNR ? `Flight Booking - PNR ${data.PNR}` : "Flight Booking",
            amount: grossAmount,
            quantity: 1,
        }];
        const invoiceAttachments = await generateOrderInvoiceAttachments({
            amount: grossAmount,
            surcharge: data?.surcharge || 0,
            couponDiscount: 0,
            corporateTxnId: data?.corporateTxnId,
            orderId,
            paymentType: "Flight Booking",
            credentialId: req?.user?.id,
            vendor: serviceDetails?.vendor,
            commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
            planDetails,
            commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
            traceId: req?.LogTraceId,
        });

        // Call email function to send email with payment details in the body. Log the outcome via
        // customLog (NOT console) so it actually reaches Logtail/BetterStack — the old console.* calls
        // were why no logs were visible for this path in production.
        // The mailer is callback-based; await it so this function resolves only after the email is
        // sent (or a bounded timeout elapses), and any caller awaiting this function waits for full
        // delivery instead of just the kickoff. callback(err, result) is still invoked exactly once
        // for the caller's logging/error handling; a late mailer response after the timeout is ignored.
        await new Promise((resolveMail) => {
            let mailSettled = false;
            const settleMail = (settleErr, settleResult) => {
                if (mailSettled) return;
                mailSettled = true;
                // Always release the awaiter even if the caller's callback throws (e.g. a log line
                // dereferences a missing field), so ticket delivery can never hang the request or
                // escape as an unhandled rejection in a timer/async context.
                try {
                    callback(settleErr, settleResult);
                } catch (cbErr) {
                    customLog(req?.LogTraceId, "error", {
                        message: "Ticket delivery callback threw; releasing awaiter anyway",
                        errorMessage: cbErr?.message || String(cbErr)
                    });
                } finally {
                    resolveMail();
                }
            };
            const mailTimer = setTimeout(() => {
                customLog(req?.LogTraceId, "error", {
                    message: "Flight ticket emailer did not respond within timeout",
                    to: ticketReceiverEmailId,
                    timeoutMs: TICKET_DELIVERY_TIMEOUT_MS
                });
                settleMail(new Error("Flight ticket emailer timed out"), null);
            }, TICKET_DELIVERY_TIMEOUT_MS);
            emailer.emailWithMultipleAttachment(ticketReceiverEmailId, subject, body, [...files, ...invoiceAttachments], async (emailErr) => {
                clearTimeout(mailTimer);
                if (emailErr) {
                    customLog(req?.LogTraceId, "error", { message: "Flight confirmation email error", to: ticketReceiverEmailId, error: emailErr?.message, code: emailErr?.code, response: emailErr?.response });
                    settleMail(emailErr, null);
                } else {
                    customLog(req?.LogTraceId, "info", { message: "Flight confirmation email sent", to: ticketReceiverEmailId, pdfAttached: pdfValid });
                    settleMail(null, true);
                }
            });
        });
    } catch (err) {
        customLog(req?.LogTraceId, "error", { message: "Flight details confirmation mail failed", data: err  })
        callback(err, null);
    }
}

// fetch ticket status from vendor api, update db and initiate refund
const updateChangeRequestStatus = async (ticket, serviceDetails, registeredBy, LogTraceId) => {
    if(!ticket.changeRequestId) return;

    const buildChangeRequestStatusConfig = (tokenId) => ({
        method: 'post',
        url: `${serviceDetails.vendor.optional5}/rest/GetChangeRequestStatus`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: JSON.stringify({
            EndUserIp: serviceDetails.vendor.optional4,
            TokenId: tokenId,
            ChangeRequestId: ticket.changeRequestId
        }),
        timeout: 60000,
    });

    try {
        const result = await callTboWithRetry({
            buildConfig: buildChangeRequestStatusConfig,
            serviceDetails,
            loggerTraceId: LogTraceId,
            endpoint: 'GetChangeRequestStatus',
            logRequest: (config, isRetry) => customLog(LogTraceId, "info", {
                message: `[airline:GetChangeRequestStatus] request${isRetry ? ' (retry)' : ''}`,
                endpoint: "GetChangeRequestStatus",
                changeRequestId: ticket.changeRequestId,
                requestUrl: config.url,
                requestMethod: config.method,
                requestBody: { ...JSON.parse(config.data), TokenId: "<redacted>" },
            }, "VENDOR"),
            logResponse: (response, isRetry) => customLog(LogTraceId, "info", {
                message: `[airline:GetChangeRequestStatus] response${isRetry ? ' (retry)' : ''}`,
                endpoint: "GetChangeRequestStatus",
                statusCode: response?.status,
                changeRequestId: ticket.changeRequestId,
                changeRequestStatus: response?.data?.Response?.ChangeRequestStatus,
                vendorErrorCode: response?.data?.Response?.Error?.ErrorCode,
                vendorErrorMessage: response?.data?.Response?.Error?.ErrorMessage,
                responseData: response?.data,
            }, "VENDOR"),
        });

        if (!result || result.data.Response.Error?.ErrorCode) {
            customLog(LogTraceId, "error", {
                message: "[airline:GetChangeRequestStatus] failed",
                endpoint: "GetChangeRequestStatus",
                changeRequestId: ticket.changeRequestId,
                vendorErrorCode: result?.data?.Response?.Error?.ErrorCode,
                vendorErrorMessage: result?.data?.Response?.Error?.ErrorMessage,
            }, "VENDOR")
            return;
        }

        
        // [NotSet = 0,Unassigned = 1,Assigned = 2,Acknowledged = 3,Completed = 4,Rejected = 5,Closed = 6,Pending = 7,Other = 8]
        const status = result.data.Response.ChangeRequestStatus;
        let response; 
        if(status === 4) {
            response = await updateStatusById({
                id: ticket.id, 
                status: 'CANCELLATION_APPROVED_BY_VENDOR'
            })

            // const updateDetails = {
            //     corporateTxnId: ticket.order.corporateTxnId, 
            //     registeredById: registeredBy, 
            //     partialRefund: {
            //         status: true, 
            //         walletRefund: ticket.refundedAmount
            //     }
            // }
            // if (ticket.order.paymentMode === 'PAYMENT GATEWAY') {
            //     const { status } = await cancelPGTransaction(ticket.order.corporateTxnId, ticket.refundedAmount);
            //     if (status) {
            //         await refundWalletTransaction(updateDetails);
            //     }
            // } else {
            //     await refundWalletTransaction(updateDetails);
            // }
        }
        else if(status === 5 || status == 6) {
            response = await updateStatusById({
                id: ticket.id, 
                status: 'CANCEL_REQUEST_REJECTED'
            })
        }
        if(response && !response[0]) {
            customLog(LogTraceId, "error", { message: "Failed to update flight cancelation status in db", data: {status, ticketId: ticket.id}, dbResponse: response })
        }
    } catch (error) {
        customLog(LogTraceId, "error", {
            message: "[airline:GetChangeRequestStatus] error",
            endpoint: "GetChangeRequestStatus",
            changeRequestId: ticket.changeRequestId,
            errorMessage: error?.message,
            statusCode: error?.response?.status,
            errorCode: error?.code,
            vendorErrorCode: error?.response?.data?.Response?.Error?.ErrorCode,
            vendorErrorMessage: error?.response?.data?.Response?.Error?.ErrorMessage,
            responseData: error?.response?.data,
            errorStack: error?.stack,
        }, "VENDOR")
    }
}

// calls ticket cancelation vendor api, upate db and send cancelation mail
const handleAirCancellationByApi = async ({ flightBooking, serviceDetails, user, reasonForCancellation, LogTraceId = null }) => {
    try {
        let { BookingId, PNR, transaction } = flightBooking
        let corporateTxnId = transaction?.corporateTxnId

        const charges = await fetchCancelationCharges(serviceDetails, BookingId, LogTraceId);

        const buildSendChangeRequestConfig = (tokenId) => ({
            method: 'post',
            url: `${serviceDetails.vendor.optional5}/rest/SendChangeRequest`,
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                "EndUserIp": serviceDetails.vendor.optional4,
                "TokenId": tokenId,
                BookingId,
                RequestType: 1, // FullCancellation
                CancellationType: 1, // NoShow
                Remarks: reasonForCancellation
            }),
            timeout: 60000,
        });

        const response = await callTboWithRetry({
            buildConfig: buildSendChangeRequestConfig,
            serviceDetails,
            loggerTraceId: LogTraceId,
            endpoint: 'SendChangeRequest',
            logRequest: (config, isRetry) => customLog(LogTraceId, "info", {
                message: `[airline:SendChangeRequest] request${isRetry ? ' (retry)' : ''}`,
                endpoint: "SendChangeRequest",
                bookingId: BookingId,
                requestType: 1,
                cancellationType: 1,
                requestUrl: config.url,
                requestMethod: config.method,
                requestBody: { ...JSON.parse(config.data), TokenId: "<redacted>" },
            }, "VENDOR"),
            logResponse: (resp, isRetry) => customLog(LogTraceId, "info", {
                message: `[airline:SendChangeRequest] response${isRetry ? ' (retry)' : ''}`,
                endpoint: "SendChangeRequest",
                statusCode: resp?.status,
                bookingId: BookingId,
                changeRequestId: resp?.data?.Response?.TicketCRInfo?.[0]?.ChangeRequestId,
                changeRequestStatus: resp?.data?.Response?.TicketCRInfo?.[0]?.ChangeRequestStatus,
                vendorErrorCode: resp?.data?.Response?.Error?.ErrorCode,
                vendorErrorMessage: resp?.data?.Response?.Error?.ErrorMessage,
                responseData: resp?.data,
            }, "VENDOR"),
        });

        const { ChangeRequestStatus, ChangeRequestId } = response.data.Response.TicketCRInfo[0];

        if(ChangeRequestStatus === 5 || ChangeRequestStatus === 6) {
            throw new Error("Flight ticket cancelation reject by vendor")
        }
		let templateDetails = await fetchPartnerDetails()
		
		let { vendorSupportEmail, pekoSupportEmail } = serviceDetails

        await updateCancelledBookingStatus({
            corporateTxnId, 
            flightBookingId: flightBooking.id, 
            ChangeRequestId, 
            ChangeRequestStatus,
            refundedAmount: charges.RefundAmount
        })

        // here we need to send email to the vendor regarding the cancellation
        const emailData = {
            customerName: user?.name || '',
            flightBookingId: BookingId || '',
            requestDate: new Date(),
            reasonForCancellation: reasonForCancellation || 'Not available',
            airlineLocator: PNR || 'Not available',
        }
        const fallbackSubject = `Flight Booking Cancellation Request Notification from Peko. PNR: ${emailData?.airlineLocator}.`;
        const resolved = await resolveEmailTemplate({
            key: EMAIL_TEMPLATE_KEYS.FLIGHT_CANCELLATION_MAIL,
            service: EMAIL_TEMPLATE_SERVICES.FLIGHT,
            variables: {
                customerName: emailData.customerName,
                flightBookingId: emailData.flightBookingId,
                requestDate: String(emailData.requestDate),
                reasonForCancellation: emailData.reasonForCancellation,
                airlineLocator: emailData.airlineLocator,
                branding: templateDetails?.branding || 'Peko',
                website: templateDetails?.website || 'https://www.peko.one',
                ...v2LayoutVariables(templateDetails),
            },
            fallback: () => cancellationMailTemplate(emailData, templateDetails),
            fallbackSubject,
            logTraceId: LogTraceId,
        });
        await emailer.emailWithCc(vendorSupportEmail, resolved.subject, resolved.html, [pekoSupportEmail])

        return {
            status: true,
            message: 'Ticket cancelled successfully',
            data: {
                BookingId,
                ...response?.data
            }
        }
    } catch (error) {
        customLog(LogTraceId, "error", {
            message: "[airline:SendChangeRequest] error",
            endpoint: "SendChangeRequest",
            errorMessage: error?.message,
            statusCode: error?.response?.status,
            errorCode: error?.code,
            vendorErrorCode: error?.response?.data?.Response?.Error?.ErrorCode,
            vendorErrorMessage: error?.response?.data?.Response?.Error?.ErrorMessage,
            responseData: error?.response?.data,
            errorStack: error?.stack,
        }, "VENDOR")
        let errorData = error?.response?.data
        return {
            status: false,
            message: 'Ticket cancellation failed',
            data: errorData
        }
    }
}

// fetch agency balance from vendor
async function findAgencyBalance(serviceDetails, LogTraceId) {
    try {
        const buildAgencyBalanceConfig = (auth) => ({
            method: 'post',
            url: `${serviceDetails.vendor.healthUrl}/rest/GetAgencyBalance`,
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                ClientId: serviceDetails.vendor.optional3,
                TokenAgencyId: auth.agencyId,
                TokenMemberId: auth.memberId,
                "EndUserIp": serviceDetails.vendor.optional4,
                "TokenId": auth.token,
            }),
            timeout: 60000,
        });

        const logRequest = (config, isRetry) => customLog(LogTraceId, "info", {
            message: `[airline:GetAgencyBalance] request${isRetry ? ' (retry)' : ''}`,
            endpoint: "GetAgencyBalance",
            requestUrl: config.url,
            requestMethod: config.method,
            requestBody: { ...JSON.parse(config.data), TokenId: "<redacted>" },
        }, "VENDOR");

        const logResponse = (resp, isRetry) => customLog(LogTraceId, "info", {
            message: `[airline:GetAgencyBalance] response${isRetry ? ' (retry)' : ''}`,
            endpoint: "GetAgencyBalance",
            statusCode: resp?.status,
            agencyBalance: resp?.data?.CashBalance,
            vendorErrorCode: resp?.data?.Error?.ErrorCode,
            vendorErrorMessage: resp?.data?.Error?.ErrorMessage,
            responseData: resp?.data,
        }, "VENDOR");

        let auth = await getSession(serviceDetails, { loggerTraceId: LogTraceId });
        if (!auth.token || !auth.memberId || !auth.agencyId) {
            throw new Error("Fetch authentication token failed");
        }
        let config = buildAgencyBalanceConfig(auth);
        logRequest(config, false);
        let response = await axios(config);
        logResponse(response, false);

        if (isTboTokenExpiredResponse(response)) {
            customLog(LogTraceId, 'info', {
                message: '[airline:GetAgencyBalance] retrying after Invalid/Expired Token',
                endpoint: 'GetAgencyBalance',
                vendorErrorCode: response?.data?.Error?.ErrorCode,
                vendorErrorMessage: response?.data?.Error?.ErrorMessage,
            }, 'VENDOR');
            auth = await getSession(serviceDetails, { forceRefresh: true, loggerTraceId: LogTraceId });
            if (!auth.token || !auth.memberId || !auth.agencyId) {
                throw new Error("Failed to refresh authentication token");
            }
            config = buildAgencyBalanceConfig(auth);
            logRequest(config, true);
            response = await axios(config);
            logResponse(response, true);
        }

        if(!response || response.data?.Error?.ErrorCode) {
            customLog(LogTraceId, "error", {
                message: "[airline:GetAgencyBalance] failed",
                endpoint: "GetAgencyBalance",
                vendorErrorCode: response?.data?.Error?.ErrorCode,
                vendorErrorMessage: response?.data?.Error?.ErrorMessage,
            }, "VENDOR")
            throw new Error("Agency balance fetch api failed")
        }

        return response.data.CashBalance
    } catch (error) {
        customLog(LogTraceId, "error", {
            message: "[airline:GetAgencyBalance] error",
            endpoint: "GetAgencyBalance",
            errorMessage: error?.message,
            statusCode: error?.response?.status,
            errorCode: error?.code,
            vendorErrorCode: error?.response?.data?.Error?.ErrorCode,
            vendorErrorMessage: error?.response?.data?.Error?.ErrorMessage,
            responseData: error?.response?.data,
            errorStack: error?.stack,
        }, "VENDOR")
        throw new Error("Agency balance fetch api failed")
    }
}

// fetch cancelation charges from vendor
async function fetchCancelationCharges(serviceDetails, BookingId, loggerTraceId = null) {
    const buildCancelChargesConfig = (tokenId) => ({
        method: 'post',
        url: `${serviceDetails.vendor.apiUrl}/rest/GetCancellationCharges`,
        headers: {
            'Content-Type': 'application/json',
        },
        data: JSON.stringify({
            EndUserIp: serviceDetails.vendor.optional4,
            TokenId: tokenId,
            BookingId: BookingId,
        }),
    });

    try {
        const result = await callTboWithRetry({
            buildConfig: buildCancelChargesConfig,
            serviceDetails,
            loggerTraceId,
            endpoint: 'GetCancellationCharges',
            logRequest: (config, isRetry) => customLog(loggerTraceId, "info", {
                message: `[airline:GetCancellationCharges] request${isRetry ? ' (retry)' : ''}`,
                endpoint: "GetCancellationCharges",
                bookingId: BookingId,
                requestUrl: config.url,
                requestMethod: config.method,
                requestBody: { ...JSON.parse(config.data), TokenId: "<redacted>" },
            }, "VENDOR"),
            logResponse: (resp, isRetry) => customLog(loggerTraceId, "info", {
                message: `[airline:GetCancellationCharges] response${isRetry ? ' (retry)' : ''}`,
                endpoint: "GetCancellationCharges",
                statusCode: resp?.status,
                bookingId: BookingId,
                cancellationCharge: resp?.data?.Response?.CancellationCharge,
                refundAmount: resp?.data?.Response?.RefundAmount,
                vendorErrorCode: resp?.data?.Response?.Error?.ErrorCode,
                vendorErrorMessage: resp?.data?.Response?.Error?.ErrorMessage,
                responseData: resp?.data,
            }, "VENDOR"),
        });

        if(!result || result.data.Response.Error?.ErrorCode) {
            throw new Error("Fetch cancelation charge failed from vendor side")
        }

        return result.data.Response;

    } catch (error) {
        customLog(loggerTraceId, "error", {
            message: "[airline:GetCancellationCharges] error",
            endpoint: "GetCancellationCharges",
            bookingId: BookingId,
            errorMessage: error?.message,
            statusCode: error?.response?.status,
            errorCode: error?.code,
            vendorErrorCode: error?.response?.data?.Response?.Error?.ErrorCode,
            vendorErrorMessage: error?.response?.data?.Response?.Error?.ErrorMessage,
            responseData: error?.response?.data,
            errorStack: error?.stack,
        }, "VENDOR")
        throw new Error("Failed to fetch cancelation charges")
    }
}

// async function updateTicketStatus(data) {
//     let serviceDetails = await checkService(req)
//     if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
//         return next(new ErrorResponse(serviceDetails.error, 400))
//     }

//     const { token } = await getSession(serviceDetails)
//     if(!token) {
//         throw new Error("Fetch authentication token failed")
//     }

//     const { id } = data
    
//     const flightDetails = await findOneFlightBooking(id); 
//     const passengers = passengers;

//     const leadPax = passengers.filter( (passenger)=>{
//       return passenger.IsLeadPax
//     })[0]

//     if(!leadPax) {
//       throw new Error("Unable to find lead passenger"); 
//     }

//     const payload = {
//         EndUserIp: serviceDetails.vendor.optional4,
//         TokenId: token,
//         PNR: flightDetails.PNR,
//         FirstName: leadPax.FirstName, 
//         LastName: leadPax.LastName
//     }
//     let config = {
//       method: 'post',
//       url: `${serviceDetails.vendor.optional5}/rest/GetBookingDetails`,
//       headers: {
//           'Content-Type': 'application/json',
//           // 'X-API-KEY': serviceDetails.X_API_KEY,
//           // 'conversationId': conversationId,
//           // 'sessionId': await getSession({ serviceDetails, userId: req?.user?.id })
//       },
//       data: payload
//     };

//     let result;
//     try {
//         result = await axios(config); 
//         console.log(result.data.Response.Error)
//         if(!result || result.data.Response?.Error?.ErrorCode !== 0) {
//             throw new Error("Flight details api failed")
//         }

//         const status = result.data.Response?.FlightItinerary?.Status
//         let response; 
//         if(status === 5) { // successcase
//             response = await updateStatusById({
//                 id: ticket.id, 
//                 status: 'Success'
//             })
//         } else if(status === 2) { // failed case
//             response = await updateStatusById({
//                 id: ticket.id, 
//                 status: 'Failed'
//             })

//             // initiate refund
//         }

//         if(response && !response[0]) {
//             customLog(null, "error", { message: "Failed to update flight cancelation status in db", data: {status, ticketId: ticket.id}, dbResponse: response, })
//         }
//     } catch (error) {
//       if (error?.response?.data) {
//         customLog(null, "error", { message: "Flight booking details fetch api failed", data: error?.response?.data })
//       } else {
//           customLog(null, "error", { message: "Flight booking details fetch api failed", data: error })
//       }
//       throw new Error("Unable to fetch ticket details")
//     }

    
// }

function mergeDomesticRoundTripTickets(journey1, journey2) {
    let inbount, outbount;
    if(journey2) {
        // find which one is first
        const j1Depart = (journey1?.journey[0]?.Origin?.DepTime)
        const j2Depart = (journey2?.journey[0]?.Origin?.DepTime)

        if(j1Depart && j2Depart) {
            const j1DepartDate = new Date(j1Depart);
            const j2DepartDate = new Date(j2Depart);

            if(j1DepartDate < j2DepartDate) {
                outbount = journey1;
                inbount = journey2; 
            }
            else {
                outbount = journey2; 
                inbount = journey1;
            }
        }
        else {
            outbount = journey1; 
            inbount = journey2;
        }
        inbount.journey = inbount.journey.map( (curr) => {
            curr.TripIndicator = 2;
            return curr;
        })
        outbount.inbountPNR = inbount.PNR; 
        outbount.inbountBookingId = inbount.BookingId; 
        outbount.journey = [...outbount.journey, ...inbount.journey]
        outbount.inbountId = inbount.id
        outbount.inbountBookingStatus = inbount.bookingStatus
    }
    else {
        outbount = journey1;
    }


    return outbount;
}


// ---- Unused Code Section ----

exports.fareRules = asyncHandler(async (req, res, next) => {
  let serviceDetails = await checkService(req)
  
  const token= await getSession(serviceDetails)
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(new ErrorResponse(serviceDetails.error, 400));
  }
  let data = JSON.stringify(
    {
      
          "EndUserIp": serviceDetails.EndUserIp,
          "TokenId": token,
          "TraceId": req.body.TraceId,
          "ResultIndex":req.body.ResultIndex,
          
        }

);
  let config = {
    method: "post",
    url: `${serviceDetails.vendor.apiUrl}/rest/FareRule`,
    headers: {
      "Content-Type": "application/json",
      // "X-API-KEY": serviceDetails.X_API_KEY,
      // conversationId: conversationId,
      // sessionId: await getSession(serviceDetails),
    },
    data: data,
  };
  axios(config)
    .then(function (response) {
    
      if (!response) {
        return next(new ErrorResponse(`No Results found `, 404));
      } else {
        return res.status(200).json({
          status: true,
          message: "Fare-rules search successful",
          responseCode: "000",
          data: {
            
            ...response.data,
          },
        });
      }
    })
    .catch(function (error) {
      console.log(error?.response);
      if (error.response) {
        return next(new ErrorResponse(error?.response?.data?.errorDetails?.message ?? "Fare-rule-search faild", 400));
      } else {
        console.error("Error:", error.message);
        return next(new ErrorResponse(error.message, 500));
      }
    });
});
  
exports.fareQuotes = asyncHandler(async (req, res, next) => {
  let serviceDetails = await checkService(req)
  
  const token= await getSession(serviceDetails)
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(new ErrorResponse(serviceDetails.error, 400));
  }
  let data = JSON.stringify(
    {
      
          "EndUserIp": serviceDetails.EndUserIp,
          "TokenId": token,
          "TraceId": req.body.TraceId,
          "ResultIndex":req.body.ResultIndex,
          
        }

);
  let config = {
    method: "post",
    url: `${serviceDetails.vendor.apiUrl}/rest/FareQuote`,
    headers: {
      "Content-Type": "application/json",
      // "X-API-KEY": serviceDetails.X_API_KEY,
      // conversationId: conversationId,
      // sessionId: await getSession(serviceDetails),
    },
    data: data,
  };
  axios(config)
    .then(function (response) {
      
      if (!response) {
        return next(new ErrorResponse(`No Results found `, 404));
      } else {
        return res.status(200).json({
          status: true,
          message: "Fare-quotes search successful",
          responseCode: "000",
          data: {
            
            ...response.data,
          },
        });
      }
    })
    .catch(function (error) {
      console.log(error?.response);
      if (error.response) {
        return next(new ErrorResponse(error?.response?.data?.errorDetails?.message ?? "Fare-rule-search faild", 400));
      } else {
        console.error("Error:", error.message);
        return next(new ErrorResponse(error.message, 500));
      }
    });
});

exports.flightSSR = asyncHandler(async (req, res, next) => {
  let serviceDetails = await checkService(req)
  
  const token= await getSession(serviceDetails)
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(new ErrorResponse(serviceDetails.error, 400));
  }
  let data = JSON.stringify(
    {
      
          "EndUserIp": serviceDetails.EndUserIp,
          "TokenId": token,
          "TraceId": req.body.TraceId,
          "ResultIndex":req.body.ResultIndex,
          
        }

);
  let config = {
    method: "post",
    url: `${serviceDetails.vendor.apiUrl}/rest/SSR`,
    headers: {
      "Content-Type": "application/json",
      // "X-API-KEY": serviceDetails.X_API_KEY,
      // conversationId: conversationId,
      // sessionId: await getSession(serviceDetails),
    },
    data: data,
  };
  axios(config)
    .then(function (response) {
      
      if (!response) {
        return next(new ErrorResponse(`No Results found `, 404));
      } else {
        return res.status(200).json({
          status: true,
          message: "ssr search successful",
          responseCode: "000",
          data: {
            
            ...response.data,
          },
        });
      }
    })
    .catch(function (error) {
      console.log(error?.response);
      if (error.response) {
        return next(new ErrorResponse(error?.response?.data?.errorDetails?.message ?? "Fare-rule-search faild", 400));
      } else {
        console.error("Error:", error.message);
        return next(new ErrorResponse(error.message, 500));
      }
    });
});

exports.getFareCalendar = asyncHandler(async (req, res, next) => {
    try {
        let serviceDetails = await checkService(req)
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse(`Apologies, the service you are trying to access is currently unavailable.`, 404));
        }

        const buildCalendarConfig = (tokenId) => ({
            method: 'post',
            url: `${serviceDetails?.vendor?.apiUrl}/rest/GetCalendarFare`,
            headers: { 'Content-Type': 'application/json' },
            data: JSON.stringify({
                "EndUserIp": serviceDetails.vendor.optional4,
                "TokenId": tokenId,
                "JourneyType": req.body.tripType,
                "Segments": req.body.flightSegments,
                "PreferredAirlines": null,
                "Sources": null
            }),
            timeout: 60000
        });

        const { token } = await getSession(serviceDetails, { loggerTraceId: req?.LogTraceId })
        if (!token) {
            throw new Error("Failed to fetch authentication token")
        }

        let config = buildCalendarConfig(token);

        customLog(req?.LogTraceId, "info", {
            message: "[airline:GetCalendarFare] request",
            config: config,
        }, "VENDOR")

        let result;
        try {
            result = await axios(config);
        } catch (axiosError) {
            customLog(req?.LogTraceId, "error", {
                message: "[airline:GetCalendarFare] axios request failed",
                errorMessage: axiosError?.message,
                responseData: axiosError?.response?.data||axiosError?.response,
            }, "VENDOR")
            throw axiosError;
        }

        customLog(req?.LogTraceId, "info", {
            message: "[airline:GetCalendarFare] response",
            statusCode: result?.status,
            vendorError: result?.data?.Response?.Error,
            responseData: result?.data,
        }, "VENDOR")

        if (result?.data?.Response?.Error?.ErrorCode === 6) {
            customLog(req?.LogTraceId, "info", {
                message: "[airline:GetCalendarFare] retrying after Invalid Token (ErrorCode 6)",
                endpoint: "GetCalendarFare",
            }, "VENDOR")

            const { token: freshToken } = await getSession(serviceDetails, { forceRefresh: true, loggerTraceId: req?.LogTraceId });
            if (!freshToken) {
                throw new Error("Failed to refresh authentication token");
            }
            config = buildCalendarConfig(freshToken);

            customLog(req?.LogTraceId, "info", {
                message: "[airline:GetCalendarFare] request (retry)",
                config: config
            }, "VENDOR")

            try {
                result = await axios(config);
            } catch (retryAxiosError) {
                customLog(req?.LogTraceId, "error", {
                    message: "[airline:GetCalendarFare] axios retry request failed",
                    errorMessage: retryAxiosError?.message,
                    responseData: retryAxiosError?.response?.data || retryAxiosError?.response,
                }, "VENDOR")
                throw retryAxiosError;
            }

            customLog(req?.LogTraceId, "info", {
                message: "[airline:GetCalendarFare] response (retry)",
                resultCount: Array.isArray(result?.data?.Response?.Results) ? result.data.Response.Results.length : 0,
                vendorErrorCode: result?.data?.Response?.Error?.ErrorCode,
                vendorErrorMessage: result?.data?.Response?.Error?.ErrorMessage,
                responseData: result?.data,
            }, "VENDOR")
        }

        if (!result || !result?.data?.Response || (result.data.Response?.Error?.ErrorCode && result.data.Response.Error.ErrorCode !== 0)) {
            customLog(req?.LogTraceId, "error", {
                message: "[airline:GetCalendarFare] vendor returned error",
                vendorErrorCode: result?.data?.Response?.Error?.ErrorCode,
                vendorErrorMessage: result?.data?.Response?.Error?.ErrorMessage,
            }, "VENDOR")
            return next(new ErrorResponse("Failed to fetch fare calendar.", 500))
        }

        return res.status(200).json({
            status: true,
            message: "Fare Calendar Fetched Successfully!",
            responseCode: '000',
            data: {
                searchResults: await applyServiceCommission(result.data.Response.SearchResults || [], 'Fare', accessKey, { credentialId: req.user?.id }),
                Origin: result.data.Response.Origin,
                Destination: result.data.Response.Destination,
            }
        })
    } catch (error) {
        customLog(req?.LogTraceId, "error", {
            message: "Fare calendar api failed",
            errorMessage: error?.message,
           error:error
        })
        next(new ErrorResponse("Something went wrong while fetching fare calendar.", 500))
    }
})

// async function generatePdf(html, bookingReferenceId, callback) {
//     try {
//         let id = bookingReferenceId;

//         fs.writeFile(`${id}.html`, html, async (err) => {
//         if (err) {
//             console.error(err);
//             callback(err, null);
//         } else {
//             console.log('HTML File saved!');
//             const inputFile = `${id}.html`;
//             const outputFile = `${id}.pdf`;

//             const pdfOptions = {
//             pageSize: 'A4',
//             output: outputFile,
//             noStopSlowScripts: true // This option might not exist in wkhtmltopdf; adjust as needed
//             };
//             wkhtmltopdf(fs.createReadStream(inputFile), pdfOptions, async (pdfErr) => {
//             if (pdfErr) {
//                 console.error(`Error generating PDF: ${pdfErr}`);
//                 callback(pdfErr, null);
//             } else {
//                 console.log(`PDF file written to ${outputFile}`);
//                 // Read the PDF data
//                 fs.readFile(outputFile, async (readErr, pdfData) => {
//                 if (readErr) {
//                     console.error(`Error reading file ${outputFile}: ${readErr}`);
//                     // Delete the files
//                     const filesToDelete = [inputFile, outputFile];
//                     filesToDelete.forEach((file) => {
//                     fs.unlink(file, (unlinkErr) => {
//                         if (unlinkErr) {
//                         console.error(`Error deleting file ${file}: ${unlinkErr}`);
//                         } else {
//                         console.log(`File ${file} deleted`);
//                         }
//                     });
//                     });
//                     callback(readErr, null);
//                 } else {
//                     // Delete the files
//                     const filesToDelete = [inputFile, outputFile];
//                     filesToDelete.forEach((file) => {
//                     fs.unlink(file, (unlinkErr) => {
//                         if (unlinkErr) {
//                         } else {
//                         console.log(`File ${file} deleted`);
//                         }
//                     });
//                     });
//                     callback(null, pdfData);
//                 }
//                 });
//             }
//             });
//         }
//         });
//     } catch (err) {
//         console.error(`Error in generatePdf: ${err}`);
//         callback(err, null);
//     }
// }





















