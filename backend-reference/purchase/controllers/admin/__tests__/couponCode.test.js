jest.mock('../../../models/use-cases/couponCode', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    CouponCodeExport: jest.fn(),
    bulkCreateForServiceOperators: jest.fn(),
    findConflictingServiceOperators: jest.fn(),
}));
jest.mock('../../../models/use-cases/package', () => ({ findOnePackage: jest.fn() }));
jest.mock('../../../models/use-cases/order', () => ({ countOrdersUsingCoupon: jest.fn() }));
jest.mock('../../../models/entities/serviceOperator', () => ({ findAll: jest.fn() }));
jest.mock('../../../utils/generateExcelBufferAndType', () => ({ generateExcelBufferAndType: jest.fn() }));
jest.mock('../../../utils/reportTemplate', () => ({ reportPdfTemplate: jest.fn() }));

const couponCodeUseCases = require('../../../models/use-cases/couponCode');
const { findOnePackage } = require('../../../models/use-cases/package');
const { countOrdersUsingCoupon } = require('../../../models/use-cases/order');
const serviceOperator = require('../../../models/entities/serviceOperator');
const { createCouponCode, updateCoupon } = require('../couponCode');

const baseCoupon = (overrides = {}) => ({
    couponCode: 'BILLS50',
    discountType: 'FLAT',
    discount: 50,
    validFrom: '2026-10-10',
    validTo: '2026-10-31',
    partnerId: null,
    usageCount: 1,
    minimumPurchase: 100,
    ...overrides,
});

const call = async (handler, req) => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await handler(req, res, next);
    return { res, next };
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('createCouponCode — services', () => {
    it('creates one row per selected operator under the same code', async () => {
        couponCodeUseCases.findConflictingServiceOperators.mockResolvedValue([]);
        couponCodeUseCases.bulkCreateForServiceOperators.mockResolvedValue([{ id: 1 }, { id: 2 }]);

        const { res, next } = await call(createCouponCode, {
            body: baseCoupon({ couponType: 'SERVICES', serviceOperatorIds: ['3', '7'] }),
        });

        expect(couponCodeUseCases.findConflictingServiceOperators).toHaveBeenCalledWith({
            couponCode: 'BILLS50',
            partnerId: null,
            serviceOperatorIds: ['3', '7'],
        });
        const { baseData, serviceOperatorIds } = couponCodeUseCases.bulkCreateForServiceOperators.mock.calls[0][0];
        expect(serviceOperatorIds).toEqual(['3', '7']);
        expect(baseData).not.toHaveProperty('serviceOperatorIds');
        expect(baseData.validTo).toBe('2026-10-31 23:59:59');
        expect(next).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Coupon code added successfully for 2 service operators',
        }));
    });

    it('names the operators that already have this code and creates nothing', async () => {
        couponCodeUseCases.findConflictingServiceOperators.mockResolvedValue([{ serviceOperatorId: 7 }]);
        serviceOperator.findAll.mockResolvedValue([{ serviceProvider: 'Electricity' }]);

        const { next } = await call(createCouponCode, {
            body: baseCoupon({ couponType: 'SERVICES', serviceOperatorIds: ['3', '7'] }),
        });

        expect(next.mock.calls[0][0].message).toBe(
            'Coupon code "BILLS50" already exists for: Electricity. Please unselect these service operators and try again.'
        );
        expect(couponCodeUseCases.bulkCreateForServiceOperators).not.toHaveBeenCalled();
    });

    it('creates nothing when the duplicate check itself fails', async () => {
        couponCodeUseCases.findConflictingServiceOperators.mockResolvedValue(false);

        const { next } = await call(createCouponCode, {
            body: baseCoupon({ couponType: 'SERVICES', serviceOperatorIds: ['3'] }),
        });

        expect(next.mock.calls[0][0].message).toBe('Something went wrong while adding coupon code');
        expect(couponCodeUseCases.bulkCreateForServiceOperators).not.toHaveBeenCalled();
    });
});

describe('createCouponCode — subscription', () => {
    it('creates a single row with no operator when the code is free for that partner', async () => {
        couponCodeUseCases.findOne.mockResolvedValue(null);
        findOnePackage.mockResolvedValue({ packagePrices: { monthly: 999, annually: 9999 } });
        couponCodeUseCases.create.mockResolvedValue({ id: 9 });

        const { res } = await call(createCouponCode, {
            body: baseCoupon({ couponType: 'SUBSCRIPTION', packageId: 92, billingType: 'MONTHLY', serviceOperatorIds: ['3'] }),
        });

        expect(couponCodeUseCases.findOne).toHaveBeenCalledWith({ couponCode: 'BILLS50', partnerId: null, serviceOperatorId: null });
        const created = couponCodeUseCases.create.mock.calls[0][0];
        expect(created.serviceOperatorId).toBeNull();
        expect(created).not.toHaveProperty('serviceOperatorIds');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('rejects a code already used by another subscription coupon of the same partner', async () => {
        couponCodeUseCases.findOne.mockResolvedValue({ id: 4 });

        const { next } = await call(createCouponCode, {
            body: baseCoupon({ couponType: 'SUBSCRIPTION', packageId: 92, billingType: 'MONTHLY' }),
        });

        expect(next.mock.calls[0][0].message).toBe('Coupon code already exists');
        expect(couponCodeUseCases.create).not.toHaveBeenCalled();
    });
});

describe('updateCoupon', () => {
    it('refuses to edit a coupon that orders have already used', async () => {
        countOrdersUsingCoupon.mockResolvedValue(2);

        const { next } = await call(updateCoupon, {
            params: { id: '15' },
            body: baseCoupon({ couponType: 'SERVICES', serviceOperatorId: '3' }),
        });

        expect(countOrdersUsingCoupon).toHaveBeenCalledWith(15);
        expect(next.mock.calls[0][0].message).toBe('This coupon has already been used in transactions and cannot be updated');
        expect(couponCodeUseCases.update).not.toHaveBeenCalled();
    });

    it('checks uniqueness only within the same partner and operator', async () => {
        countOrdersUsingCoupon.mockResolvedValue(0);
        couponCodeUseCases.findOne.mockResolvedValue({ id: 15 });
        couponCodeUseCases.update.mockResolvedValue([1]);

        const { res } = await call(updateCoupon, {
            params: { id: '15' },
            body: baseCoupon({ couponType: 'SERVICES', serviceOperatorId: '3' }),
        });

        expect(couponCodeUseCases.findOne).toHaveBeenCalledWith({ couponCode: 'BILLS50', partnerId: null, serviceOperatorId: '3' });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('rejects renaming to a code another row already uses for that operator', async () => {
        countOrdersUsingCoupon.mockResolvedValue(0);
        couponCodeUseCases.findOne.mockResolvedValue({ id: 99 });

        const { next } = await call(updateCoupon, {
            params: { id: '15' },
            body: baseCoupon({ couponType: 'SERVICES', serviceOperatorId: '3' }),
        });

        expect(next.mock.calls[0][0].message).toBe('Coupon code already exists');
    });
});
