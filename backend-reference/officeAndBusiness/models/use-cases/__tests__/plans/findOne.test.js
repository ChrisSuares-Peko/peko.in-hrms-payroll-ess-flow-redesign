const { findOne } = require('../../../use-cases/plans');
const plans = require('../../../entities/plans');

jest.mock('../../../entities/plans', () => ({
    findOne: jest.fn(),
}));

describe('findOne', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a plan when found', async () => {
        const mockName = 'Basic Plan';
        const mockResponse = { id: 1, name: 'Basic Plan', price: 100 };

        plans.findOne.mockResolvedValue(mockResponse);

        const result = await findOne(mockName);

        expect(plans.findOne).toHaveBeenCalledWith({
            where: { name: mockName },
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockResponse);
    });

    it('should return null when no plan is found', async () => {
        const mockName = 'Nonexistent Plan';
        plans.findOne.mockResolvedValue(null);

        const result = await findOne(mockName);

        expect(result).toBeNull();
    });

    it('should throw an error when findOne fails', async () => {
        const mockName = 'Error Plan';
        const mockError = new Error('Database error');

        plans.findOne.mockRejectedValue(mockError);

        await expect(findOne(mockName)).rejects.toThrow('Database error');
    });
});
