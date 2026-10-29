const govtServiceApplication = require('../../../entities/govtServiceApplication');
const { updateApplicationNumber } = require('../../govtServiceApplications');

jest.mock('../../../../middlewares/async', () => fn => fn);

jest.mock('../../../entities/govtServiceApplication', () => ({
  update: jest.fn(),
  belongsTo: jest.fn(),
}));

jest.mock('../../../entities/credential', () => ({}));

describe('govtServiceApplications updateApplicationNumber use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update the application number and return the result', async () => {
    const id = 1;
    const applicationNumber = 'APP-2026-001';
    const mockResult = [1];

    govtServiceApplication.update.mockResolvedValue(mockResult);

    const result = await updateApplicationNumber(id, applicationNumber);

    expect(govtServiceApplication.update).toHaveBeenCalledWith(
      { applicationNumber },
      { where: { id } }
    );
    expect(result).toEqual(mockResult);
  });

  it('should return update result when no rows are affected', async () => {
    govtServiceApplication.update.mockResolvedValue([0]);

    const result = await updateApplicationNumber(99, 'APP-2026-999');

    expect(result).toEqual([0]);
  });

  it('should throw an error when database update fails', async () => {
    const error = new Error('DB error');
    govtServiceApplication.update.mockRejectedValue(error);

    await expect(updateApplicationNumber(1, 'APP-001')).rejects.toThrow('DB error');
  });
});
