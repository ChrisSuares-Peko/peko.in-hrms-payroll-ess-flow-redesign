const vendor = require('../../../entities/vendor');
const { findAllVendor } = require('../../vendors');

jest.mock('../../../entities/vendor', () => ({
  findAll: jest.fn(),
}));

describe('findAllVendor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should fetch active vendors with correct attributes', async () => {
    const mockVendorData = [
      { vendorName: 'Vendor A', type: 'retail' },
      { vendorName: 'Vendor B', type: 'wholesale' },
    ];

    vendor.findAll.mockResolvedValue(mockVendorData);

    const result = await findAllVendor();

    expect(vendor.findAll).toHaveBeenCalledWith({
      where: { isActive: true },
      attributes: ['vendorName', 'type'],
    });

    expect(result).toEqual(mockVendorData);
  });

  test('should handle errors when findAll fails', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const errorMessage = new Error('Database error');

    vendor.findAll.mockRejectedValue(errorMessage);

    const result = await findAllVendor();

    expect(consoleSpy).toHaveBeenCalledWith(errorMessage);
    expect(consoleSpy).toHaveBeenCalledWith('VENDOR FIND ALL ROUTE CALLED');
    expect(result).toBeUndefined();

    consoleSpy.mockRestore();
  });

  test('should log message in the finally block', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    vendor.findAll.mockResolvedValue([]);

    await findAllVendor();

    expect(consoleSpy).toHaveBeenCalledWith('VENDOR FIND ALL ROUTE CALLED');

    consoleSpy.mockRestore();
  });
});
