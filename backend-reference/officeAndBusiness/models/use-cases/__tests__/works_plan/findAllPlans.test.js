const { findAllPlans } = require('../../../use-cases/works_plan');
const work_plans = require('../../../entities/works_plan');

jest.mock('../../../entities/works_plan', () => ({
    findAll: jest.fn(),
}));

describe('findAllPlans', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all plans matching the given workId and active status', async () => {
        const mockParams = { workId: 1 };
        const mockResponse = [
            { id: 1, workId: 1, status: true, planName: 'Plan A' },
            { id: 2, workId: 1, status: true, planName: 'Plan B' },
        ];

        work_plans.findAll.mockResolvedValue(mockResponse);

        const result = await findAllPlans(mockParams);

        expect(work_plans.findAll).toHaveBeenCalledWith({
            where: {
                workId: mockParams.workId,
                status: true,
            },
        });
        expect(result).toEqual(mockResponse);
    });

    it('should return an empty array when no active plans are found for the given workId', async () => {
        const mockParams = { workId: 2 };
        work_plans.findAll.mockResolvedValue([]);

        const result = await findAllPlans(mockParams);

        expect(result).toEqual([]);
    });

   
});
