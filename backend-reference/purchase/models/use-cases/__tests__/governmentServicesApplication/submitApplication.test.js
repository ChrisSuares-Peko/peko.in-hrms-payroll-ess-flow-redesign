const governmentServicesApplication = require('../../../entities/governmentServicesApplication');
const { submitApplication } = require('../../governmentServicesApplication');

jest.mock('../../../entities/governmentServicesApplication', () => ({
  update: jest.fn(),
}));

describe('governmentServicesApplication submitApplication use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should move only a DRAFT application to SUBMITTED', async () => {
    governmentServicesApplication.update.mockResolvedValue([1]);

    const result = await submitApplication(1, 7);

    expect(governmentServicesApplication.update).toHaveBeenCalledWith(
      { status: 'SUBMITTED', submittedAt: expect.any(Date) },
      { where: { id: 1, credentialId: 7, status: 'DRAFT' } }
    );
    expect(result).toEqual([1]);
  });

  it('should throw an error when database query fails', async () => {
    governmentServicesApplication.update.mockRejectedValue(new Error('DB error'));

    await expect(submitApplication(1, 7)).rejects.toThrow('DB error');
  });
});
