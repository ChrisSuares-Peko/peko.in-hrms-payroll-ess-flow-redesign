const { findAllPlans } = require('../../software_plan');
const software_plans = require('../../../entities/software_plans');
const softwares = require('../../../entities/softwares');

jest.mock('../../../entities/software_plans', () => ({
  belongsTo: jest.fn(),
  findAll:jest.fn()
}));
jest.mock('../../../entities/softwares', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));

describe('findAllPlans corporate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should return plans with specified attributes and include software details', async () => {
    const product = 149;
    const planAttribute = [
      'id',
      'name',
      'price',
      'features',
      'validity',
      'noOfUsers',
    ];
    const productAttribute = ['id', 'name'];
    
    const mockPlans = [
      {
        id: 481,
        name: 'Acronis True Image 2017 Perpetual 1 Device',
        price: '91.0000',
        features: 'how are you today',
        validity: '3 Year',
        noOfUsers: 1,
        software: {
          id: 149,
          name: 'Acronics',
        },
      },
      {
        id: 482,
        name: 'Acronis Cyber Protect Home Office Essentials 1 Device 1 Year',
        price: '109.0000',
        features: 'abc',
        validity: '1 Year',
        noOfUsers: 1,
        software: {
          id: 149,
          name: 'Acronics',
        },
      },
      {
        id: 483,
        name: 'Acronis True Image 2021 Perpetual 1 Device',
        price: '349.0000',
        features: 'abc',
        validity: '3 Year',
        noOfUsers: 1,
        software: {
          id: 149,
          name: 'Acronics',
        },
      },
    ];
    
    software_plans.findAll.mockResolvedValue(mockPlans);

    const result = await findAllPlans(product, planAttribute, productAttribute);

    expect(software_plans.findAll).toHaveBeenCalledWith({
      include: {
        model: softwares,
        where: { id: product },
        attributes: productAttribute,
      },
      where: { status: true },
      attributes: planAttribute,
    });

    expect(result).toEqual(mockPlans);
  });

  it('should handle cases where no plans are found', async () => {
    const product = 149;
    const planAttribute = [
      'id',
      'name',
      'price',
      'features',
      'validity',
      'noOfUsers',
    ];
    const productAttribute = ['id', 'name'];
    
    software_plans.findAll.mockResolvedValue([]);

    const result = await findAllPlans(product, planAttribute, productAttribute);

    expect(software_plans.findAll).toHaveBeenCalledWith({
      include: {
        model: softwares,
        where: { id: product },
        attributes: productAttribute,
      },
      where: { status: true },
      attributes: planAttribute,
    });

    expect(result).toEqual([]);
  });

 
});
