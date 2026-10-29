const { findOne } = require('../../../use-cases/couponCode');
const couponCode = require('../../../entities/couponCode');

jest.mock('../../../entities/couponCode', () => ({
    findOne: jest.fn(),
}));
jest.mock('../../../entities/subCorporateUsers', () => ({
    belongsTo: jest.fn(),
}));
describe('findOne', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find a coupon code successfully', async () => {
        const mockParams = { code: 'DISCOUNT10' };
        const mockCoupon = { id: 1, code: 'DISCOUNT10', discount: 10, status: 'active' };

        couponCode.findOne.mockResolvedValue(mockCoupon);

        const result = await findOne(mockParams);

        expect(couponCode.findOne).toHaveBeenCalledWith({ where: mockParams });
        expect(result).toEqual(mockCoupon);
    });

    it('should return null if no coupon code is found', async () => {
        const mockParams = { code: 'INVALIDCODE' };
        couponCode.findOne.mockResolvedValue(null);

        const result = await findOne(mockParams);

        expect(result).toBeNull();
    });

    it('should throw an error if coupon lookup fails', async () => {
        const mockParams = { code: 'DISCOUNT10' };
        const mockError = new Error('Database error');

        couponCode.findOne.mockRejectedValue(mockError);

        await expect(findOne(mockParams)).rejects.toThrow('Database error');
    });
});
