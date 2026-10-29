const { fetchSinglePlan } = require('../../../use-cases/workspaces');
const plans = require('../../../entities/plans');

jest.mock('../../../entities/plans', () => ({
    findOne: jest.fn(),
}));

describe('fetchSinglePlan', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a single plan when a valid plan ID is provided', async () => {
        const mockPlanId = 1;
        const mockPlan = {
            id: mockPlanId,
            name: 'Premium Plan',
            price: 100,
            description: 'Test plan description',
            highlights: 'Best features',
            status: true,
        };

        plans.findOne.mockResolvedValue(mockPlan);

        const result = await fetchSinglePlan(mockPlanId);

        expect(plans.findOne).toHaveBeenCalledWith({
            where: {
                id: mockPlanId,
                status: true,
            },
            attributes: {
                exclude: ["createdAt", "updatedAt"],
            },
        });

        expect(result).toEqual(mockPlan);
    });

    it('should return null if no plan is found', async () => {
        const mockPlanId = 999;

        plans.findOne.mockResolvedValue(null);

        const result = await fetchSinglePlan(mockPlanId);

        expect(result).toBeNull();
    });

  
});
