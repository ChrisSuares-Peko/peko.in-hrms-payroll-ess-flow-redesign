const { findOnePlanDetails } = require('../../../use-cases/works_plan');
const work_plans = require('../../../entities/works_plan');
const works = require('../../../entities/works');

jest.mock('../../../entities/works_plan', () => ({
    findOne: jest.fn(),
}));

describe('findOnePlanDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a plan with associated work details when found', async () => {
        const mockParams = { id: 1 };
        const mockResponse = {
            id: 1,
            name: 'Test Plan',
            works: { id: 100, name: 'Test Work' },
        };

        work_plans.findOne.mockResolvedValue(mockResponse);

        const result = await findOnePlanDetails(mockParams);

        expect(work_plans.findOne).toHaveBeenCalledWith({
            where: { id: mockParams.id },
            include: [
                { model: works },
            ],
        });
        expect(result).toEqual({ success: true, message: 'Success', data: mockResponse });
    });

    it('should return null wrapped in success response when no plan is found', async () => {
        const mockParams = { id: 2 };
        work_plans.findOne.mockResolvedValue(null);

        const result = await findOnePlanDetails(mockParams);

        expect(result).toEqual({ success: true, message: 'Success', data: null });
    });

    it('should return error response when database fails', async () => {
        const mockParams = { id: 1 };
        const mockError = new Error('Database error');
        work_plans.findOne.mockRejectedValue(mockError);

        const result = await findOnePlanDetails(mockParams);

        expect(result).toEqual({
            success: false,
            message: 'Database error',
            statusCode: 500,
            error: mockError,
        });
    });
});
