const cashback = require('../../../entities/cashback');
const { Op } = require('sequelize');
const { checkCashbackServiceOperator } = require('../../serviceOperator');

jest.mock('../../../entities/cashback', () => ({
    findAll: jest.fn(),
}));

describe('checkCashbackServiceOperator', () => {

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should return unique service operator IDs', async () => {
        cashback.findAll.mockResolvedValue([
            { serviceOperatorId: 1 },
            { serviceOperatorId: 2 },
            { serviceOperatorId: 1 },  // duplicate
        ]);

        const result = await checkCashbackServiceOperator([1, 2, 3], [10, 20]);

        expect(cashback.findAll).toHaveBeenCalledWith({
            attributes: ['serviceOperatorId'],
            where: {
                [Op.and]: [
                    { serviceOperatorId: { [Op.in]: [1, 2, 3] } },
                    { packageId: { [Op.in]: [10, 20] } }
                ]
            }
        });

        expect(result).toEqual([1, 2]);  // unique only
    });

    it('should return an empty array when no matching records exist', async () => {
        cashback.findAll.mockResolvedValue([]);

        const result = await checkCashbackServiceOperator([1, 2], [10]);

        expect(result).toEqual([]);
    });

    it('should return empty array if ids array is empty', async () => {
        cashback.findAll.mockResolvedValue([]);

        const result = await checkCashbackServiceOperator([], [10, 20]);

        expect(cashback.findAll).toHaveBeenCalledWith({
            attributes: ['serviceOperatorId'],
            where: {
                [Op.and]: [
                    { serviceOperatorId: { [Op.in]: [] } },
                    { packageId: { [Op.in]: [10, 20] } }
                ]
            }
        });

        expect(result).toEqual([]);
    });

    it('should return empty array if packageIds array is empty', async () => {
        cashback.findAll.mockResolvedValue([]);

        const result = await checkCashbackServiceOperator([1, 2], []);

        expect(cashback.findAll).toHaveBeenCalledWith({
            attributes: ['serviceOperatorId'],
            where: {
                [Op.and]: [
                    { serviceOperatorId: { [Op.in]: [1, 2] } },
                    { packageId: { [Op.in]: [] } }
                ]
            }
        });

        expect(result).toEqual([]);
    });

    it('should return empty array when both arrays are empty', async () => {
        cashback.findAll.mockResolvedValue([]);

        const result = await checkCashbackServiceOperator([], []);

        expect(result).toEqual([]);
    });

    it('should throw an error when database query fails', async () => {
        const error = new Error("DB error");
        cashback.findAll.mockRejectedValue(error);

        await expect(checkCashbackServiceOperator([1], [2])).rejects.toThrow("DB error");
    });
});
