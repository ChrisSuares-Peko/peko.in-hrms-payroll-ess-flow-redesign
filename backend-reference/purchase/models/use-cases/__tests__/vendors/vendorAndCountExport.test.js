const vendor = require('../../../entities/vendor');
const { vendorAndCountExport } = require('../../vendors');
const { Op } = require('sequelize');
const { handleSortFields } = require('../../../../utils/sortHandle');
const {formattedDateTime} = require('../../../../utils/formatter');

jest.mock('../../../entities/vendor', () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/sortHandle', () => ({
  handleSortFields: jest.fn(),
}));

jest.mock('../../../../utils/formatter', () => ({
  formattedDateTime: jest.fn(), 
}));

describe('vendorAndCountExport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should fetch and format vendor data correctly', async () => {
    const mockParams = {
      searchText: 'test',
      sort: 'asc',
      sortField: 'vendorName',
    };
    const mockType = 'Payment';

    const mockVendorData = {
      count: 2,
      rows: [
        {
          createdAt: new Date('2024-02-01T10:00:00Z'),
          vendorName: 'Vendor A',
          apiUrl: 'http://api.vendorA.com',
          healthUrl: 'http://health.vendorA.com',
          type: 'Payment',
          isActive: true,
        },
        {
          createdAt: new Date('2024-02-02T12:00:00Z'),
          vendorName: null,
          apiUrl: null,
          healthUrl: null,
          type: null,
          isActive: false,
        },
      ],
    };

    // Mock return values
    handleSortFields.mockReturnValue([['vendorName', 'ASC']]);
    formattedDateTime.mockImplementation((date) => date.toISOString());
    vendor.findAndCountAll.mockResolvedValue(mockVendorData);

    // Run function
    const result = await vendorAndCountExport(mockParams, mockType);

    // Assertions
    expect(handleSortFields).toHaveBeenCalledWith('vendorName', 'asc');
    expect(vendor.findAndCountAll).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          { id: { [Op.like]: '%test%' } },
          { vendorName: { [Op.like]: '%test%' } },
          { apiUrl: { [Op.like]: '%test%' } },
          { type: { [Op.like]: '%test%' } },
        ],
        type: mockType,
      },
      order: [['vendorName', 'ASC']],
    });

    expect(result).toEqual([
      {
        Date: '2024-02-01T10:00:00.000Z',
        'Vendor Name': 'Vendor A',
        'API URL': 'http://api.vendorA.com',
        'Health URL': 'http://health.vendorA.com',
        Type: 'Payment',
        Status: 'Active',
      },
      {
        Date: '2024-02-02T12:00:00.000Z',
        'Vendor Name': 'Not Available',
        'API URL': 'Not Available',
        'Health URL': 'Not Available',
        Type: 'Not Available',
        Status: 'In Active',
      },
    ]);
  });

  test('should handle an empty result set', async () => {
    vendor.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const result = await vendorAndCountExport({}, null);

    expect(result).toEqual([]);
    expect(vendor.findAndCountAll).toHaveBeenCalled();
  });

  test('should throw an error when findAndCountAll fails', async () => {
    const errorMessage = new Error('Database error');

    vendor.findAndCountAll.mockRejectedValue(errorMessage);

    await expect(vendorAndCountExport({}, null)).rejects.toEqual({ message: 'Something went wrong' });

    expect(vendor.findAndCountAll).toHaveBeenCalled();
  });
});
