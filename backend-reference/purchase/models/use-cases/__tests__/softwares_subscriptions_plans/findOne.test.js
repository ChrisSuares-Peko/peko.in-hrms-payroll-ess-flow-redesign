const { findOne } = require('../../../use-cases/softwares_subscriptions_plans');
const softwares_subscriptions_plans = require('../../../entities/softwares_subscriptions_plans');
const softwares_subscriptions = require('../../../entities/softwares_subscriptions');
const vendors = require('../../../entities/vendor');

jest.mock('../../../entities/softwares_subscriptions_plans'); 
jest.mock('../../../entities/softwares_subscriptions'); 
jest.mock('../../../entities/vendor'); 
jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));
describe('findOne function', () => {
  const mockParams = { id: 1 };
  const mockAttributes = ['id', 'name', 'monthlyPrice', 'yearlyPrice'];
  const mockProductAttributes = ['name', 'type'];
  const mockData = {
    id: 1,
    name: 'Basic Plan',
    monthlyPrice: 10,
    yearlyPrice: 100,
    softwares_subscriptions: {
      name: 'Software A',
      type: 'SaaS',
      vendor: {
        vendorEmail: 'vendor@example.com',
        vendorName: 'Vendor Inc',
        optional1: 'Optional Data 1',
        apiUrl: 'https://api.vendor.com',
        optional2: 'Optional Data 2',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();  
  });

  it('should return a software subscription plan with associated subscriptions and vendor details', async () => {
    
    softwares_subscriptions_plans.findOne.mockResolvedValue(mockData);

    const result = await findOne(mockParams, null, mockAttributes, mockProductAttributes);

    expect(softwares_subscriptions_plans.findOne).toHaveBeenCalledWith({
      include: [
        {
          model: softwares_subscriptions,
          attributes: mockProductAttributes,
          include: [
            {
              model: vendors,
              attributes: ['vendorEmail', 'vendorName', 'optional1', 'apiUrl', 'optional2'],
            },
          ],
        },
      ],
      where: mockParams,
      attributes: mockAttributes,
    });
    expect(result).toEqual(mockData); 
  });

  it('should return null when no plan is found', async () => {
    softwares_subscriptions_plans.findOne.mockResolvedValue(null); 

    const result = await findOne(mockParams, null, mockAttributes, mockProductAttributes);

    expect(softwares_subscriptions_plans.findOne).toHaveBeenCalledWith({
      include: [
        {
          model: softwares_subscriptions,
          attributes: mockProductAttributes,
          include: [
            {
              model: vendors,
              attributes: ['vendorEmail', 'vendorName', 'optional1', 'apiUrl', 'optional2'],
            },
          ],
        },
      ],
      where: mockParams,
      attributes: mockAttributes,
    });
    expect(result).toBeNull(); 
  });

  it('should handle errors and throw them', async () => {
    const mockError = new Error('Database error');
    softwares_subscriptions_plans.findOne.mockRejectedValue(mockError);  

    await expect(findOne(mockParams, null, mockAttributes, mockProductAttributes)).rejects.toThrow(mockError);

    expect(softwares_subscriptions_plans.findOne).toHaveBeenCalledWith({
      include: [
        {
          model: softwares_subscriptions,
          attributes: mockProductAttributes,
          include: [
            {
              model: vendors,
              attributes: ['vendorEmail', 'vendorName', 'optional1', 'apiUrl', 'optional2'],
            },
          ],
        },
      ],
      where: mockParams,
      attributes: mockAttributes,
    });
  });
});
