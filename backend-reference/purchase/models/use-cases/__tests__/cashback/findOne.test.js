const { findOne } = require('../../../use-cases/cashback');
const cashback = require('../../../entities/cashback');
const { Op } = require('sequelize');

jest.mock('../../../entities/cashback', () => ({
    findOne: jest.fn(),
}));

describe('findOne', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a cashback entry if found', async () => {
        const mockParams = { serviceOperatorId: 1, packageIds: [101, 102] };
        const mockCashback = { id: 1, packageId: 101, serviceOperatorId: 1, serviceStatus: true };

        cashback.findOne.mockResolvedValue(mockCashback);

        const result = await findOne(mockParams);

        expect(cashback.findOne).toHaveBeenCalledWith({
            where: {
                packageId: {
                    [Op.in]: mockParams.packageIds,
                },
                serviceOperatorId: mockParams.serviceOperatorId,
                serviceStatus: true,
            },
            raw: true,
        });
        expect(result).toEqual(mockCashback);
    });

    it('should return null if no cashback entry is found', async () => {
        const mockParams = { serviceOperatorId: 2, packageIds: [103, 104] };
        cashback.findOne.mockResolvedValue(null);

        const result = await findOne(mockParams);

        expect(result).toBeNull();
    });

   
});
