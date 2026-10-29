const { findOnePlanWithWorkId } = require('../../../use-cases/works_plan');
const work_plans = require('../../../entities/works_plan');

jest.mock('../../../entities/works_plan', () => ({
    findOne: jest.fn(),
}));

describe('findOnePlanWithWorkId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a work plan when found by workId', async () => {
        const mockParams = { id: 1 };
        const mockResponse = { id: 1, workId: 1, name: 'Test Plan' };

        work_plans.findOne.mockResolvedValue(mockResponse);

        const result = await findOnePlanWithWorkId(mockParams);

        expect(work_plans.findOne).toHaveBeenCalledWith({
            where: { workId: mockParams.id },
        });
        expect(result).toEqual(mockResponse);
    });

    it('should return null when no work plan is found', async () => {
        const mockParams = { id: 2 };
        work_plans.findOne.mockResolvedValue(null);

        const result = await findOnePlanWithWorkId(mockParams);

        expect(result).toBeNull();
    });

 
});
