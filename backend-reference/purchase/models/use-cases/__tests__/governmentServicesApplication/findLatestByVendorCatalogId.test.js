const governmentServicesApplication = require('../../../entities/governmentServicesApplication');
const { findLatestByVendorCatalogId } = require('../../governmentServicesApplication');

jest.mock('../../../entities/governmentServicesApplication', () => ({
  findOne: jest.fn(),
}));

describe('governmentServicesApplication findLatestByVendorCatalogId use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find the newest application regardless of status', async () => {
    const mockResult = { id: 2, status: 'SUBMITTED' };
    governmentServicesApplication.findOne.mockResolvedValue(mockResult);

    const result = await findLatestByVendorCatalogId(7, 'CAT1');

    expect(governmentServicesApplication.findOne).toHaveBeenCalledWith({
      where: { credentialId: 7, vendorCatalogId: 'CAT1' },
      order: [['createdAt', 'DESC']],
    });
    expect(result).toEqual(mockResult);
  });

  it('should throw an error when database query fails', async () => {
    governmentServicesApplication.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findLatestByVendorCatalogId(7, 'CAT1')).rejects.toThrow('DB error');
  });
});
