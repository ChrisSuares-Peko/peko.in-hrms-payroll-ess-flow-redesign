const { findRole } = require('../../roleAndPermissions'); // Adjust the path as necessary
const systemUser = require('../../../entities/systemUser');
const roleAndPermissions = require('../../../entities/roleAndPermissions');

jest.mock('../../../entities/systemUser', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../entities/roleAndPermissions', () => ({}));

describe('findRole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the role for a valid credentialId', async () => {
    const mockCredentialId = 1;
    const mockRole = {
      roleName: 'Admin',
    };
    const mockData = {
      credentialId: mockCredentialId,
      roleAndPermissions: mockRole,
    };

    systemUser.findOne.mockResolvedValue(mockData);

    const result = await findRole(mockCredentialId);

    // Verify `findOne` was called with correct parameters
    expect(systemUser.findOne).toHaveBeenCalledWith({
      where: { credentialId: mockCredentialId },
      include: [
        {
          model: roleAndPermissions,
          attributes: ['roleName'],
        },
      ],
    });

    // Verify the result matches the mock data
    expect(result).toEqual(mockData);
  });

  it('should return null if no user is found for the given credentialId', async () => {
    const mockCredentialId = 999;
    systemUser.findOne.mockResolvedValue(null);

    const result = await findRole(mockCredentialId);

    // Verify `findOne` was called with correct parameters
    expect(systemUser.findOne).toHaveBeenCalledWith({
      where: { credentialId: mockCredentialId },
      include: [
        {
          model: roleAndPermissions,
          attributes: ['roleName'],
        },
      ],
    });

    // Verify the result is null
    expect(result).toBeNull();
  });

  it('should throw an error if findOne fails', async () => {
    const mockCredentialId = 1;
    const mockError = new Error('Database error');
    systemUser.findOne.mockRejectedValue(mockError);

    await expect(findRole(mockCredentialId)).rejects.toThrow('Database error');

    // Verify `findOne` was called
    expect(systemUser.findOne).toHaveBeenCalledWith({
      where: { credentialId: mockCredentialId },
      include: [
        {
          model: roleAndPermissions,
          attributes: ['roleName'],
        },
      ],
    });
  });
});
