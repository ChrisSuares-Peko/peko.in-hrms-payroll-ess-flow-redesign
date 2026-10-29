const { softwareAndCountExport } = require('../../softwares');
const Softwares = require('../../../entities/softwares');
const Vendors = require('../../../entities/vendor');
const { handleSortFields } = require('../../../../utils/sortHandle');
const { Op } = require('sequelize');
const { formattedDateTime } = require('../../../../utils/formatter'); 

jest.mock('../../../entities/softwares', () => ({
  findAndCountAll: jest.fn(),
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
jest.mock('../../../../utils/sortHandle');
jest.mock('../../../../utils/formatter');

describe('software Count and Export Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find and return formatted software data with correct parameters', async () => {
    const params = {
      searchText: 'example',
      sort: 'DESC',
      sortField: 'name'
    };

    const order = [['name', 'DESC']];
    const mockData = {
      count: 1,
      rows: [
        {
          id: 3,
          productId: 'ACR',
          name: 'Example Software',
          description: 'Software Description',
          discount: '20% off',
          features: '* Feature 1\n* Feature 2',
          image: 'https://example.com/image.png',
          pekoEmail: ['example@example.com'],
          sendMail: 0,
          typeOfOrder: 'MANUAL',
          status: 1,
          sold_quantity: 65,
          sendVendorMail: 0,
          createdAt: new Date('2024-04-18T06:39:10.000Z'),
          updatedAt: new Date('2024-08-07T04:43:14.000Z'),
          vendorId: 13,
          categoryId: 18,
          vendor: {
            vendorName: 'Vendor 1',
            optional1: 'Optional Info 1'
          }
        }
      ]
    };

    const formattedDate = '04/18/2024 06:39:10'; 
    handleSortFields.mockReturnValue(order);
    Softwares.findAndCountAll.mockResolvedValue(mockData);
    formattedDateTime.  mockReturnValue(formattedDate);

    const expectedResult = [
      {
        Date: formattedDate,
        Name: 'Example Software',
        Image: 'https://example.com/image.png',
        Description: 'Software Description',
        "Type": 'MANUAL',
        Status: 'Active',
      }
    ];

    const result = await softwareAndCountExport(params);

    expect(Softwares.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: Vendors,
          attributes: ["vendorName", "optional1"]
        }
      ],
      where: {
        [Op.or]: [
          { id: { [Op.like]: `%${params.searchText}%` } },
          { productId: { [Op.like]: `%${params.searchText}%` } },
          { name: { [Op.like]: `%${params.searchText}%` } },
          { description: { [Op.like]: `%${params.searchText}%` } },
          { features: { [Op.like]: `%${params.searchText}%` } },
          { pekoEmail: { [Op.like]: `%${params.searchText}%` } },
          { typeOfOrder: { [Op.like]: `%${params.searchText}%` } }
        ]
      },
      order,
      raw: true,
      nest: true
    });
    

    expect(result).toEqual(expectedResult);
  });

  it('should handle errors and throw a custom error message', async () => {
    const params = {
      searchText: 'example',
      sort: 'DESC',
      sortField: 'name'
    };

    const error = new Error('Database error');
    Softwares.findAndCountAll.mockRejectedValue(error);

    await expect(softwareAndCountExport(params)).rejects.toEqual({ message: 'Something went wrong' });
  });
});
