const { find } = require('../../software_plan');
const software_plans  = require('../../../entities/software_plans');

jest.mock('../../../entities/software_plans');
jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));
describe('find by plan name', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should return a software plan with a valid name', async () => {
    const name = 'Acronis Cyber Protect';
    
    const mockPlan = {
      id: 364,
      planId: 'ACR1',
      name: 'Acronis Cyber Protect',
      vendorPrice: '68.1152',
      price: '95.0000',
      validity: '1 Year',
      noOfUsers: 1,
      features: '1 Year',
      status: true,
      createdAt: '2024-07-03T07:44:51.000Z',
      updatedAt: '2024-07-03T07:44:51.000Z',
      softwareId: 3
    };

    software_plans.findOne.mockResolvedValue(mockPlan);

    const result = await find(name);

    expect(software_plans.findOne).toHaveBeenCalledWith({
      where: {
        name: name
      }
    });
    expect(result).toEqual(mockPlan);
  });

  it('should return null if no software plan is found', async () => {
    const name = 'NonExistingPlan';

    software_plans.findOne.mockResolvedValue(null);

    const result = await find(name);

    expect(software_plans.findOne).toHaveBeenCalledWith({
      where: {
        name: name
      }
    });
    expect(result).toBeNull();
  });

  it('should handle errors thrown by findOne', async () => {
    const name = 'ErrorTest';

    const expectedError = new Error('Database error');

    software_plans.findOne.mockRejectedValue(expectedError);

    await expect(find(name)).rejects.toThrow('Database error');
  });

});
