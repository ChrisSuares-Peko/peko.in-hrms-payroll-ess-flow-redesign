const PekoCredits = require("../entities/pekoCredits")


exports.findCouponCodesByPartnerId = async (partnerId) => {
    return await PekoCredits.findAll({
        where: {
            partnerId: partnerId,
            status: 'ACTIVE'
        }
    })
}