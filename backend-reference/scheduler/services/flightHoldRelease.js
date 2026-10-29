const axios = require("axios");

const { customLog } = require("../utils/loggerHelper");
const { findServiceOperatorByAccessKey } = require("../utils/checkAndFetchServiceDetails");
const { findHoldsDueForRelease, markHoldReleased } = require("../models/use-cases/flightHeldBooking");
const { getSession } = require("./airline");
const operatorsData = require("../utils/operatorsData.json");

const accessKey = operatorsData["flight"]["accessKey"];

// An unpaid hold left past its ticketing deadline is billed to us by the airline. The travel
// service stamps each one with a releaseAt; this hands back everything past that mark.
const releasePNR = async ({ serviceDetails, token, bookingId, source }) => {
    const config = {
        method: 'post',
        url: `${serviceDetails.vendor.optional5}/rest/ReleasePNRRequest`,
        headers: {
            'Content-Type': 'application/json'
        },
        // Source is mandatory and booking-specific — a wrong value silently no-ops the
        // release and the seat stays blocked. Legacy rows without one fall back to Amadeus.
        data: JSON.stringify({
            EndUserIp: serviceDetails.vendor.optional4,
            TokenId: token,
            BookingId: Number(bookingId),
            Source: String(source ?? "4"),
        }),
        timeout: 30000,
    };

    const result = await axios(config);
    const errorCode = result?.data?.Response?.Error?.ErrorCode;

    if (errorCode) {
        const message = result?.data?.Response?.Error?.ErrorMessage || `ReleasePNRRequest error ${errorCode}`;
        throw new Error(message);
    }
    return result?.data;
};

exports.releaseExpiredFlightHolds = async () => {
    try {
        const holds = await findHoldsDueForRelease();

        if (!holds || holds.length === 0) return;

        const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
        if (!serviceDetails || Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
            customLog(null, "error", {
                message: "Flight hold release skipped — service details unavailable",
                dueCount: holds.length,
                error: serviceDetails?.error,
            });
            return;
        }

        const { token } = await getSession(serviceDetails);
        if (!token) {
            customLog(null, "error", {
                message: "Flight hold release skipped — TBO authentication failed",
                dueCount: holds.length,
            });
            return;
        }

        let released = 0;
        let failed = 0;

        for (const hold of holds) {
            if (!hold.BookingId) {
                await markHoldReleased(hold.id, { error: "Missing BookingId" });
                failed += 1;
                continue;
            }

            try {
                await releasePNR({ serviceDetails, token, bookingId: hold.BookingId, source: hold.source });
                await markHoldReleased(hold.id);
                released += 1;
                customLog(null, "info", {
                    message: "Released expired flight hold",
                    heldBookingId: hold.id,
                    bookingId: hold.BookingId,
                    pnr: hold.PNR,
                    source: hold.source,
                    releaseAt: hold.releaseAt,
                    lastTicketDate: hold.lastTicketDate,
                });
            } catch (error) {
                // RELEASE_FAILED rather than retried forever: a rejected release won't change.
                await markHoldReleased(hold.id, { error: error?.message || error });
                failed += 1;
                customLog(null, "error", {
                    message: "Failed to release expired flight hold",
                    heldBookingId: hold.id,
                    bookingId: hold.BookingId,
                    source: hold.source,
                    error: error?.response?.data ?? error?.message ?? error,
                });
            }
        }

        customLog(null, "info", {
            message: "Flight hold release sweep completed",
            due: holds.length,
            released,
            failed,
        });
    } catch (error) {
        customLog(null, "error", { message: "Error in releaseExpiredFlightHolds", error });
    }
};
