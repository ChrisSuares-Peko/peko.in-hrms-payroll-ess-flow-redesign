const { create } = require('../../../use-cases/works_plan');
const work_plans = require('../../../entities/works_plan');

jest.mock('../../../entities/works_plan', () => ({
    create: jest.fn(),
}));

describe('create', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a work plan successfully and return the response', async () => {
        const mockParams = { name: 'New Work Plan', description: 'Test description' };
        const mockResponse = { id: 1, ...mockParams };

        work_plans.create.mockResolvedValue(mockResponse);

        const result = await create(mockParams);

        expect(work_plans.create).toHaveBeenCalledWith(mockParams);
        expect(result).toEqual(mockResponse);
    });

    it('should return false when creation fails', async () => {
        const mockParams = { name: 'Invalid Plan' };
        work_plans.create.mockResolvedValue(null);

        const result = await create(mockParams);

        expect(result).toBe(false);
    });

   
});
