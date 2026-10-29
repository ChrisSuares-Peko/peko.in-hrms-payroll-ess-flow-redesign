const { findAllPlans } = require('../../../use-cases/plans');
const plans = require('../../../entities/plans');

jest.mock('../../../entities/plans', () => ({
    findAll: jest.fn(),
}));

describe('findAllPlans', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all active plans', async () => {
        const mockResponse = [
            { id: 1, name: 'Basic Plan', status: true },
            { id: 2, name: 'Premium Plan', status: true },
        ];

        plans.findAll.mockResolvedValue(mockResponse);

        const result = await findAllPlans();

        expect(plans.findAll).toHaveBeenCalledWith({
            where: { status: true },
        });
        expect(result).toEqual(mockResponse);
    });

    it('should return an empty array when no active plans are found', async () => {
        plans.findAll.mockResolvedValue([]);

        const result = await findAllPlans();

        expect(result).toEqual([]);
    });

    it('should throw an error when findAll fails', async () => {
        const mockError = new Error('Database error');

        plans.findAll.mockRejectedValue(mockError);

        await expect(findAllPlans()).rejects.toThrow('Database error');
    });
});
