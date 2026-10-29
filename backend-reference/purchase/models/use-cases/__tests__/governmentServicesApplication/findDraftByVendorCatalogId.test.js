const governmentServicesApplication = require('../../../entities/governmentServicesApplication');
const { findDraftByVendorCatalogId } = require('../../governmentServicesApplication');

jest.mock('../../../entities/governmentServicesApplication', () => ({
  findOne: jest.fn(),
}));

describe('governmentServicesApplication findDraftByVendorCatalogId use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find the DRAFT application for the credential and catalog item', async () => {
    const mockResult = { id: 1, status: 'DRAFT' };
    governmentServicesApplication.findOne.mockResolvedValue(mockResult);

    const result = await findDraftByVendorCatalogId(7, 'CAT1');

    expect(governmentServicesApplication.findOne).toHaveBeenCalledWith({
      where: { credentialId: 7, vendorCatalogId: 'CAT1', status: 'DRAFT' },
    });
    expect(result).toEqual(mockResult);
  });

  it('should return null when no draft exists', async () => {
    governmentServicesApplication.findOne.mockResolvedValue(null);

    expect(await findDraftByVendorCatalogId(7, 'CAT1')).toBeNull();
  });

  it('should throw an error when database query fails', async () => {
    governmentServicesApplication.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findDraftByVendorCatalogId(7, 'CAT1')).rejects.toThrow('DB error');
  });
});
