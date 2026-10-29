const { find } = require('../../software_plan');
const software_plans = require('../../../entities/software_plans');

jest.mock('../../../entities/software_plans');

describe('find Software Plan by name', () => {
  it('should return the software plan when found', async () => {
    const mockName = "Peko";
    const mockSoftwarePlan = {
      id: 479,
      name: "Peko",
      price: "20",
      softwareId: 7,
      planId: "56656r4",
      validity: "6",
      vendorPrice: "12",
      features: "Lots of them",
      noOfUsers: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    software_plans.findOne.mockResolvedValue(mockSoftwarePlan);

    const result = await find(mockName);

    expect(software_plans.findOne).toHaveBeenCalledWith({ where: { name: mockName } });
    expect(result).toEqual(mockSoftwarePlan);
  });

  it('should return null if no software plan is found', async () => {
    const mockName = "NonExistentPlan";

    software_plans.findOne.mockResolvedValue(null);

    const result = await find(mockName);

    expect(software_plans.findOne).toHaveBeenCalledWith({ where: { name: mockName } });
    expect(result).toBeNull();
  });

  it('should handle errors during lookup', async () => {
    const mockName = "Peko";
    const expectedError = new Error('Database error');

    software_plans.findOne.mockRejectedValue(expectedError);

    await expect(find(mockName)).rejects.toThrow('Database error');
    expect(software_plans.findOne).toHaveBeenCalledWith({ where: { name: mockName } });
  });
});
