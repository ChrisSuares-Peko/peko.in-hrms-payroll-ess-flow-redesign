const govtServiceApplication = require('../../../entities/govtServiceApplication');
const { saveFormData } = require('../../govtServiceApplications');

jest.mock('../../../../middlewares/async', () => fn => fn);

jest.mock('../../../entities/govtServiceApplication', () => ({
  update: jest.fn(),
  belongsTo: jest.fn(),
}));

jest.mock('../../../entities/credential', () => ({}));

describe('govtServiceApplications saveFormData use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save form data for a draft application', async () => {
    const id = 1;
    const credentialId = 10;
    const formData = { businessName: 'Peko Inc', gstType: 'Regular' };
    const currentStep = 2;
    const mockResult = [1];

    govtServiceApplication.update.mockResolvedValue(mockResult);

    const result = await saveFormData(id, credentialId, formData, currentStep);

    expect(govtServiceApplication.update).toHaveBeenCalledWith(
      { formData, currentStep },
      { where: { id, credentialId, status: 'DRAFT' } }
    );
    expect(result).toEqual(mockResult);
  });

  it('should return update result when no rows are affected', async () => {
    govtServiceApplication.update.mockResolvedValue([0]);

    const result = await saveFormData(99, 10, {}, 1);

    expect(result).toEqual([0]);
  });

  it('should throw an error when database update fails', async () => {
    const error = new Error('DB error');
    govtServiceApplication.update.mockRejectedValue(error);

    await expect(saveFormData(1, 10, {}, 1)).rejects.toThrow('DB error');
  });
});
