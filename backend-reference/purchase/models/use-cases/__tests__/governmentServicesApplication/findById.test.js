const governmentServicesApplication = require('../../../entities/governmentServicesApplication');
const { findById } = require('../../governmentServicesApplication');

jest.mock('../../../entities/governmentServicesApplication', () => ({
  findOne: jest.fn(),
}));

describe('governmentServicesApplication findById use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should scope the lookup to the credential when given', async () => {
    const mockResult = { id: 1, credentialId: 7 };
    governmentServicesApplication.findOne.mockResolvedValue(mockResult);

    const result = await findById(1, 7);

    expect(governmentServicesApplication.findOne).toHaveBeenCalledWith({ where: { id: 1, credentialId: 7 } });
    expect(result).toEqual(mockResult);
  });

  it('should look up by id only when no credential is given', async () => {
    governmentServicesApplication.findOne.mockResolvedValue(null);

    const result = await findById(1);

    expect(governmentServicesApplication.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toBeNull();
  });

  it('should throw an error when database query fails', async () => {
    governmentServicesApplication.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findById(1, 7)).rejects.toThrow('DB error');
  });
});
