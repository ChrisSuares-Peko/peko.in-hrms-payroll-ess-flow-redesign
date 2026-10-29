const { delete: deleteSubscriptionPlan } = require('../../../use-cases/softwares_subscriptions_plans');
const softwares_subscriptions_plans = require('../../../entities/softwares_subscriptions_plans');

jest.mock('../../../entities/softwares_subscriptions_plans');

describe('delete function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a record when a valid ID is provided', async () => {
    const mockId = 1;
    softwares_subscriptions_plans.destroy.mockResolvedValue(1); // Mock successful deletion (returns the number of deleted rows)

    const result = await deleteSubscriptionPlan({ id: mockId });

    expect(softwares_subscriptions_plans.destroy).toHaveBeenCalledWith({
      where: { id: mockId },
    });

    expect(result).toBe(1); // Expect it to return the number of deleted rows
  });

  it('should return 0 when no record is found for deletion', async () => {
    const mockId = 2;
    softwares_subscriptions_plans.destroy.mockResolvedValue(0); // Mock no record deleted

    const result = await deleteSubscriptionPlan({ id: mockId });

    expect(softwares_subscriptions_plans.destroy).toHaveBeenCalledWith({
      where: { id: mockId },
    });

    expect(result).toBe(0);
  });

  it('should handle errors and throw an exception', async () => {
    const mockId = 3;
    const mockError = new Error('Database error');
    softwares_subscriptions_plans.destroy.mockRejectedValue(mockError);

    await expect(deleteSubscriptionPlan({ id: mockId })).rejects.toThrow('Database error');

    expect(softwares_subscriptions_plans.destroy).toHaveBeenCalledWith({
      where: { id: mockId },
    });
  });
});
