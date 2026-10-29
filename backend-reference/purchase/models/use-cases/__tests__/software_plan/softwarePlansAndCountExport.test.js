const { softwarePlansAndCountExport } = require('../../../use-cases/software_plan');
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
jest.mock('')

describe('softwarePlansAndCountExport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should return formatted software plans data with valid parameters', async () => {
    const params = {
      searchText: 'Acronis',
      sort: 'ASC',
      sortField: 'price'
    };
    const order = [['price', 'ASC']]; 
    const mockData = {
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
          software: { name: 'Acronis Software' }
        },
      ]
    };
    handleSortFields.mockReturnValue(order);
    software_plans.findAndCountAll.mockResolvedValue(mockData);

    const expectedResult = [
      {
        Date: '2024-07-03T07:44:51.000Z',
        "Plan Name": 'Acronis Cyber Protect Home Office Essentials ',
        "Software name": 'Acronis Software',
        "Vendor Price": "₹ 68.12",
        "Customer Price": "₹ 95.00",
        Validity: '1 Year',
        "No of users": 1,
        Status: 'Active'
      },
     
    ];

    const result = await softwarePlansAndCountExport(params);

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
      raw: true,
      nest: true,
    });
    expect(result).toEqual(expectedResult);
  });


  it('should handle empty search text', async () => {
    const params = {
      searchText: '',
      sort: 'ASC',
      sortField: 'id'
    };
    const order = [['name', 'DESC']]; 
    const mockData = {
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
          software: { name: 'Enterprise Software' }
        },
        // Add more mock data if needed
      ]
    };

    handleSortFields.mockReturnValue(order);
    software_plans.findAndCountAll.mockResolvedValue(mockData);

    const expectedResult = [
      {
        Date: '2024-07-08T08:13:07.000Z',
        "Plan Name": 'Analytics Enterprise',
        "Software name": 'Enterprise Software',
        "Vendor Price": "₹ 17,938.00",
        "Customer Price": "₹ 19,932.00",
        Validity: '1',
        "No of users": 50,
        Status: 'Active'
      },
      // Add more expected data if needed
    ];

    const result = await softwarePlansAndCountExport(params);

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
      raw: true,
      nest: true,
    });
    expect(result).toEqual(expectedResult);
  });

  it('should handle errors thrown by findAndCountAll', async () => {
    const params = {
      searchText: 'ErrorTest',
      sort: 'DESC',
      sortField: 'name'
    };

    const expectedError = new Error('Database error');

    software_plans.findAndCountAll.mockRejectedValue(expectedError);

    await expect(softwarePlansAndCountExport(params)).rejects.toEqual({ message: 'Something went wrong' });
  });

});
