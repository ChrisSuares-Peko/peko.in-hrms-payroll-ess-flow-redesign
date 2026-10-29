const { fetchSinglePlan } = require('../../plans');
const plans = require('../../../entities/plans');

jest.mock('../../../entities/plans', () => ({
  findOne: jest.fn(),
}));

describe('fetchSinglePlan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch a plan by ID', async () => {
    const mockPlanId = 1;
    const mockPlan = {
      id: mockPlanId,
      name: 'Test Plan',
      price: 100,
    };

    plans.findOne.mockResolvedValue(mockPlan);

    const result = await fetchSinglePlan(mockPlanId);

    expect(plans.findOne).toHaveBeenCalledWith({
      where: { id: mockPlanId },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
    });
    expect(result).toEqual(mockPlan);
  });

  it('should return null if no plan is found with the given ID', async () => {
    const mockPlanId = 999;
    plans.findOne.mockResolvedValue(null);

    const result = await fetchSinglePlan(mockPlanId);

    expect(plans.findOne).toHaveBeenCalledWith({
      where: { id: mockPlanId },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
    });
    expect(result).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    const mockPlanId = 1;
    const mockError = new Error('Database error');

    plans.findOne.mockRejectedValue(mockError);

    await expect(fetchSinglePlan(mockPlanId)).rejects.toThrow('Database error');

    expect(plans.findOne).toHaveBeenCalledWith({
      where: { id: mockPlanId },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
    });
  });
});
