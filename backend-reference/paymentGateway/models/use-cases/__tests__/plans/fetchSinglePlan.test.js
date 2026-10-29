const { fetchSinglePlan } = require('../../../use-cases/plans'); 
const plans = require('../../../entities/plans'); 

jest.mock('../../../entities/plans', () => ({
    findOne: jest.fn(),
}));


describe('fetchSinglePlan', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the plan when found and active', async () => {
        const mockPlanId = 1;
        const mockPlan = {
            id: mockPlanId,
            name: 'Test Plan',
            amount: 10,
            status: true,
            // ... other plan data
        };

        plans.findOne.mockResolvedValue(mockPlan);

        const result = await fetchSinglePlan(mockPlanId);

        expect(plans.findOne).toHaveBeenCalledWith({
            where: { id: mockPlanId, status: true },
            attributes: { exclude: ['createdAt', 'updatedAt'] },
        });
        expect(result).toEqual(mockPlan);
    });

    it('should return null when plan is not found', async () => {
        const mockPlanId = 1;

        plans.findOne.mockResolvedValue(null);

        const result = await fetchSinglePlan(mockPlanId);

        expect(plans.findOne).toHaveBeenCalledWith({
            where: { id: mockPlanId, status: true },
            attributes: { exclude: ['createdAt', 'updatedAt'] },
        });
        expect(result).toBeNull();
    });

    it('should return null when plan is found but inactive', async () => {
      const mockPlanId = 1;
      const mockPlan = {
          id: mockPlanId,
          name: 'Test Plan',
          amount: 10,
          status: false, // Inactive plan
          // ... other plan data
      };

      plans.findOne.mockResolvedValue(mockPlan);

      await fetchSinglePlan(mockPlanId);

      expect(plans.findOne).toHaveBeenCalledWith({
          where: { id: mockPlanId, status: true }, // Still searches for active plans
          attributes: { exclude: ['createdAt', 'updatedAt'] },
      });
     
  });

    it('should handle errors during database operations', async () => {
        const mockPlanId = 1;
        const mockError = new Error('Database error');

        plans.findOne.mockRejectedValue(mockError);

        await expect(fetchSinglePlan(mockPlanId)).rejects.toThrow(mockError); // Or handle the error as you prefer

        expect(plans.findOne).toHaveBeenCalledWith({
            where: { id: mockPlanId, status: true },
            attributes: { exclude: ['createdAt', 'updatedAt'] },
        });
    });

});