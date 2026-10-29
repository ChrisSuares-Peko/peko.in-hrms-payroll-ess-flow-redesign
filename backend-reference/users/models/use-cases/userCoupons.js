const SubscriptionCoupons = require("../entities/pekoCredits");
const UserCoupons = require("../entities/userCoupons");
const moment = require('moment');
const { Op } = require('sequelize');
const { customLog } = require("../../utils/loggerHelper");

exports.assignReferralCredits = async (userId, referralId, partnerId) => {
    try {
        const today = moment().startOf('day').toDate();

        // Step 1: Fetch all active coupons
        const allActiveCoupons =  await SubscriptionCoupons.findAll({
            where: {
                referralCodeId:referralId,
                partnerId,
                status: "ACTIVE",
                validUntil: {
                    [Op.gte]: today
                }
            },
            raw: true
        });
        if (allActiveCoupons.length > 0) {
            // Step 4: Prepare data for the all active coupons
            const newEntries = allActiveCoupons.map((coupon) => ({
                corporateUserId: userId,
                couponId: coupon.id,
                expiryDate: moment().add(coupon.expiryDays, "days").toDate(),
            }));
            // Step 5: Bulk create the new entries
            await UserCoupons.bulkCreate(newEntries);
        }
        return { status: true}
    } catch (error) {
        customLog(null, "error", { message: "Error while assigning coupons:", error })
        return { status: false }
    }
};
