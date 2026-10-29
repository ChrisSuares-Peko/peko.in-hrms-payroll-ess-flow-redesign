const { findAllPlans } = require('../../../use-cases/softwares_subscriptions_plans');
const softwares_subscriptions_plans = require('../../../entities/softwares_subscriptions_plans');

jest.mock('../../../entities/softwares_subscriptions_plans'); // Mocking the Sequelize model
jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));
describe('findAllPlans function', () => {
  const mockParams = { status: 'active' };
  const mockPlanAttributes = ['id', 'name', 'monthlyPrice', 'yearlyPrice'];
  const mockPlans = [
    { id: 1, name: 'Basic Plan', monthlyPrice: 10, yearlyPrice: 100 },
    { id: 2, name: 'Pro Plan', monthlyPrice: 20, yearlyPrice: 200 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();  // Reset mocks before each test
    console.log = jest.fn();  // Mock console.log to track calls
  });

  it('should return all plans when called with valid params and attributes', async () => {
    // Mock the Sequelize findAll response
    softwares_subscriptions_plans.findAll.mockResolvedValue(mockPlans);

    const result = await findAllPlans(mockParams, mockPlanAttributes);

    expect(softwares_subscriptions_plans.findAll).toHaveBeenCalledWith({
      where: mockParams,
      attributes: mockPlanAttributes,
    });
    expect(result).toEqual(mockPlans);  // Ensure the result matches the mock data
    expect(console.log).toHaveBeenCalledWith('SOFTWARE SUBSCRIPTIONS PLANS FIND ALL ROUTE CALLED');  // Ensure the log in finally block is called
  });

  it('should handle errors and throw them', async () => {
    const mockError = new Error('Database error');
    softwares_subscriptions_plans.findAll.mockRejectedValue(mockError);  // Simulate error from Sequelize

    await expect(findAllPlans(mockParams, mockPlanAttributes)).rejects.toThrow(mockError);

    expect(softwares_subscriptions_plans.findAll).toHaveBeenCalledWith({
      where: mockParams,
      attributes: mockPlanAttributes,
    });
    expect(console.log).toHaveBeenCalledWith('SOFTWARE SUBSCRIPTIONS PLANS FIND ALL ROUTE CALLED');  // Ensure the log is called even after error
  });

  it('should return plans when no attributes are provided', async () => {
    // Mock the Sequelize findAll response without attributes
    softwares_subscriptions_plans.findAll.mockResolvedValue(mockPlans);

    const result = await findAllPlans(mockParams);

    expect(softwares_subscriptions_plans.findAll).toHaveBeenCalledWith({
      where: mockParams,
      attributes: undefined,  // No attributes provided
    });
    expect(result).toEqual(mockPlans);
    expect(console.log).toHaveBeenCalledWith('SOFTWARE SUBSCRIPTIONS PLANS FIND ALL ROUTE CALLED');
  });

  it('should log the message in finally block regardless of success or failure', async () => {
    softwares_subscriptions_plans.findAll.mockResolvedValue(mockPlans);  // Simulate success

    await findAllPlans(mockParams);
    expect(console.log).toHaveBeenCalledWith('SOFTWARE SUBSCRIPTIONS PLANS FIND ALL ROUTE CALLED');  // Check for success log

    const mockError = new Error('Error occurred');
    softwares_subscriptions_plans.findAll.mockRejectedValue(mockError);  // Simulate failure
    try {
      await findAllPlans(mockParams);
    } catch (e) {
      // Do nothing
    }
    expect(console.log).toHaveBeenCalledWith('SOFTWARE SUBSCRIPTIONS PLANS FIND ALL ROUTE CALLED');  // Check for error log
  });
});
