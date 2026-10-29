const { findOnePlan } = require('../../software_plan');
const software_plans = require('../../../entities/software_plans');
const softwares = require('../../../entities/softwares');
const vendors = require('../../../entities/vendor');

jest.mock('../../../entities/software_plans', () => ({
  findOne: jest.fn(),
}));
jest.mock('../../../entities/softwares', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../entities/vendor', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../entities/categories', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../entities/serviceOperator', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../entities/order', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../entities/transaction', () => ({
  belongsTo: jest.fn(),
}));

describe('find a single plan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return plan with specified attributes and included software and vendor details', async () => {
    const params = { id: 1 };
    const planAttributes = ["id", "name", "price", "validity", "features"];
    const productAttributes = ["typeOfOrder"];
    
    const mockResult = {
      id: 1,
      name: 'Test Plan',
      price: '100.00',
      validity: '1 Year',
      features: 'Some features',
      software: {
        id: 2,
        typeOfOrder: 'Subscription',
        vendors: {
          vendorEmail: 'vendor@example.com',
          vendorName: 'Test Vendor',
          optional1: 'optional_value_1',
          apiUrl: 'https://api.example.com',
          optional2: 'optional_value_2',
        },
      },
    };

    // Mock the `findOne` function to return the mock result
    software_plans.findOne.mockResolvedValue(mockResult);

    const result = await findOnePlan(params, planAttributes, productAttributes);

    expect(software_plans.findOne).toHaveBeenCalledWith({
      where: { id: params.id },
      attributes: planAttributes,
      include: [
        {
          model: softwares,
          attributes: productAttributes,
          include: [
            {
              model: vendors,
              attributes: ['vendorEmail', 'vendorName', 'optional1', 'apiUrl', 'optional2'],
            },
          ],
        },
      ],
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockResult);
  });


   it('should handle cases where no plan is found', async () => {
    const params = { id: 1 };

    software_plans.findOne.mockResolvedValue(null);

    const result = await findOnePlan(params);

    expect(software_plans.findOne).toHaveBeenCalledWith({
      where: { id: params.id },
      attributes: undefined,
      include: [
        {
          model: softwares,
          attributes: undefined,
          include: [
            {
              model: vendors,
              attributes: ['vendorEmail', 'vendorName', 'optional1', 'apiUrl', 'optional2'],
            },
          ],
        },
      ],
      raw: true,
      nest: true,
    });

    expect(result).toBeNull();
  });

  it('should handle cases where no plan found', async () => {
    const params = { id: 1 };

    software_plans.findOne.mockResolvedValue(null);

    const result = await findOnePlan(params);

    expect(software_plans.findOne).toHaveBeenCalledWith({
      where: { id: params.id },
      attributes: undefined,
      include: [
        {
          model: softwares,
          attributes: undefined,
          include: [
            {
              model: vendors,
              attributes: ['vendorEmail', 'vendorName', 'optional1', 'apiUrl', 'optional2'],
            },
          ],
        },
      ],
      raw: true,
      nest: true,
    });

    expect(result).toBeNull();
  });


  it('should handle errors during query', async () => {
    const params = { id: 1 };
    const expectedError = new Error('Database error');

    software_plans.findOne.mockRejectedValue(expectedError);

    let caughtError;
    try {
      await findOnePlan(params);
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toEqual(expectedError);

    expect(software_plans.findOne).toHaveBeenCalledWith({
      where: { id: params.id },
      attributes: undefined,
      include: [
        {
          model: softwares,
          attributes: undefined,
          include: [
            {
              model: vendors,
              attributes: ['vendorEmail', 'vendorName', 'optional1', 'apiUrl', 'optional2'],
            },
          ],
        },
      ],
      raw: true,
      nest: true,
    });
  });
});
