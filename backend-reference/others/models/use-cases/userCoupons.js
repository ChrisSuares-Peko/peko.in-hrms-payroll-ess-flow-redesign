const moment = require("moment");
const { Op } = require("sequelize");
const SubscriptionCoupons = require("../entities/pekoCredits");
const UserSubscriptionCoupons = require("../entities/userCoupons");
const ReferralCodes = require("../entities/referral_codes");
const { customLog } = require("../../utils/loggerHelper");

const getReferralByCode = async (code) => {
    try {
        return await ReferralCodes.findOne({
            where: { referralCode: code },
            raw: true,
            nest: true,
        });
    } catch (error) {
        customLog(null, "error", { message: "Error while fetching referral code:", error });
        return null;
    }
};

exports.findAllUserCoupons = async (corporateId, partnerId) => {
    try {
        const allCoupons = await UserSubscriptionCoupons.findAll({
            where: {
                corporateUserId: corporateId,
                // status: { [Op.in]: ['CLAIMED', 'UNCLAIMED'] },
                // expiryDate: { [Op.gt]: new Date() },
            },
            include: [
                {
                    model: SubscriptionCoupons,
                    as: 'couponData',
                    attributes: ['id', 'discountType', 'discount', 'minimumPurchase', 'maximumDiscount'],
                    where: { status: 'ACTIVE', partnerId: partnerId },
                },
            ],
            order: [
                ['status', 'ASC'],
                ['expiryDate', 'ASC'],
            ],
            raw: true,
            nest: true,
        });

        return allCoupons;
    } catch (error) {
        console.error("Error fetching user coupons:", error);
        return false;
    }
};

exports.assignMissingCoupons = async (userId, partnerId, referralCode = null) => {
    try {
        const today = moment().startOf("day").toDate();

        let referralFilter = {};
        if (referralCode) {
            const referralId = await getReferralByCode(referralCode);
            if (!referralId) return { status: true };
            referralFilter = { referralCodeId: referralId?.id };
        } else {
            referralFilter = { referralCodeId: null };
        }

        const allActiveCoupons = await SubscriptionCoupons.findAll({
            where: {
                status: "ACTIVE",
                partnerId: partnerId,
                validUntil: { [Op.gte]: today },
                ...referralFilter,
            },
            attributes: ["id", "expiryDays", "validUntil"],
            raw: true,
            nest: true,
        });

        const userAssignedCoupons = await UserSubscriptionCoupons.findAll({
            attributes: ["couponId", "id", "status"],
            where: { corporateUserId: userId },
            raw: true,
            nest: true,
        });

        const activeCouponIds = allActiveCoupons.map((c) => c.id);
        const couponsToRemove = userAssignedCoupons.filter(
            (entry) => !activeCouponIds.includes(entry.couponId) && entry.status !== "CLAIMED"
        );
        if (couponsToRemove.length > 0) {
            const idsToRemove = couponsToRemove.map((c) => c.id);
            await UserSubscriptionCoupons.destroy({ where: { id: idsToRemove } });
        }

        if (!allActiveCoupons || !(allActiveCoupons.length > 0)) return { status: true };

        const assignedCouponIds = userAssignedCoupons.map((entry) => entry.couponId);
        const unassignedCoupons = allActiveCoupons.filter(
            (coupon) => !assignedCouponIds.includes(coupon.id)
        );

        if (unassignedCoupons.length > 0) {
            const newEntries = unassignedCoupons.map((coupon) => ({
                corporateUserId: userId,
                couponId: coupon.id,
                expiryDate: moment().add(coupon.expiryDays, "days").toDate(),
            }));
            await UserSubscriptionCoupons.bulkCreate(newEntries);
        }
        return { status: true, isPekoCreditActive: !!userAssignedCoupons.length };
    } catch (error) {
        customLog(null, "error", { message: "Error while assigning coupons:", error });
        return { status: false };
    }
};

exports.updateExpiredCoupons = async (corporateId) => {
    try {
        const result = await UserSubscriptionCoupons.update(
            { status: "EXPIRED" },
            {
                where: {
                    corporateUserId: corporateId,
                    expiryDate: { [Op.lt]: new Date() },
                    status: { [Op.ne]: "EXPIRED" },
                },
            }
        );
        return result;
    } catch (error) {
        customLog(null, "error", { message: "Error updating expired coupons:", error });
        return false;
    }
};