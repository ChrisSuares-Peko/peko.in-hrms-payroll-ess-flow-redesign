const govtServiceApplication = require('../../../entities/govtServiceApplication');
const { findDraftByService } = require('../../govtServiceApplications');

jest.mock('../../../../middlewares/async', () => fn => fn);

jest.mock('../../../entities/govtServiceApplication', () => ({
  findOne: jest.fn(),
  belongsTo: jest.fn(),
}));

jest.mock('../../../entities/credential', () => ({}));

describe('govtServiceApplications findDraftByService use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the draft application for a given credential and service', async () => {
    const credentialId = 10;
    const service = 'gst-registration';
    const mockResult = { id: 1, credentialId, service, status: 'DRAFT' };

    govtServiceApplication.findOne.mockResolvedValue(mockResult);

    const result = await findDraftByService(credentialId, service);

    expect(govtServiceApplication.findOne).toHaveBeenCalledWith({
      where: { credentialId, service, status: 'DRAFT' },
    });
    expect(result).toEqual(mockResult);
  });

  it('should return null when no draft exists for the service', async () => {
    govtServiceApplication.findOne.mockResolvedValue(null);

    const result = await findDraftByService(10, 'nonexistent-service');

    expect(result).toBeNull();
  });

  it('should throw an error when database query fails', async () => {
    const error = new Error('DB error');
    govtServiceApplication.findOne.mockRejectedValue(error);

    await expect(findDraftByService(10, 'gst-registration')).rejects.toThrow('DB error');
  });
});
