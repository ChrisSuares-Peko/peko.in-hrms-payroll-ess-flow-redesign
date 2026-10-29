const { create } = require('../../../use-cases/couponCode');
const couponCode = require('../../../entities/couponCode');

jest.mock('../../../entities/couponCode', () => ({
    create: jest.fn(),
}));
jest.mock('../../../entities/subCorporateUsers', () => ({
    belongsTo: jest.fn(),
}));
describe('create', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a coupon code successfully', async () => {
        const mockParams = { code: 'DISCOUNT10', discount: 10, status: 'active' };
        const mockCoupon = { id: 1, ...mockParams };

        couponCode.create.mockResolvedValue(mockCoupon);

        const result = await create(mockParams);

        expect(couponCode.create).toHaveBeenCalledWith(mockParams, {});
        expect(result).toEqual(mockCoupon);
    });

    it('passes the transaction options through', async () => {
        const mockParams = { code: 'DISCOUNT10', discount: 10, status: 'active' };
        const options = { transaction: { id: 't1' } };
        couponCode.create.mockResolvedValue({ id: 1 });

        await create(mockParams, options);

        expect(couponCode.create).toHaveBeenCalledWith(mockParams, options);
    });

    it('should return false if coupon creation fails', async () => {
        const mockParams = { code: 'DISCOUNT10', discount: 10, status: 'active' };

        couponCode.create.mockRejectedValue(new Error('Database error'));

        await expect(create(mockParams)).resolves.toBe(false);
    });
});
