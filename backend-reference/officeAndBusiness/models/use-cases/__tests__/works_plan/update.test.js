const { update } = require('../../../use-cases/works_plan');
const work_plans = require('../../../entities/works_plan');

jest.mock('../../../entities/works_plan', () => ({
    update: jest.fn(),
}));

describe('update', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update a work plan successfully and return the response', async () => {
        const mockParams = { id: 1 };
        const mockData = { name: 'Updated Work Plan' };
        const mockResponse = [1]; // Sequelize update returns an array with the number of affected rows

        work_plans.update.mockResolvedValue(mockResponse);

        const result = await update(mockData, mockParams);

        expect(work_plans.update).toHaveBeenCalledWith(mockData, { where: { id: mockParams.id } });
        expect(result).toEqual(mockResponse);
    });

   

    it('should return false when update fails', async () => {
        const mockParams = { id: 3 };
        const mockData = { name: 'Invalid Plan' };

        work_plans.update.mockResolvedValue(null);

        const result = await update(mockData, mockParams);

        expect(result).toBe(false);
    });
});
