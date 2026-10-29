const governmentServicesApplication = require('../../../entities/governmentServicesApplication');
const { update } = require('../../governmentServicesApplication');

jest.mock('../../../entities/governmentServicesApplication', () => ({
  update: jest.fn(),
}));

describe('governmentServicesApplication update use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should scope the update to the credential when given', async () => {
    governmentServicesApplication.update.mockResolvedValue([1]);

    const result = await update(1, 7, { status: 'COMPLETED' });

    expect(governmentServicesApplication.update).toHaveBeenCalledWith(
      { status: 'COMPLETED' },
      { where: { id: 1, credentialId: 7 } }
    );
    expect(result).toEqual([1]);
  });

  it('should update by id only when no credential is given', async () => {
    governmentServicesApplication.update.mockResolvedValue([1]);

    await update(1, null, { amount: 100 });

    expect(governmentServicesApplication.update).toHaveBeenCalledWith({ amount: 100 }, { where: { id: 1 } });
  });

  it('should throw an error when database query fails', async () => {
    governmentServicesApplication.update.mockRejectedValue(new Error('DB error'));

    await expect(update(1, 7, {})).rejects.toThrow('DB error');
  });
});
