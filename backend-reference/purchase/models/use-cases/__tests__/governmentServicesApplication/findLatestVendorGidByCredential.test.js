const { Op } = require('sequelize');
const governmentServicesApplication = require('../../../entities/governmentServicesApplication');
const { findLatestVendorGidByCredential } = require('../../governmentServicesApplication');

jest.mock('../../../entities/governmentServicesApplication', () => ({
  findOne: jest.fn(),
}));

describe('governmentServicesApplication findLatestVendorGidByCredential use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find the newest row with a non-null vendorGid', async () => {
    const mockResult = { id: 3, vendorGid: 'G1' };
    governmentServicesApplication.findOne.mockResolvedValue(mockResult);

    const result = await findLatestVendorGidByCredential(7);

    expect(governmentServicesApplication.findOne).toHaveBeenCalledWith({
      where: { credentialId: 7, vendorGid: { [Op.ne]: null } },
      order: [['createdAt', 'DESC']],
    });
    expect(result).toEqual(mockResult);
  });

  it('should throw an error when database query fails', async () => {
    governmentServicesApplication.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findLatestVendorGidByCredential(7)).rejects.toThrow('DB error');
  });
});
