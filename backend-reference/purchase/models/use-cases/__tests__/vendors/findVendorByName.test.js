const { findVendorByName } = require('../../vendors'); 
const vendor = require('../../../entities/vendor');

jest.mock('../../../entities/vendor');
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
jest.mock('../../../entities/softwares', () => ({
  belongsTo: jest.fn(),
}));
describe('findVendorByName Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find and return a vendor by name', async () => {
    const vendorName = 'Example Vendor';
    const expectedResult = {
      id: 1,
      vendorName: 'Example Vendor',
    isActive:1,
    apiUrl:'www.google.com',
    healthUrl:'https://www.google.com',
    optional1:'vendormail.com',
    isBillPaymentAvailable:null,
    isTopUpAvailable:null,
    currency:'AED',
    createdAt:'2022-11-22 14:01:19',
    updatedAt:'2023-03-31 10:08:08',
    type:'documnet',
    vendorEmail:'["test@yopmail.com"]',
    optional3:'',
    optional4:'',
    optional5:'',
    optional6:'',
    };

    vendor.findOne.mockResolvedValue(expectedResult);

    const result = await findVendorByName(vendorName);

    expect(vendor.findOne).toHaveBeenCalledWith({
      where: {
        vendorName: vendorName
      },
      raw: true,
    });
    expect(result).toEqual(expectedResult);
  });

  it('should return null if the vendor is not found', async () => {
    const vendorName = 'Nonexistent Vendor';

    vendor.findOne.mockResolvedValue(null); // Vendor not found

    const result = await findVendorByName(vendorName);

    expect(vendor.findOne).toHaveBeenCalledWith({
      where: {
        vendorName: vendorName
      },
      raw: true,
    });
    expect(result).toBeNull(); 
  });

  it('should handle errors and return false', async () => {
    const vendorName = 'Error Vendor';

    vendor.findOne.mockRejectedValue(new Error('Database error'));

    const result = await findVendorByName(vendorName);

    expect(vendor.findOne).toHaveBeenCalledWith({
      where: {
        vendorName: vendorName
      },
      raw: true,
    });
    expect(result).toBe(false);
  });
});
