const { findAllPlansAndCount } = require('../../../use-cases/software_plan');
const software_plans = require('../../../entities/software_plans');
const softwares = require('../../../entities/softwares');
const { Op } = require('sequelize');
const { handleSortFields } = require('../../../../utils/sortHandle');

jest.mock('../../../entities/software_plans', () => ({
  findAndCountAll:jest.fn()
}));
jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../../utils/sortHandle')

describe('findAllPlansAndCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should return software plans with valid parameters', async () => {
    const params = {
      limit: 10,
      offset: 0,
      searchText: 'Acronis',
      sort: 'ASC',
      sortField: 'price'
    };
    const order = [['price', 'ASC']]; 
    const mockResult = {
      count: 110,
      rows: [
        {
          id: 364,
          planId: 'ACR1',
          name: 'Acronis Cyber Protect Home Office Essentials ',
          vendorPrice: '68.1152',
          price: '95.0000',
          validity: '1 Year',
          discount: null,
          noOfUsers: 1,
          features: '1 Year',
          status: 1,
          createdAt: '2024-07-03T07:44:51.000Z',
          updatedAt: '2024-07-03T07:44:51.000Z',
          softwareId: 3,
          software: {}
        },
        // Add more mock data if needed
      ]
    };
    handleSortFields.mockReturnValue(order);
    software_plans.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findAllPlansAndCount(params);

    expect(software_plans.findAndCountAll).toHaveBeenCalledWith({
      include: [{
        model: softwares,
        attributes: ["name"],
      }],
      where: {
        [Op.or]: [
          { id: { [Op.like]: `%${params.searchText}%` } },
          { name: { [Op.like]: `%${params.searchText}%` } },
          { price: { [Op.like]: `%${params.searchText}%` } },
          { validity: { [Op.like]: `%${params.searchText}%` } },
          { noOfUsers: { [Op.like]: `%${params.searchText}%` } },
          { features: { [Op.like]: `%${params.searchText}%` } },
          { vendorPrice: { [Op.like]: `%${params.searchText}%` } },
        ],
      },
      order,
      limit: params.limit,
      offset: params.offset,
      raw: true,
      nest: true,
    });
    expect(result).toEqual(mockResult);
  });

  it('should handle empty search text', async () => {
    const params = {
      limit: 10,
      offset: 0,
      searchText: '',
      sort: 'ASC',
      sortField: 'id'
    };
    const order = [['name', 'DESC']]; 
    const mockResult = {
      count: 110,
      rows: [
        {
          id: 441,
          planId: 'Ana4',
          name: 'Analytics Enterprise',
          vendorPrice: '17938.0000',
          price: '19932.0000',
          validity: '1',
          discount: null,
          noOfUsers: 50,
          features: '50 users 50M Rows',
          status: 1,
          createdAt: '2024-07-08T08:13:07.000Z',
          updatedAt: '2024-07-08T08:16:04.000Z',
          softwareId: 94,
          software: {}
        },
      ]
    };
    handleSortFields.mockReturnValue(order);
    software_plans.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findAllPlansAndCount(params);

    expect(software_plans.findAndCountAll).toHaveBeenCalledWith({
      include: [{
        model: softwares,
        attributes: ["name"],
      }],
      where: {
        [Op.or]: [
          { id: { [Op.like]: '%%' } },
          { name: { [Op.like]: '%%' } },
          { price: { [Op.like]: '%%' } },
          { validity: { [Op.like]: '%%' } },
          { noOfUsers: { [Op.like]: '%%' } },
          { features: { [Op.like]: '%%' } },
          { vendorPrice: { [Op.like]: '%%' } },
        ],
      },
      order,
      limit: params.limit,
      offset: params.offset,
      raw: true,
      nest: true,
    });
    expect(result).toEqual(mockResult);
  });

 

});
