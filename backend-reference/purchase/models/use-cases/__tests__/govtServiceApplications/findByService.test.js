const govtServiceApplication = require('../../../entities/govtServiceApplication');
const { findByService } = require('../../govtServiceApplications');

jest.mock('../../../../middlewares/async', () => fn => fn);

jest.mock('../../../entities/govtServiceApplication', () => ({
  findOne: jest.fn(),
  belongsTo: jest.fn(),
}));

jest.mock('../../../entities/credential', () => ({}));

describe('govtServiceApplications findByService use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the most recent application for a given credential and service', async () => {
    const credentialId = 10;
    const service = 'gst-registration';
    const mockResult = { id: 2, credentialId, service, status: 'SUBMITTED' };

    govtServiceApplication.findOne.mockResolvedValue(mockResult);

    const result = await findByService(credentialId, service);

    expect(govtServiceApplication.findOne).toHaveBeenCalledWith({
      where: { credentialId, service },
      order: [['createdAt', 'DESC']],
    });
    expect(result).toEqual(mockResult);
  });

  it('should return null when no application exists for the service', async () => {
    govtServiceApplication.findOne.mockResolvedValue(null);

    const result = await findByService(10, 'nonexistent-service');

    expect(result).toBeNull();
  });

  it('should throw an error when database query fails', async () => {
    const error = new Error('DB error');
    govtServiceApplication.findOne.mockRejectedValue(error);

    await expect(findByService(10, 'gst-registration')).rejects.toThrow('DB error');
  });
});
