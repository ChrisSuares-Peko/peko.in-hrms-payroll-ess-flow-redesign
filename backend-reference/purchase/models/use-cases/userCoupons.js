const SubscriptionCoupons = require("../entities/pekoCredits");
const UserCoupons = require("../entities/userCoupons");
const Package = require("../entities/package");
const ServiceOperator = require("../entities/serviceOperator");
const moment = require('moment');
const { Op } = require('sequelize');
const { customLog } = require("../../utils/loggerHelper");
const { getReferralByCode, getReferralById } = require("./referral-code");
const CorporateUser = require("../entities/corporateUser");

exports.assignMissingCoupons = async (userId, partnerId, referralCode = null) => {
    try {
        const today = moment().startOf('day').toDate();

        let referralFilter = {};
        if (referralCode) {
            // CASE 1 -> User with referral code
            const referralId = await getReferralByCode(referralCode)
            if (!referralId) return { status: true }

            referralFilter = { referralCodeId: referralId?.id };
        } else {
            // CASE 2 -> User WITHOUT referral code
            referralFilter = { referralCodeId: null };
        }
        // Step 1: Fetch all active coupons
        const allActiveCoupons = await SubscriptionCoupons.findAll({
            include: [
                {
                    model: Package,
                    attributes: ['id'],
                }
            ],
            where: {
                status: "ACTIVE",
                partnerId: partnerId,
                validUntil: {
                    [Op.gte]: today,
                },
                ...referralFilter,
            },
            attributes: ["id", "expiryDays", "validUntil"],
            raw: true,
            nest: true
        });

        // Step 2: Fetch all coupons already assigned to the user
        const userAssignedCoupons = await UserCoupons.findAll({
            attributes: ["couponId", "id", "status"],
            where: { corporateUserId: userId },
            raw: true,
            nest: true
        });

        const activeCouponIds = allActiveCoupons.map((c) => c.id);
        // ✅ Step 2.1: Remove coupons from UserCoupons that no longer exist in SubscriptionCoupons
        const couponsToRemove = userAssignedCoupons.filter(
            (entry) =>
                !activeCouponIds.includes(entry.couponId) && // coupon no longer exists / not active
                entry.status !== 'CLAIMED'                   // only if not already claimed
        );

        if (couponsToRemove.length > 0) {
            const idsToRemove = couponsToRemove.map((c) => c.id);
            await UserCoupons.destroy({
                where: {
                    id: idsToRemove,
                },
            });
        }
        if (!allActiveCoupons || !allActiveCoupons.length > 0) return { status: true }

        // Extract coupon IDs that are already assigned
        const assignedCouponIds = userAssignedCoupons.map((entry) => entry.couponId);

        // Step 3: Find unassigned coupons
        const unassignedCoupons = allActiveCoupons.filter(
            (coupon) => !assignedCouponIds.includes(coupon.id)
        );

        if (unassignedCoupons.length > 0) {
            // Step 4: Prepare data for the unassigned coupons
            const newEntries = unassignedCoupons.map((coupon) => ({
                corporateUserId: userId,
                couponId: coupon.id,
                expiryDate: moment().add(coupon.expiryDays, "days").toDate(),
            }));
            // Step 5: Bulk create the new entries
            await UserCoupons.bulkCreate(newEntries);
        }
        return { status: true, isPekoCreditActive: !!userAssignedCoupons.length }
    } catch (error) {
        customLog(null, "error", { message: "Error while assigning coupons:", error })
        return { status: false }
    }
};

