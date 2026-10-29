const govtServicesCatalog = require('../../../entities/govtServicesCatalog');
const { findByVendorKey } = require('../../govtServicesCatalog');

jest.mock('../../../entities/govtServicesCatalog', () => ({
  findOne: jest.fn(),
}));

describe('govtServicesCatalog findByVendorKey use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find the catalog row by vendorCatalogId', async () => {
    const mockResult = { id: 1, vendorCatalogId: 'CAT1', serviceId: 12 };
    govtServicesCatalog.findOne.mockResolvedValue(mockResult);

    const result = await findByVendorKey('CAT1');

    expect(govtServicesCatalog.findOne).toHaveBeenCalledWith({ where: { vendorCatalogId: 'CAT1' } });
    expect(result).toEqual(mockResult);
  });

  it('should return null when not found', async () => {
    govtServicesCatalog.findOne.mockResolvedValue(null);

    expect(await findByVendorKey('MISSING')).toBeNull();
  });

  it('should throw an error when database query fails', async () => {
    govtServicesCatalog.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findByVendorKey('CAT1')).rejects.toThrow('DB error');
  });
});
