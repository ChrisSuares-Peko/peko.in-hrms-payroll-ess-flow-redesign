const { create } = require('../../../use-cases/software_plan');
const software_plans  = require('../../../entities/software_plans');

jest.mock('../../../entities/software_plans');

jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));
describe('create Software plan', () => {

  it('should create a software plan with valid parameters', async () => {
    const params = {
      features: "Lots of them",
      name: "Peko",
      noOfUsers: 1,
      planId: "56656r4",
      price: "20",
      softwareId: 7,
      validity: "6",
      vendorPrice: "12"
    };

    const mockResult = {
      status: true,
      id: 479,
      softwareId: 7,
      planId: "56656r4",
      name: "Peko",
      vendorPrice: "12",
      price: "20",
      validity: "6",
      noOfUsers: 1,
      features: "Lots of them",
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    software_plans.create.mockResolvedValue(mockResult);

    const result = await create(params);

    expect(software_plans.create).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockResult);
  });

  it('should handle cases where creation fails', async () => {
    const params = {
      features: "Lots of them",
      name: "Peko",
      noOfUsers: 1,
      planId: "56656r4",
      price: "20",
      softwareId: 7,
      validity: "6",
      vendorPrice: "12"
    };

    software_plans.create.mockResolvedValue(null); // Simulate failure

    const result = await create(params);

    expect(software_plans.create).toHaveBeenCalledWith(params);
    expect(result).toBe(false);
  });

  it('should handle errors during creation', async () => {
    const params = {
      features: "Lots of them",
      name: "Peko",
      noOfUsers: 1,
      planId: "56656r4",
      price: "20",
      softwareId: 7,
      validity: "6",
      vendorPrice: "12"
    };

    const expectedError = new Error('Database error');
    software_plans.create.mockRejectedValue(expectedError);

    const result = await create(params);

    expect(software_plans.create).toHaveBeenCalledWith(params);
    expect(result).toBe(false);
  });

  it('should handle creation of a duplicate record', async () => {
    const params = {
      features: "Lots of them",
      name: "Peko",
      noOfUsers: 1,
      planId: "56656r4",
      price: "20",
      softwareId: 7,
      validity: "6",
      vendorPrice: "12"
    };
  
    const expectedError = new Error('Duplicate record error');
    software_plans.create.mockRejectedValue(expectedError);
  
    const result = await create(params);
  
    expect(software_plans.create).toHaveBeenCalledWith(params);
    expect(result).toBe(false);
  });
  
  
});
