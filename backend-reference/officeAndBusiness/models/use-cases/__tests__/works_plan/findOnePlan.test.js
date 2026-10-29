const { findOnePlan } = require('../../../use-cases/works_plan');
const work_plans = require('../../../entities/works_plan');

jest.mock('../../../entities/works_plan', () => ({
    findOne: jest.fn(),
}));

describe('findOnePlan', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a plan when found by ID', async () => {
        const mockParams = { id: 1 };
        const mockResponse = { id: 1, name: 'Test Plan' };

        work_plans.findOne.mockResolvedValue(mockResponse);

        const result = await findOnePlan(mockParams);

        expect(work_plans.findOne).toHaveBeenCalledWith({
            where: { id: mockParams.id },
        });
        expect(result).toEqual(mockResponse);
    });

    it('should return null when no plan is found', async () => {
        const mockParams = { id: 2 };
        work_plans.findOne.mockResolvedValue(null);

        const result = await findOnePlan(mockParams);

        expect(result).toBeNull();
    });

   
});
