const { getExcelCSVData } = require('../../serviceOperator'); 
const serviceOperator = require('../../../entities/serviceOperator');
const vendors = require('../../../entities/vendor');

jest.mock('../../../entities/serviceOperator', () => ({
  findAll: jest.fn(),
}));

jest.mock('../../../entities/vendor', () => ({}));

describe('getExcelCSVData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return mapped Excel CSV data', async () => {
    const mockData = [
      {
        id: 1,
        serviceProvider: 'Service A',
        accessKey: 'ABC123',
        serviceStatus: true,
        providerCommission: 10,
        serviceImage: 'image.png',
        serviceCategory: 'Category1',
        vendor: { vendorName: 'Vendor X' },
        countryName: 'Country A',
        countryCode: 'CA',
        balanceMethod: true,
        commissionType: 'Fixed',
        serviceType: '1',
      },
      {
        id: 2,
        serviceProvider: null,
        accessKey: null,
        serviceStatus: null,
        providerCommission: null,
        serviceImage: null,
        serviceCategory: null,
        vendor: { vendorName: null },
        countryName: null,
        countryCode: null,
        balanceMethod: null,
        commissionType: null,
        serviceType: '5',
      },
    ];

    serviceOperator.findAll.mockResolvedValue(mockData);

    const result = await getExcelCSVData();

    expect(serviceOperator.findAll).toHaveBeenCalledWith({
      include: [{
        model: vendors,
        as: "",
        attributes: ['vendorName'],
      }],
      attributes: [
        'id', 'serviceProvider', 'accessKey', 'serviceStatus', 'providerCommission', 'serviceImage',
        'serviceCategory', 'remarks', 'countryName', 'countryCode', 'balanceMethod', 'commissionType', 'serviceType',
      ],
      order: [['createdAt', 'DESC']],
      raw: true,
      nest: true,
    });

    expect(result).toEqual([
      {
        'ID': 1,
        'Service Provider Name': 'Service A',
        'Access Key': 'ABC123',
        'Status': 'Active',
        'Provider Commission': 10,
        'Service Image': 'image.png',
        'Service Category': 'Category1',
        'Vendor Name': 'Vendor X',
        'Country Name': 'Country A',
        'Country Code': 'CA',
        'Balance Method': 'Yes',
        'Commission Type': 'Fixed',
        'Service Type': 'Bill Payment',
      },
      {
        'ID': 2,
        'Service Provider Name': 'Not Available',
        'Access Key': 'Not Available',
        'Status': 'Not AVailable',
        'Provider Commission': 'Not AVailable',
        'Service Image': 'Not Available',
        'Service Category': 'Not Available',
        'Vendor Name': 'Not Available',
        'Country Name': 'Not Available',
        'Country Code': 'Not Available',
        'Balance Method': 'Not AVailable',
        'Commission Type': 'Not Available',
        'Service Type': 'Not Available',
      },
    ]);
  });

  it('should throw an error if findAll rejects', async () => {
    const error = new Error('DB Error');
    serviceOperator.findAll.mockRejectedValue(error);

    await expect(getExcelCSVData()).rejects.toThrow(error);
  });
});
