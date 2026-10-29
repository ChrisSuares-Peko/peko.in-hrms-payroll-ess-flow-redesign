const { getPlanByPlanId } = require('../../../use-cases/esim');
const esim = require('../../../entities/esim');

jest.mock('../../../entities/esim', () => ({
    findOne: jest.fn(),
}));

describe('getPlanByPlanId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an eSIM plan if found by planId', async () => {
        const mockPlanId = 'PLAN123';
        const mockPlan = {
            amount: 10,
            planId: mockPlanId,
            name: 'Basic Plan',
            dataMBs: 500,
            periodDays: 30,
            country: 'United States',
            provider: 'Provider A'
        };

        esim.findOne.mockResolvedValue(mockPlan);

        const result = await getPlanByPlanId(mockPlanId);

        expect(esim.findOne).toHaveBeenCalledWith({
            where: {
                planId: mockPlanId,
                status: true,
            },
            attributes: ['amount', 'planId', 'name', 'dataMBs', 'periodDays','country','provider','coverageId'],
            raw: true,
        });
        expect(result).toEqual(mockPlan);
    });

    it('should return null if no eSIM plan is found', async () => {
        const mockPlanId = 'INVALIDPLAN';
        esim.findOne.mockResolvedValue(null);

        const result = await getPlanByPlanId(mockPlanId);

        expect(result).toBeNull();
    });

    it('should return false if an error occurs during query execution', async () => {
        const mockPlanId = 'PLAN123';
        const mockError = new Error('Database error');

        esim.findOne.mockRejectedValue(mockError);

        const result = await getPlanByPlanId(mockPlanId);

        expect(result).toBe(false);
    });
});
