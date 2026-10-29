const { Op } = require("sequelize");

const flightHeldBooking = require("../entities/flights/flightHeldBooking");
const asyncHandler = require("../../middlewares/async");

// Still HELD past releaseAt means an unpaid seat we are being billed for.
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
