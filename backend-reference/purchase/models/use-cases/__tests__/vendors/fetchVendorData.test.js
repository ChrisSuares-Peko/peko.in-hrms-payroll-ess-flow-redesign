const vendor = require('../../../entities/vendor');
const { fetchVendorData } = require('../../vendors');

jest.mock('../../../entities/vendor', () => ({
  findAll: jest.fn(),
}));

describe('fetchVendorData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should fetch vendors with the correct type filter', async () => {
    const mockType = 'retail';
    const mockVendorData = [
      { id: 1, vendorName: 'Vendor A' },
      { id: 2, vendorName: 'Vendor B' },
    ];

    vendor.findAll.mockResolvedValue(mockVendorData);

    const result = await fetchVendorData(mockType);

    expect(vendor.findAll).toHaveBeenCalledWith({
      where: { type: mockType },
      attributes: ['id', 'vendorName'],
    });

    expect(result).toEqual(mockVendorData);
  });

  test('should log the provided type', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const mockType = 'wholesale';

    vendor.findAll.mockResolvedValue([]);

    await fetchVendorData(mockType);

    expect(consoleSpy).toHaveBeenCalledWith(mockType);

    consoleSpy.mockRestore();
  });

  test('should handle errors when findAll fails', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const errorMessage = new Error('Database error');
    const mockType = 'retail';

    vendor.findAll.mockRejectedValue(errorMessage);

    await expect(fetchVendorData(mockType)).rejects.toThrow(errorMessage);

    consoleSpy.mockRestore();
  });
});
