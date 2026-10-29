const governmentServicesApplication = require('../../../entities/governmentServicesApplication');
const { create } = require('../../governmentServicesApplication');

jest.mock('../../../entities/governmentServicesApplication', () => ({
  create: jest.fn(),
}));

describe('governmentServicesApplication create use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create an application with the given data', async () => {
    const data = { credentialId: 7, applicationId: '9001', vendorCatalogId: 'CAT1', applicationData: {} };
    const mockResult = { id: 1, ...data };
    governmentServicesApplication.create.mockResolvedValue(mockResult);

    const result = await create(data);

    expect(governmentServicesApplication.create).toHaveBeenCalledWith(data);
    expect(result).toEqual(mockResult);
  });

  it('should throw an error when database query fails', async () => {
    governmentServicesApplication.create.mockRejectedValue(new Error('DB error'));

    await expect(create({})).rejects.toThrow('DB error');
  });
});
