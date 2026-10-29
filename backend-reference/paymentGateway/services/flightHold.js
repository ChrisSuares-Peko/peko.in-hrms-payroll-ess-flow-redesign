const { accessKey, callTboWithRetry, createTraceIdExpiredError, isTboTraceIdExpiredResponse } = require("../utils/tboSession");
const { customLog } = require("../utils/loggerHelper");
const { buildMatchHash, buildRouteHash } = require("../utils/flightHoldFingerprint");
const {
    createHeldBooking,
    findLiveHoldByMatchHash,
    findLiveHoldsByRouteHash,
    markHoldReleased,
} = require("../models/use-cases/flightHeldBooking");

// Mirrors the same logic in travel/controllers/corporate/airline.js. Both services take holds
// now that Book runs inside the payment step, and they deploy separately, so the flow is
// duplicated the same way handleTicketApi already is.

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

// FareRules are multi-KB of HTML we never read back — drop before persisting.
const trimItinerary = (flightItinerary) => {
    if (!flightItinerary) return {};
    const trimmed = { ...flightItinerary };
    delete trimmed.FareRules;
    return trimmed;
};

// `source` is TBO's FlightItinerary.Source and is mandatory — a wrong value silently no-ops
// the release and we still get billed. Defaults to "4" only for holds recorded before we stored it.
const releasePNR = async (serviceDetails, bookingId, source, loggerTraceId) => {
    try {
        const result = await callTboWithRetry({
            buildConfig: (tokenId) => ({
                method: 'post',
                url: `${serviceDetails.vendor.optional5}/rest/ReleasePNRRequest`,
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify({
                    EndUserIp: serviceDetails.vendor.optional4,
                    TokenId: tokenId,
                    BookingId: Number(bookingId),
                    Source: String(source ?? "4"),
                }),
                timeout: 30000,
            }),
            serviceDetails,
            loggerTraceId,
            endpoint: 'ReleasePNRRequest',
        });
        const errorCode = result?.data?.Response?.Error?.ErrorCode;
        if (errorCode) throw new Error(result?.data?.Response?.Error?.ErrorMessage || `ReleasePNRRequest error ${errorCode}`);
        return { success: true };
    } catch (error) {
        customLog(loggerTraceId, "error", {
            message: "[airline:ReleasePNRRequest] failed",
            bookingId,
            error: error?.response?.data ?? error?.message ?? error,
        }, "VENDOR");
        return { success: false, error: error?.message ?? error };
    }
};

const bookLeg = async (leg, serviceDetails, loggerTraceId) => {
    const result = await callTboWithRetry({
        buildConfig: (tokenId) => ({
            method: 'post',
            url: `${serviceDetails.vendor.optional5}/rest/Book`,
            headers: { 'Content-Type': 'application/json' },
            data: JSON.stringify({
                EndUserIp: serviceDetails.vendor.optional4,
                TokenId: tokenId,
                TraceId: leg.TraceId,
                ResultIndex: leg.ResultIndex,
                Passengers: leg.passengers,
            }),
        }),
        serviceDetails,
        loggerTraceId,
        endpoint: 'Book',
        logRequest: (config, isRetry) => customLog(loggerTraceId, "info", {
            message: `[airline:Book] request${isRetry ? ' (retry)' : ''}`,
            endpoint: "Book",
            vendorTraceId: leg.TraceId,
            requestBody: { ...JSON.parse(config.data), TokenId: "<redacted>" },
        }, "VENDOR"),
        logResponse: (response, isRetry) => customLog(loggerTraceId, "info", {
            message: `[airline:Book] response${isRetry ? ' (retry)' : ''}`,
            endpoint: "Book",
            statusCode: response?.status,
            bookingId: response?.data?.Response?.Response?.BookingId,
            pnr: response?.data?.Response?.Response?.PNR,
            status: response?.data?.Response?.Response?.Status,
            vendorErrorCode: response?.data?.Response?.Error?.ErrorCode,
            vendorErrorMessage: response?.data?.Response?.Error?.ErrorMessage,
        }, "VENDOR"),
    });

    const errorCode = result?.data?.Response?.Error?.ErrorCode;
    if (!result || errorCode) {
        if (errorCode === 5 || isTboTraceIdExpiredResponse(result)) {
            throw createTraceIdExpiredError("Your search session has expired. Please restart your search and try again.");
        }
        const err = new Error("Unable to proceed with the booking. Please try again.");
        err.vendorErrorCode = errorCode;
        err.vendorMessage = result?.data?.Response?.Error?.ErrorMessage;
        throw err;
    }

    const response = result.data.Response.Response;
    // 6 = NotConfirmed, which TBO returns when the search session has been reset.
    if (response.Status === 6) {
        throw createTraceIdExpiredError("Your search session has expired. Please restart your search and try again.");
    }
    if ([0, 2, 4, 5].includes(response.Status)) {
        const err = new Error("Unable to proceed with the booking. Please try again.");
        err.vendorStatus = response.Status;
        throw err;
    }

    const fare = response.FlightItinerary?.Fare || {};
    return {
        PNR: response.PNR,
        BookingId: response.BookingId,
        isPriceChanged: !!response.IsPriceChanged,
        isTimeChanged: !!response.IsTimeChanged,
        fare: { BaseFare: fare.BaseFare, Tax: fare.Tax, PublishedFare: fare.PublishedFare },
        FlightItinerary: response.FlightItinerary,
    };
};

