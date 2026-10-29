const govtServiceApplication = require('../../../entities/govtServiceApplication');
const { findById } = require('../../govtServiceApplications');

jest.mock('../../../../middlewares/async', () => fn => fn);

jest.mock('../../../entities/govtServiceApplication', () => ({
  findOne: jest.fn(),
  belongsTo: jest.fn(),
}));

jest.mock('../../../entities/credential', () => ({}));

describe('govtServiceApplications findById use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the application by id without credentialId filter', async () => {
    const id = 1;
    const mockResult = { id, service: 'gst-registration', status: 'SUBMITTED' };

    govtServiceApplication.findOne.mockResolvedValue(mockResult);

    const result = await findById(id);

    const callArgs = govtServiceApplication.findOne.mock.calls[0][0];
    expect(callArgs.where).toEqual({ id });
    expect(result).toEqual(mockResult);
  });

  it('should add credentialId to where clause when credentialId is provided', async () => {
    const id = 1;
    const credentialId = 10;
    const mockResult = { id, credentialId, service: 'gst-registration' };

    govtServiceApplication.findOne.mockResolvedValue(mockResult);

    const result = await findById(id, credentialId);

    const callArgs = govtServiceApplication.findOne.mock.calls[0][0];
    expect(callArgs.where).toEqual({ id, credentialId });
    expect(result).toEqual(mockResult);
  });

  it('should return null when no application is found', async () => {
    govtServiceApplication.findOne.mockResolvedValue(null);

    const result = await findById(99);

    expect(result).toBeNull();
  });

  it('should throw an error when database query fails', async () => {
    const error = new Error('DB error');
    govtServiceApplication.findOne.mockRejectedValue(error);

    await expect(findById(1)).rejects.toThrow('DB error');
  });
});
