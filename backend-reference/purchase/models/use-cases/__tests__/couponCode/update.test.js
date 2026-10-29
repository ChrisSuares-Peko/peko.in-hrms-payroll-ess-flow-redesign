const { update } = require('../../../use-cases/couponCode');
const couponCode = require('../../../entities/couponCode');

jest.mock('../../../entities/couponCode', () => ({
    update: jest.fn(),
    findByPk: jest.fn(),
}));
jest.mock('../../../entities/subCorporateUsers', () => ({
    belongsTo: jest.fn(),
}));

describe('update', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update a coupon code successfully and return the updated entry', async () => {
        const mockId = 1;
        const mockUpdates = { discount: 20, status: 'active' };
        const mockUpdatedCoupon = { id: mockId, ...mockUpdates };

        couponCode.update.mockResolvedValue([1]); // Sequelize returns an array with affected rows count
        couponCode.findByPk.mockResolvedValue(mockUpdatedCoupon);

        const result = await update(mockId, mockUpdates);

        expect(couponCode.update).toHaveBeenCalledWith(mockUpdates, { where: { id: mockId } });
        expect(couponCode.findByPk).toHaveBeenCalledWith(mockId);
        expect(result).toEqual(mockUpdatedCoupon);
    });

    it('should return false if no coupon code is updated', async () => {
        const mockId = 2;
        const mockUpdates = { discount: 30, status: 'inactive' };
        couponCode.update.mockResolvedValue([0]);

        const result = await update(mockId, mockUpdates);

        expect(result).toBe(false);
    });

    it('should throw an error if coupon update fails', async () => {
        const mockId = 3;
        const mockUpdates = { discount: 25, status: 'pending' };
        const mockError = new Error('Database error');

        couponCode.update.mockRejectedValue(mockError);

        await expect(update(mockId, mockUpdates)).rejects.toThrow('Database error');
    });
});