// A re-search at a different fare, or a raced double submit, would leave an earlier hold blocking.
const releaseConflictingHolds = async ({ credentialId, routeHash, excludeId, serviceDetails, loggerTraceId }) => {
    try {
        const stale = await findLiveHoldsByRouteHash({ credentialId, routeHash, excludeId });
        for (const hold of stale) {
            const released = await releasePNR(serviceDetails, hold.BookingId, hold.source, loggerTraceId);
            await markHoldReleased(hold.id, { error: released.success ? null : released.error });
        }
    } catch (error) {
        // Never fail the booking over cleanup — the sweeper catches these at releaseAt.
        customLog(loggerTraceId, "error", { message: "Failed releasing superseded holds", error });
    }
};

// Reuses a live hold for the same itinerary + passengers, else takes a fresh one and records it.
const resolveHeldBookingForLeg = async ({ leg, legType, groupKey, serviceDetails, req }) => {
    const credentialId = req.user.id;
    const loggerTraceId = req?.LogTraceId;
    const segments = leg.itinerary || leg.journey;
    const matchHash = buildMatchHash({ credentialId, segments, passengers: leg.passengers });
    const routeHash = buildRouteHash({ credentialId, segments, passengers: leg.passengers });

    if (matchHash) {
        const existing = await findLiveHoldByMatchHash({
            credentialId, matchHash, legType, minRemainingMs: HOLD_MIN_REUSE_REMAINING_MS,
        });
        if (existing) {
            customLog(loggerTraceId, "info", {
                message: "Reusing existing flight hold — skipping Book",
                heldBookingId: existing.id,
                bookingId: existing.BookingId,
                legType,
            });
            return {
                PNR: existing.PNR,
                BookingId: Number(existing.BookingId),
                isPriceChanged: existing.isPriceChanged,
                isTimeChanged: existing.isTimeChanged,
                fare: existing.fare || {},
                reusedHold: true,
            };
        }
    }

    const result = await bookLeg(leg, serviceDetails, loggerTraceId);
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
        isPriceChanged: result.isPriceChanged,
        isTimeChanged: result.isTimeChanged,
        fare: result.fare || {},
        segments: itinerary.Segments || [],
        passengers: leg.passengers || [],
        userContactDetails: leg.userContactDetails || {},
    });

    customLog(loggerTraceId, "info", {
        message: "Recorded new flight hold",
        heldBookingId: hold?.id,
        bookingId: result.BookingId,
        pnr: result.PNR,
        source: itinerary.Source,
        lastTicketDate,
        releaseAt,
    });

    await releaseConflictingHolds({ credentialId, routeHash, excludeId: hold?.id, serviceDetails, loggerTraceId });

    return { ...result, FlightItinerary: trimItinerary(itinerary), reusedHold: false };
};

// Non-LCC legs are held with TBO immediately before ticketing. A fare that moved in the
// meantime is accepted rather than blocking the payment, so the ticket is issued at the
// vendor's current fare — the difference against what the customer paid is logged.
exports.holdLegBeforeTicketing = async ({ leg, legType, groupKey, serviceDetails, req }) => {
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

exports.computeReleaseAt = computeReleaseAt;
exports.accessKey = accessKey;
