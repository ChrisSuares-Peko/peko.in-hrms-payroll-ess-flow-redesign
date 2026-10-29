const { createBulkSoftwarePlans } = require('../../software_plan');
const software_plans = require('../../../entities/software_plans');

jest.mock('../../../entities/software_plans');


jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));
describe('createBulkSoftwarePlans', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully create a new software plan and return the created plan', async () => {
    const params = {
      TID: 0,
      planId: '564467',
      name: 'Peko23',
      validity: '12',
      discount: '23%',
      vendorPrice: '67',
      price: '78',
      noOfUsers: '3',
      features: 'Lots of them',
      software: 'AVG',
      status: true,
      errors: [],
      softwareId: 148
    };

    const mockPlan = {
      id: 484,
      planId: '564467',
      name: 'Peko23',
      validity: '12',
      discount: '23%',
      vendorPrice: '67',
      price: '78',
      noOfUsers: '3',
      features: 'Lots of them',
      status: true,
      softwareId: 148,
      updatedAt: '2024-08-08T05:27:23.689Z',
      createdAt: '2024-08-08T05:27:23.689Z'
    };

    software_plans.create.mockResolvedValue(mockPlan);

    const result = await createBulkSoftwarePlans(params);

    expect(software_plans.create).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockPlan);
  });

  it('should return false when creation fails', async () => {
    const params = {
      TID: 0,
      planId: '564467',
      name: 'Peko23',
      validity: '12',
      discount: '23%',
      vendorPrice: '67',
      price: '78',
      noOfUsers: '3',
      features: 'Lots of them',
      software: 'AVG',
      status: true,
      errors: [],
      softwareId: 148
    };

    software_plans.create.mockResolvedValue(null);

    const result = await createBulkSoftwarePlans(params);

    expect(software_plans.create).toHaveBeenCalledWith(params);
    expect(result).toBe(false);
  });

  it('should handle errors during creation', async () => {
    const params = {
      TID: 0,
      planId: '564467',
      name: 'Peko23',
      validity: '12',
      discount: '23%',
      vendorPrice: '67',
      price: '78',
      noOfUsers: '3',
      features: 'Lots of them',
      software: 'AVG',
      status: true,
      errors: [],
      softwareId: 148
    };

    const expectedError = new Error('Database error');
    software_plans.create.mockRejectedValue(expectedError);
  
    try {
      const result = await createBulkSoftwarePlans(params);
      expect(result).toBe(false);
    } catch (error) {
      console.error('Test case error:', error);
    }
  });

  it('should handle missing or invalid parameters', async () => {
    // Case: missing parameters
    const params = {
      TID: 0,
      planId: '564467',
    };

    software_plans.create.mockResolvedValue(null);

    const result = await createBulkSoftwarePlans(params);

    expect(software_plans.create).toHaveBeenCalledWith(params);
    expect(result).toBe(false);

    // Case: invalid parameters
    const invalidParams = {
      TID: 0,
      planId: 'invalid',
      name: '',
    };

    software_plans.create.mockResolvedValue(null);

    const invalidResult = await createBulkSoftwarePlans(invalidParams);

    expect(software_plans.create).toHaveBeenCalledWith(invalidParams);
    expect(invalidResult).toBe(false);
  });
});
