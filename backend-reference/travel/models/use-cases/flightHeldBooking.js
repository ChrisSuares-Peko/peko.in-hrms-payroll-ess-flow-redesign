const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const flightHeldBooking = require("../entities/flight/flightHeldBooking");
const { customLog } = require("../../utils/loggerHelper");

// Past releaseAt the sweeper owns the hold and may already have released it.
const liveHoldWhere = (extra = {}) => ({
    ...extra,
    status: 'HELD',
    releaseAt: { [Op.gt]: new Date() },
});

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

    const where = liveHoldWhere({ credentialId, routeHash });
    if (excludeId) {
        where.id = { [Op.ne]: excludeId };
    }

    return flightHeldBooking.findAll({ where });
});

module.exports.findHoldsDueForRelease = asyncHandler(async (limit = 100) => {
    return flightHeldBooking.findAll({
        where: {
            status: 'HELD',
            releaseAt: { [Op.lte]: new Date() },
        },
        order: [['releaseAt', 'ASC']],
        limit,
    });
});

module.exports.findHoldById = asyncHandler(async (id) => {
    if (!id) return null;
    return flightHeldBooking.findOne({ where: { id } });
});

module.exports.findHoldByBookingId = asyncHandler(async (BookingId) => {
    if (!BookingId) return null;
    return flightHeldBooking.findOne({
        where: { BookingId: String(BookingId) },
        order: [['createdAt', 'DESC']],
    });
});

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
