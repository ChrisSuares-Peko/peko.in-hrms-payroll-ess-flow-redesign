const govtServiceApplication = require('../../../entities/govtServiceApplication');
const { findDraftsByCredentialId } = require('../../govtServiceApplications');

jest.mock('../../../../middlewares/async', () => fn => fn);

jest.mock('../../../entities/govtServiceApplication', () => ({
  findAll: jest.fn(),
  belongsTo: jest.fn(),
}));

jest.mock('../../../entities/credential', () => ({}));

describe('govtServiceApplications findDraftsByCredentialId use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all draft applications for a credential', async () => {
    const credentialId = 10;
    const mockResult = [
      { id: 1, credentialId, status: 'DRAFT', service: 'gst-registration' },
    ];

    govtServiceApplication.findAll.mockResolvedValue(mockResult);

    const result = await findDraftsByCredentialId(credentialId);

    expect(govtServiceApplication.findAll).toHaveBeenCalledWith({
      where: { credentialId, status: 'DRAFT' },
      order: [['createdAt', 'DESC']],
    });
    expect(result).toEqual(mockResult);
  });

  it('should return an empty array when no drafts exist', async () => {
    govtServiceApplication.findAll.mockResolvedValue([]);

    const result = await findDraftsByCredentialId(10);

    expect(result).toEqual([]);
  });

  it('should throw an error when database query fails', async () => {
    const error = new Error('DB error');
    govtServiceApplication.findAll.mockRejectedValue(error);

    await expect(findDraftsByCredentialId(10)).rejects.toThrow('DB error');
  });
});
