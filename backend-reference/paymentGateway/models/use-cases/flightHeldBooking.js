const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const flightHeldBooking = require("../entities/flight/flightHeldBooking");
const { customLog } = require("../../utils/loggerHelper");

module.exports.createHeldBooking = asyncHandler(async (payload) => {
    return flightHeldBooking.create(payload);
});

// minRemainingMs avoids resuming a hold the sweeper is about to take back mid-payment.
module.exports.findLiveHoldByMatchHash = asyncHandler(async ({ credentialId, matchHash, legType = 'OUTBOUND', minRemainingMs = 0 }) => {
    if (!matchHash) return null;

    return flightHeldBooking.findOne({
        where: {
            credentialId,
            matchHash,
            legType,
            status: 'HELD',
            releaseAt: { [Op.gt]: new Date(Date.now() + minRemainingMs) },
        },
        order: [['createdAt', 'DESC']],
    });
});

// Other live holds on the same flights for the same party (different fare, or a double
// submit). Excluded by row id rather than hash so duplicates are caught too.
module.exports.findLiveHoldsByRouteHash = asyncHandler(async ({ credentialId, routeHash, excludeId }) => {
    if (!routeHash) return [];

    const where = {
        credentialId,
        routeHash,
        status: 'HELD',
        releaseAt: { [Op.gt]: new Date() },
    };
    if (excludeId) where.id = { [Op.ne]: excludeId };

    return flightHeldBooking.findAll({ where });
});

module.exports.markHoldReleased = asyncHandler(async (id, { error = null } = {}) => {
    return flightHeldBooking.update(
        {
            status: error ? 'RELEASE_FAILED' : 'RELEASED',
            releasedAt: new Date(),
            releaseError: error ? String(error).slice(0, 2000) : null,
        },
        { where: { id } }
    );
});

// Takes a held seat out of the sweeper's reach once its leg has ticketed.
module.exports.markHoldConsumed = asyncHandler(async (BookingId, LogTraceId = null) => {
    if (!BookingId) return 0;

    const [updated] = await flightHeldBooking.update(
        { status: 'CONSUMED' },
        { where: { BookingId: String(BookingId), status: 'HELD' } }
    );

    if (updated) {
        customLog(LogTraceId, "info", {
            message: "Flight hold marked CONSUMED after ticketing",
            bookingId: BookingId,
        });
    }
    return updated;
});
