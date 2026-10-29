const { delete: deleteCoupon } = require('../../../use-cases/couponCode');
const couponCode = require('../../../entities/couponCode');

jest.mock('../../../entities/couponCode', () => ({
    destroy: jest.fn(),
}));
jest.mock('../../../entities/subCorporateUsers', () => ({
    belongsTo: jest.fn(),
}));
describe('delete', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete a coupon code successfully and return the number of deleted rows', async () => {
        const mockId = 1;
        couponCode.destroy.mockResolvedValue(1); 

        const result = await deleteCoupon(mockId);

        expect(couponCode.destroy).toHaveBeenCalledWith({ where: { id: mockId } });
        expect(result).toBe(1);
    });

    it('should return 0 if no coupon code is deleted', async () => {
        const mockId = 2;
        couponCode.destroy.mockResolvedValue(0);

        const result = await deleteCoupon(mockId);

        expect(result).toBe(0);
    });

    it('should throw an error if coupon deletion fails', async () => {
        const mockId = 3;
        const mockError = new Error('Database error');

        couponCode.destroy.mockRejectedValue(mockError);

        await expect(deleteCoupon(mockId)).rejects.toThrow('Database error');
    });
});
