const govtServiceApplication = require('../../../entities/govtServiceApplication');
const { submitApplication } = require('../../govtServiceApplications');

jest.mock('../../../../middlewares/async', () => fn => fn);

jest.mock('../../../entities/govtServiceApplication', () => ({
  update: jest.fn(),
  belongsTo: jest.fn(),
}));

jest.mock('../../../entities/credential', () => ({}));

describe('govtServiceApplications submitApplication use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-27T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should submit a draft application with SUBMITTED status and timestamp', async () => {
    const id = 1;
    const credentialId = 10;
    const now = new Date('2026-05-27T10:00:00.000Z');
    const mockResult = [1];

    govtServiceApplication.update.mockResolvedValue(mockResult);

    const result = await submitApplication(id, credentialId);

    expect(govtServiceApplication.update).toHaveBeenCalledWith(
      {
        status: 'SUBMITTED',
        submittedAt: now,
        statusHistory: [{ status: 'SUBMITTED', timestamp: now }],
      },
      { where: { id, credentialId, status: 'DRAFT' } }
    );
    expect(result).toEqual(mockResult);
  });

  it('should return update result when no draft application matches', async () => {
    govtServiceApplication.update.mockResolvedValue([0]);

    const result = await submitApplication(99, 10);

    expect(result).toEqual([0]);
  });

  it('should throw an error when database update fails', async () => {
    const error = new Error('DB error');
    govtServiceApplication.update.mockRejectedValue(error);

    await expect(submitApplication(1, 10)).rejects.toThrow('DB error');
  });
});
