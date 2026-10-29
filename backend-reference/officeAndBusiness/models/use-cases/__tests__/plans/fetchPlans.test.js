const { fetchPlans } = require('../../../use-cases/plans');
const plans = require('../../../entities/plans');
const { Op } = require('sequelize');

jest.mock('../../../entities/plans', () => ({
    findAll: jest.fn(),
}));

describe('fetchPlans', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return plans matching the search query', async () => {
        const mockQuery = 'test';
        const mockResponse = [
            { id: 1, name: 'Test Plan' },
            { id: 2, name: 'Another Test Plan' },
        ];

        plans.findAll.mockResolvedValue(mockResponse);

        const result = await fetchPlans(mockQuery);

        expect(plans.findAll).toHaveBeenCalledWith({
            where: {
                name: {
                    [Op.like]: `%${mockQuery}%`,
                },
                status: true,
            },
            attributes: ['id', 'name'],
        });
        expect(result).toEqual(mockResponse);
    });

    it('should return an empty array when no matching plans are found', async () => {
        const mockQuery = 'nonexistent';
        plans.findAll.mockResolvedValue([]);

        const result = await fetchPlans(mockQuery);

        expect(result).toEqual([]);
    });

    it('should throw an error when findAll fails', async () => {
        const mockQuery = 'error';
        const mockError = new Error('Database error');

        plans.findAll.mockRejectedValue(mockError);

        await expect(fetchPlans(mockQuery)).rejects.toThrow('Database error');
    });
});
