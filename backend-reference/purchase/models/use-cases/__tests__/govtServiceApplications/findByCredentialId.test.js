const govtServiceApplication = require('../../../entities/govtServiceApplication');
const { Op } = require('sequelize');
const { findByCredentialId } = require('../../govtServiceApplications');

jest.mock('../../../../middlewares/async', () => fn => fn);

jest.mock('../../../entities/govtServiceApplication', () => ({
  findAll: jest.fn(),
  belongsTo: jest.fn(),
}));

jest.mock('../../../entities/credential', () => ({}));

describe('govtServiceApplications findByCredentialId use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all non-draft applications for a credential', async () => {
    const credentialId = 10;
    const mockResult = [
      { id: 1, credentialId, status: 'SUBMITTED' },
      { id: 2, credentialId, status: 'COMPLETED' },
    ];

    govtServiceApplication.findAll.mockResolvedValue(mockResult);

    const result = await findByCredentialId(credentialId);

    expect(govtServiceApplication.findAll).toHaveBeenCalledWith({
      where: { credentialId, status: { [Op.ne]: 'DRAFT' } },
      order: [['createdAt', 'DESC']],
    });
    expect(result).toEqual(mockResult);
  });

  it('should return an empty array when no applications exist', async () => {
    govtServiceApplication.findAll.mockResolvedValue([]);

    const result = await findByCredentialId(99);

    expect(result).toEqual([]);
  });

  it('should throw an error when database query fails', async () => {
    const error = new Error('DB error');
    govtServiceApplication.findAll.mockRejectedValue(error);

    await expect(findByCredentialId(10)).rejects.toThrow('DB error');
  });
});
