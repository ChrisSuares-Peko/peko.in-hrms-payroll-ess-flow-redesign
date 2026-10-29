const { findOne } = require('../../cashback');
const cashback = require('../../../entities/cashback');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('findOne', () => {
    it('should find a cashback by serviceOperatorId and packageIds', async () => {
        const mockResult = { id: 1, serviceOperatorId: 1, packageId: 10 };
        cashback.findOne.mockResolvedValue(mockResult);

        const result = await findOne({ serviceOperatorId: 1, packageIds: [10, 20] });
        expect(result).toEqual(mockResult);
        expect(cashback.findOne).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({
                serviceOperatorId: 1,
                serviceStatus: true,
            }),
            raw: true
        }));
    });

    it('should return null when no cashback found', async () => {
        cashback.findOne.mockResolvedValue(null);

        const result = await findOne({ serviceOperatorId: 999, packageIds: [1] });
        expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
        cashback.findOne.mockRejectedValue(new Error('DB Error'));

        const result = await findOne({ serviceOperatorId: 1, packageIds: [10] });
        expect(result).toBeUndefined();
    });
});