exports.assignCouponToCorporates = async (coupon) => {
    try {
        if (!coupon || coupon.status !== "ACTIVE") return { status: true, assigned: 0 };

        const corporateWhere = { registeredBy: coupon.partnerId ?? null };

        if (coupon.referralCodeId) {
            const referral = await getReferralById(coupon.referralCodeId);
            if (!referral?.referralCode) return { status: true, assigned: 0 };
            corporateWhere.referralCode = referral.referralCode;
        } else {
            corporateWhere.referralCode = { [Op.or]: [null, ""] };
        }

        const corporates = await CorporateUser.findAll({
            where: corporateWhere,
            attributes: ["id"],
            raw: true
        });

        if (!corporates.length) return { status: true, assigned: 0 };

        const corporateIds = corporates.map((corporate) => corporate.id);

        const alreadyAssigned = await UserCoupons.findAll({
            where: { couponId: coupon.id, corporateUserId: corporateIds },
            attributes: ["corporateUserId"],
            raw: true
        });

        const assignedIds = new Set(alreadyAssigned.map((entry) => entry.corporateUserId));
        const expiryDate = moment().add(coupon.expiryDays, "days").toDate();

        const newEntries = corporateIds
            .filter((id) => !assignedIds.has(id))
            .map((id) => ({ corporateUserId: id, couponId: coupon.id, expiryDate }));

        if (newEntries.length) {
            await UserCoupons.bulkCreate(newEntries);
        }

        return { status: true, assigned: newEntries.length };
    } catch (error) {
        customLog(null, "error", {
            action: "pekoCredits:eagerAssignFailed",
            message: "Error while assigning coupon to corporates",
            couponId: coupon?.id,
            partnerId: coupon?.partnerId ?? null,
            error
        });
        return { status: false, assigned: 0 };
    }
};

exports.findAllUserCoupons = async (corporateId, partnerId, params) => {
    try {

        let { page, itemsPerPage, accessKey, packageId, billingType } = params
        page = page ? parseInt(page) : 1;
        itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 10;

        const offset = (page - 1) * itemsPerPage;
         const serviceOpwhereClause = {}
        if (accessKey) {
            serviceOpwhereClause.accessKey = accessKey
        }

        // A plan and a billing cycle mean a subscription checkout: only the subscription coupons made for that plan and cycle are offered.
        const isSubscription = !!(packageId && billingType);
        const couponWhere = { status: 'ACTIVE', partnerId };
        if (isSubscription) {
            Object.assign(couponWhere, {
                couponType: 'SUBSCRIPTION',
                packageId: Number(packageId),
                billingType: { [Op.or]: [null, String(billingType).toUpperCase()] },
            });
        }


        const currentPageQuery = UserCoupons.findAndCountAll({
            include: [
                {
                    model: SubscriptionCoupons,
                    as: 'couponData',
                    attributes: ['id', 'code', 'discountType', 'discount', 'couponType', 'minimumPurchase', 'maximumDiscount', 'billingType'],
                    where: couponWhere,
                    include: [
                        { model: Package, attributes: ['packageName', 'aliasName'] },
                        { model: ServiceOperator,
                          where: isSubscription ? undefined : { ...serviceOpwhereClause },
                          attributes: ['serviceProvider'],
                          required: !!accessKey && !isSubscription},
                    ],
                },
            ],
            where: {
                corporateUserId: corporateId,
                status: { [Op.in]: ['CLAIMED', 'UNCLAIMED'] },
                expiryDate: { [Op.gt]: new Date() },
            },
            offset,
            limit: itemsPerPage,
            order: [['status', 'ASC'], ['claimedAt', 'DESC'], ['expiryDate', 'ASC']],
            raw: true,
            nest: true,
        });

        const unclaimedCouponsQuery = UserCoupons.findAll({
            include: [
                {
                    model: SubscriptionCoupons,
                    as: 'couponData',
                    attributes: ['discountType', 'discount', 'maximumDiscount'],
                    where: { status: 'ACTIVE', partnerId },
                },
            ],
            where: {
                corporateUserId: corporateId,
                status: 'UNCLAIMED',
                expiryDate: { [Op.gt]: new Date() },
            },
            raw: true,
            nest: true,
        });

        const [currentPageCoupons, unclaimedCoupons] = await Promise.all([currentPageQuery, unclaimedCouponsQuery]);

        return {
            currentPageCoupons,
            unclaimedCoupons,
        };
    } catch (error) {
        customLog(null, "error", { message: "Error fetching user coupons:", error })
        return false;
    }
};

exports.updateExpiredCoupons = async (corporateId) => {
    try {
        const result = await UserCoupons.update(
            { status: 'EXPIRED' },
            {
                where: {
                    corporateUserId: corporateId,
                    expiryDate: { [Op.lt]: new Date() },
                    status: { [Op.ne]: 'EXPIRED' }
                },
            }
        );
        return result;
    } catch (error) {
        customLog(null, "error", { message: "Error updating expired coupons:", error })
        return false;
    }
};