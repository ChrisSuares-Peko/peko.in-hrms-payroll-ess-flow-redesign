const serviceOperator = require('../../../entities/serviceOperator');
const { Op } = require('sequelize');
const { getServiceOperatorsWithOutCashBack } = require('../../serviceOperator');

jest.mock('../../../entities/serviceOperator', () => ({
    findAll: jest.fn(),
}));

describe('getServiceOperatorsWithOutCashBack', () => {

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should return matching service operators with correct filtering', async () => {
        const ids = [1, 2, 3];

        const mockResult = [
            { id: 1, serviceProvider: "Airtel", serviceCategory: "Mobile" },
            { id: 2, serviceProvider: "Jio", serviceCategory: "Mobile" }
        ];

        serviceOperator.findAll.mockResolvedValue(mockResult);

        const result = await getServiceOperatorsWithOutCashBack(ids);

        expect(serviceOperator.findAll).toHaveBeenCalledWith({
            where: {
                id: { [Op.in]: ids },
                serviceStatus: true
            },
            order: [['serviceProvider', 'ASC']],
            attributes: ['id', 'serviceProvider', 'serviceCategory']
        });

        expect(result).toEqual(mockResult);
    });

    it('should return an empty array when no service operators match', async () => {
        serviceOperator.findAll.mockResolvedValue([]);

        const result = await getServiceOperatorsWithOutCashBack([100, 200]);

        expect(result).toEqual([]);
    });

    it('should handle empty ids array (returns empty array)', async () => {
        serviceOperator.findAll.mockResolvedValue([]);

        const result = await getServiceOperatorsWithOutCashBack([]);

        expect(serviceOperator.findAll).toHaveBeenCalledWith({
            where: {
                id: { [Op.in]: [] },
                serviceStatus: true
            },
            order: [['serviceProvider', 'ASC']],
            attributes: ['id', 'serviceProvider', 'serviceCategory']
        });

        expect(result).toEqual([]);
    });

    it('should throw an error if database query fails', async () => {
        const error = new Error("DB error");

        serviceOperator.findAll.mockRejectedValue(error);

        await expect(getServiceOperatorsWithOutCashBack([1, 2]))
            .rejects
            .toThrow("DB error");
    });
});
