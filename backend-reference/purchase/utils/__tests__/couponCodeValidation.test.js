const { validateBulkCreateCouponCode, validateCouponCode } = require('../apiValidation');

const inDays = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

const coupon = (overrides = {}) => ({
    couponCode: 'BILLS50',
    discountType: 'FLAT',
    discount: 50,
    couponType: 'SERVICES',
    validFrom: inDays(1),
    validTo: inDays(30),
    partnerId: null,
    usageCount: 1,
    minimumPurchase: 100,
    ...overrides,
});

const run = (validator, body) => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    validator({ body }, res, next);
    return { res, next, message: res.json.mock.calls[0]?.[0]?.message };
};

describe('validateBulkCreateCouponCode', () => {
    it('accepts a services coupon for several operators', () => {
        const { next } = run(validateBulkCreateCouponCode, coupon({ serviceOperatorIds: ['3', '7'] }));

        expect(next).toHaveBeenCalled();
    });

    it('requires at least one operator for a services coupon', () => {
        expect(run(validateBulkCreateCouponCode, coupon({ serviceOperatorIds: [] })).message)
            .toBe('Please select at least one service operator.');
        expect(run(validateBulkCreateCouponCode, coupon()).message)
            .toBe('Please select at least one service operator.');
    });

    it('does not take a single operator on create', () => {
        const { next, message } = run(validateBulkCreateCouponCode, coupon({ serviceOperatorIds: ['3'], serviceOperatorId: 3 }));

        expect(next).not.toHaveBeenCalled();
        expect(message).toMatch(/serviceOperatorId/);
    });

    it('accepts a subscription coupon without operators', () => {
        const { next } = run(validateBulkCreateCouponCode, coupon({
            couponType: 'SUBSCRIPTION',
            packageId: 92,
            billingType: 'MONTHLY',
            serviceOperatorIds: null,
        }));

        expect(next).toHaveBeenCalled();
    });

    it('still rejects a start date in the past', () => {
        const { message } = run(validateBulkCreateCouponCode, coupon({ serviceOperatorIds: ['3'], validFrom: inDays(-2) }));

        expect(message).toBe('Valid from date cannot be in the past.');
    });
});

describe('validateCouponCode (edit)', () => {
    it('requires the operator of the row being edited', () => {
        expect(run(validateCouponCode, coupon()).message).toBe('Please select the service operator.');
    });

    it('accepts an edit of a single services row', () => {
        const { next } = run(validateCouponCode, coupon({ serviceOperatorId: 3 }));

        expect(next).toHaveBeenCalled();
    });
});
