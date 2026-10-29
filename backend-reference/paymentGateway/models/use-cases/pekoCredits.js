const SubscriptionCoupons = require("../entities/pekoCredits");
const UserCoupons = require("../entities/userCoupons.js");
const ServiceOperator = require("../entities/serviceOperator");
const CouponCode = require("../entities/couponCode");
const { Op } = require('sequelize');
const usecaseHandler = require("../../utils/usecase-handler");

/**
 * @returns {Promise<{ success: boolean, message: string, data?: any, error?: any }>}
 */
exports.findOneCouponData = usecaseHandler(async ({couponCode, corporateUserId, packageId}) => {
    const couponDetails = await UserCoupons.findOne({
        include: [
            {
                model: SubscriptionCoupons,
                as: 'couponData',
                attributes: ['id', 'code', 'discountType', 'discount', 'couponType', 'minimumPurchase', 'maximumDiscount', 'billingType'],
                where: { status: 'ACTIVE', code: couponCode, packageId }
            }
        ],
        where: { corporateUserId, status: "UNCLAIMED", expiryDate: { [Op.gt]: new Date() } },
        raw: true,
        nest: true
    });

    return couponDetails ? couponDetails.couponData : null;
});

/**
 * @returns {Promise<{ success: boolean, message: string, data?: any, error?: any }>}
 */
exports.updateOneCouponData = usecaseHandler(async ({couponData, corporateId, transaction, discountAmount}) => {
    const [claimedCount] = await UserCoupons.update(
        { status: 'CLAIMED', claimedAt: new Date(), usedCouponData: { ...couponData, discountAmount: discountAmount } },
        {
            where: { couponId: couponData.id, corporateUserId: corporateId, status: 'UNCLAIMED' },
            transaction
        }
    );

    if (!claimedCount) {
        throw new Error("COUPON ALREADY CLAIMED");
    }

    return { claimed: claimedCount };
});

/**
 * @returns {Promise<{ success: boolean, message: string, data?: any, error?: any }>}
 */
// Mirrors Peko-AE/gateway/models/use-cases/pekoCredits `findOneCoupon`, plus partnerScope so global
// coupons (partnerId null/empty) match alongside partner-scoped rows.
exports.findOneCoupon = usecaseHandler(async ({ couponCode, corporateUserId, serviceId, partnerId, accessKey, packageId }) => {
    const partnerScope = partnerId
        ? { [Op.or]: [{ partnerId }, { partnerId: { [Op.is]: null } }, { partnerId: '' }] }
        : { [Op.or]: [{ partnerId: { [Op.is]: null } }, { partnerId: '' }] };

    const includeConditions = {
        model: SubscriptionCoupons,
        as: 'couponData',
        attributes: ['id', 'code', 'discountType', 'discount', 'couponType', 'minimumPurchase', 'maximumDiscount'],
        where: { status: 'ACTIVE', code: couponCode, ...partnerScope }
    };

    if (accessKey && accessKey === 'gift_cards_combined') {
        includeConditions.include = [{
            model: ServiceOperator,
            as: 'serviceOperator',
            attributes: ['serviceCategory'],
            where: { serviceCategory: 'Gift Cards/Vouchers' }
        }];
    } else if (packageId) {
        includeConditions.where.packageId = packageId;
    } else {
        includeConditions.where.serviceOperatorId = serviceId;
    }

    const couponDetails = await UserCoupons.findOne({
        include: [includeConditions],
        where: { corporateUserId, status: "UNCLAIMED", expiryDate: { [Op.gt]: new Date() } },
        raw: true,
        nest: true
    });

   if (couponDetails) return couponDetails;
    // Fall back to service-based coupon codes table
    if (serviceId) {
        const serviceCoupon = await CouponCode.findOne({
            where: {
                couponCode,
                status: true,
                partnerId,
                serviceOperatorId: serviceId,
                validFrom: { [Op.lte]: new Date() },
                validTo: { [Op.gte]: new Date() }
            },
            raw: true
        });
        if (serviceCoupon) return { couponData: serviceCoupon };
    }
    return null;
});