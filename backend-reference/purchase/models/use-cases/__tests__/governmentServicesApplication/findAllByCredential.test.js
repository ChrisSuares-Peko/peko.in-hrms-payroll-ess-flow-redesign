const { Op } = require('sequelize');
const governmentServicesApplication = require('../../../entities/governmentServicesApplication');
const { findAllByCredential } = require('../../governmentServicesApplication');

jest.mock('../../../entities/governmentServicesApplication', () => ({
  findAndCountAll: jest.fn(),
}));

describe('governmentServicesApplication findAllByCredential use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should exclude PENDING payments and apply default paging', async () => {
    const mockResult = { rows: [{ id: 1 }], count: 1 };
    governmentServicesApplication.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findAllByCredential(7);

    expect(governmentServicesApplication.findAndCountAll).toHaveBeenCalledWith({
      where: { credentialId: 7, paymentStatus: { [Op.ne]: 'PENDING' } },
      offset: 0,
      limit: 10,
      order: [['createdAt', 'DESC']],
    });
    expect(result).toEqual(mockResult);
  });

  it('should filter by status and apply the given paging', async () => {
    governmentServicesApplication.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await findAllByCredential(7, { offset: 20, limit: 5, status: 'COMPLETED' });

    expect(governmentServicesApplication.findAndCountAll).toHaveBeenCalledWith({
      where: { credentialId: 7, paymentStatus: { [Op.ne]: 'PENDING' }, status: 'COMPLETED' },
      offset: 20,
      limit: 5,
      order: [['createdAt', 'DESC']],
    });
  });

  it('should throw an error when database query fails', async () => {
    governmentServicesApplication.findAndCountAll.mockRejectedValue(new Error('DB error'));

    await expect(findAllByCredential(7)).rejects.toThrow('DB error');
  });
});
