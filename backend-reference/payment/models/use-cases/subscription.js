
const Subscription = require("../entities/subscription");
const asyncHandler = require("../../middlewares/async");

exports.findAllActiveSubscriptions = asyncHandler(async (params) => {
    const { corporateUserId } = params
    try {
        const allActiveSubscriptions = await Subscription.findAll({
            where: {
                corporateUserId: corporateUserId,
                status: 'ACTIVE'
            },
            raw: true,
            nest: true
        })

        return allActiveSubscriptions

    } catch (error) {
        console.error('Error finding package details:', error);
        return false
    }
})
