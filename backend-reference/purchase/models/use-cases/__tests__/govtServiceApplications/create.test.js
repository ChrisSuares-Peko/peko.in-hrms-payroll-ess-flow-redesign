const govtServiceApplication = require('../../../entities/govtServiceApplication');
const { create } = require('../../govtServiceApplications');

jest.mock('../../../../middlewares/async', () => fn => fn);

jest.mock('../../../entities/govtServiceApplication', () => ({
  create: jest.fn(),
  belongsTo: jest.fn(),
}));

jest.mock('../../../entities/credential', () => ({}));

describe('govtServiceApplications create use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create and return a new application', async () => {
    const data = {
      credentialId: 10,
      service: 'gst-registration',
      formData: { businessName: 'Peko Inc' },
    };
    const mockResult = { id: 1, ...data, status: 'DRAFT' };

    govtServiceApplication.create.mockResolvedValue(mockResult);

    const result = await create(data);

    expect(govtServiceApplication.create).toHaveBeenCalledWith(data);
    expect(result).toEqual(mockResult);
  });

  it('should return null when create returns null', async () => {
    govtServiceApplication.create.mockResolvedValue(null);

    const result = await create({ service: 'test' });

    expect(result).toBeNull();
  });

  it('should throw an error when database creation fails', async () => {
    const error = new Error('DB error');
    govtServiceApplication.create.mockRejectedValue(error);

    await expect(create({ service: 'test' })).rejects.toThrow('DB error');
  });
});
