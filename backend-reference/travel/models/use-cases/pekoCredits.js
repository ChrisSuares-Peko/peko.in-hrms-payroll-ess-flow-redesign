const { Op } = require('sequelize');
const SubscriptionCoupons = require('../entities/pekoCredits');
const UserCoupons = require('../entities/userCoupons');
const CouponCode = require('../entities/couponCode');

exports.findOneCoupon = async ({ couponCode, corporateUserId, serviceId, partnerId }) => {
    const partnerScope = partnerId
        ? { [Op.or]: [{ partnerId }, { partnerId: { [Op.is]: null } }, { partnerId: '' }] }
        : { [Op.or]: [{ partnerId: { [Op.is]: null } }, { partnerId: '' }] };

    const couponDetails = await UserCoupons.findOne({
        include: [{
            model: SubscriptionCoupons,
            as: 'couponData',
            attributes: ['id', 'code', 'discountType', 'discount', 'couponType', 'minimumPurchase', 'maximumDiscount'],
            where: { status: 'ACTIVE', code: couponCode, serviceOperatorId: serviceId, ...partnerScope },
        }],
        where: { corporateUserId, status: 'UNCLAIMED', expiryDate: { [Op.gt]: new Date() } },
        raw: true,
        nest: true,
    });
    if (couponDetails) return couponDetails;

    const serviceCoupon = await CouponCode.findOne({
        where: {
            couponCode,
            status: true,
            partnerId: partnerId ?? null,
            serviceOperatorId: serviceId,
            validFrom: { [Op.lte]: new Date() },
            validTo: { [Op.gte]: new Date() },
        },
        raw: true,
    });
    return serviceCoupon ? { couponData: serviceCoupon } : null;
};
