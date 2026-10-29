jest.mock('../../models/use-cases/couponCode', () => ({ findOne: jest.fn() }));
jest.mock('../../models/use-cases/pekoCredits', () => ({ findOneCouponData: jest.fn(), updateOneCouponData: jest.fn() }));
jest.mock('../../models/use-cases/subscription', () => ({ findAllSubscription: jest.fn() }));
jest.mock('../../models/use-cases/corporateUser', () => ({ findOneCorporateUser: jest.fn() }));
jest.mock('../../models/use-cases/referral_codes', () => ({ getReferralByCode: jest.fn() }));

const { findOne } = require('../../models/use-cases/couponCode');
const { findOneCouponData } = require('../../models/use-cases/pekoCredits');
const { findAllSubscription } = require('../../models/use-cases/subscription');
const { findOneCorporateUser } = require('../../models/use-cases/corporateUser');
const { calculateDiscount } = require('../calculateDiscount');

describe('calculateDiscount — subscription coupon lookup', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        findOneCouponData.mockResolvedValue({ data: null });
        findOneCorporateUser.mockResolvedValue({ data: { referralCode: null } });
        findAllSubscription.mockResolvedValue([]);
    });

    it('only matches coupons that are not tied to a service', async () => {
        findOne.mockResolvedValue({ couponCode: 'PLAN10', discountType: 'FLAT', discount: 100, usageCount: 1 });

        const result = await calculateDiscount(21, 'PLAN10', 999, 92, null, 'MONTHLY', false, null);

        expect(findOne).toHaveBeenCalledWith(expect.objectContaining({
            couponCode: 'PLAN10',
            partnerId: null,
            serviceOperatorId: null,
            referralCodeId: null,
        }));
        expect(result.data.discountAmount).toBe('100.00');
    });

    it('rejects a code that only exists as a service coupon', async () => {
        findOne.mockResolvedValue(null);

        const result = await calculateDiscount(21, 'BILLS50', 999, 92, null, 'MONTHLY', false, null);

        expect(result).toEqual({ success: false, message: 'Invalid or inactive coupon code' });
    });
});
