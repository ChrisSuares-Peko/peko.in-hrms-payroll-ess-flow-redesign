const { find } = require('../../vendors');
const vendor = require('../../../entities/vendor');

jest.mock('../../../entities/vendor', () => ({
  findOne: jest.fn(),
}));

describe('find vendor', () => {
  const mockVendorName = 'Test Vendor';
  const mockVendorData = { id: 1, vendorName: mockVendorName, type: 'retail' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should find a vendor successfully', async () => {
    vendor.findOne.mockResolvedValue(mockVendorData);

    const result = await find(mockVendorName);

    expect(vendor.findOne).toHaveBeenCalledWith({
      where: { vendorName: mockVendorName },
    });
    expect(result).toEqual(mockVendorData);
  });

  test('should return null when vendor is not found', async () => {
    vendor.findOne.mockResolvedValue(null);

    const result = await find(mockVendorName);

    expect(vendor.findOne).toHaveBeenCalledWith({
      where: { vendorName: mockVendorName },
    });
    expect(result).toBeNull();
  });

  test('should handle errors and throw an exception', async () => {
    const errorMessage = 'Database error';
    vendor.findOne.mockRejectedValue(new Error(errorMessage));

    await expect(find(mockVendorName)).rejects.toThrow(errorMessage);

    expect(vendor.findOne).toHaveBeenCalledWith({
      where: { vendorName: mockVendorName },
    });
  });
});
