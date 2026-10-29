const { findByPlanId } = require('../../../use-cases/software_plan');
const software_plans  = require('../../../entities/software_plans');

jest.mock('../../../entities/software_plans');
jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));
describe('find software plan by Id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should return a software plan with a valid planId', async () => {
    const planId = '56656r4';

    const mockResult = {
      id: 480,
      planId: '56656r4',
      name: 'Peko',
      vendorPrice: '23.0000',
      price: '34.0000',
      validity: '11',
      discount: null,
      noOfUsers: 1,
      features: 'Lots of features',
      status: true,
      createdAt: '2024-08-07T11:12:10.000Z',
      updatedAt: '2024-08-07T11:12:10.000Z',
      softwareId: 7
    };

    software_plans.findOne.mockResolvedValue(mockResult);

    const result = await findByPlanId(planId);

    expect(software_plans.findOne).toHaveBeenCalledWith({
      where: { planId: planId }
    });
    expect(result).toEqual(mockResult);
  });

  it('should return null if no software plan is found', async () => {
    const planId = '56656r4';

    software_plans.findOne.mockResolvedValue(null);

    const result = await findByPlanId(planId);

    expect(software_plans.findOne).toHaveBeenCalledWith({
      where: { planId: planId }
    });
    expect(result).toBeNull();
  });

  it('should handle errors thrown by findOne', async () => {
    const planId = '56656r4';
    const expectedError = new Error('Error occurred while finding software plans.');
  
    software_plans.findOne.mockRejectedValue(expectedError);
  
    // Test that the findByPlanId function rejects with the expected error
    await expect(findByPlanId(planId)).rejects.toThrow(expectedError);
  
    // Ensure the findOne method was called with the correct parameters
    expect(software_plans.findOne).toHaveBeenCalledWith({
      where: { planId: planId }
    });
  });
  



});
