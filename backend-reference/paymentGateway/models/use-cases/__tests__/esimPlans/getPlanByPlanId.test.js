const { getPlanByPlanId } = require('../../../use-cases/esimPlans'); // Adjust path
const esim = require('../../../entities/esimPlan'); 

jest.mock('../../../entities/esimPlan', () => ({
    findOne: jest.fn(),
}));

describe('getPlanByPlanId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the plan when found and active', async () => {
        const mockPlanId = '12345';
        const mockPlan = {
            amount: 10,
            planId: mockPlanId,
            name: 'Test Plan',
            dataMBs: 1000,
            periodDays: 30,
            country: 'US',
        };

        esim.findOne.mockResolvedValue(mockPlan);

        const result = await getPlanByPlanId(mockPlanId);

        expect(esim.findOne).toHaveBeenCalledWith({
            where: { planId: mockPlanId, status: true },
            attributes: ['amount', 'planId', 'name', 'dataMBs', 'periodDays', 'country'],
            raw: true,
        });
        expect(result).toEqual(mockPlan);
    });

    it('should return null when plan is not found', async () => {
        const mockPlanId = '12345';

        esim.findOne.mockResolvedValue(null);

        const result = await getPlanByPlanId(mockPlanId);

        expect(esim.findOne).toHaveBeenCalledWith({
            where: { planId: mockPlanId, status: true },
            attributes: ['amount', 'planId', 'name', 'dataMBs', 'periodDays', 'country'],
            raw: true,
        });
        expect(result).toBeNull(); // Or perhaps false, depending on how you want to handle it
    });

    it('should return null when plan is found but inactive', async () => {
      const mockPlanId = '12345';
      const mockPlan = {
          amount: 10,
          planId: mockPlanId,
          name: 'Test Plan',
          dataMBs: 1000,
          periodDays: 30,
          country: 'US',
          status: false // Inactive plan
      };

      esim.findOne.mockResolvedValue(mockPlan);

      await getPlanByPlanId(mockPlanId);

      expect(esim.findOne).toHaveBeenCalledWith({
          where: { planId: mockPlanId, status: true }, // Still searches for active plans
          attributes: ['amount', 'planId', 'name', 'dataMBs', 'periodDays', 'country'],
          raw: true,
      });
    
  });

    it('should handle errors during database operations', async () => {
        const mockPlanId = '12345';
        const mockError = new Error('Database error');

        esim.findOne.mockRejectedValue(mockError);

        const consoleLogSpy = jest.spyOn(console, 'log'); // Spy on console.log

        const result = await getPlanByPlanId(mockPlanId);

        expect(esim.findOne).toHaveBeenCalledWith({
            where: { planId: mockPlanId, status: true },
            attributes: ['amount', 'planId', 'name', 'dataMBs', 'periodDays', 'country'],
            raw: true,
        });
        expect(consoleLogSpy).toHaveBeenCalledWith("Error in getPlanByPlanId:", mockError);
        expect(result).toBe(false); // Or perhaps re-throw, depending on your error handling

        consoleLogSpy.mockRestore(); // Restore console.log
    });
});