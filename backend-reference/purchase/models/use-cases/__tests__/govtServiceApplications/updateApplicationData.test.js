const govtServiceApplication = require('../../../entities/govtServiceApplication');
const { updateApplicationData } = require('../../govtServiceApplications');

jest.mock('../../../../middlewares/async', () => fn => fn);

jest.mock('../../../entities/govtServiceApplication', () => ({
  update: jest.fn(),
  belongsTo: jest.fn(),
}));

jest.mock('../../../entities/credential', () => ({}));

describe('govtServiceApplications updateApplicationData use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update application data for a given credential and application id', async () => {
    const id = 1;
    const credentialId = 10;
    const data = { status: 'IN_REVIEW', remarks: 'Under review' };
    const mockResult = [1];

    govtServiceApplication.update.mockResolvedValue(mockResult);

    const result = await updateApplicationData(id, credentialId, data);

    expect(govtServiceApplication.update).toHaveBeenCalledWith(data, {
      where: { id, credentialId },
    });
    expect(result).toEqual(mockResult);
  });

  it('should return update result when no rows are affected', async () => {
    govtServiceApplication.update.mockResolvedValue([0]);

    const result = await updateApplicationData(99, 10, { remarks: 'test' });

    expect(result).toEqual([0]);
  });

  it('should throw an error when database update fails', async () => {
    const error = new Error('DB error');
    govtServiceApplication.update.mockRejectedValue(error);

    await expect(updateApplicationData(1, 10, {})).rejects.toThrow('DB error');
  });
});
