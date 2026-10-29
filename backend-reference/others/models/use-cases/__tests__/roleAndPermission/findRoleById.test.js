const { findRoleById } = require('../../roleAndPermissions'); // Adjust the path as needed
const roleAndPermissions = require('../../../entities/roleAndPermissions');

jest.mock('../../../entities/roleAndPermissions', () => ({
  findOne: jest.fn(),
}));

describe('findRoleById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  jest.mock('../../../entities/subCorporateUsers', () => ({
    belongsTo: jest.fn(),
}));

  it('should return the role when a valid ID is provided', async () => {
    const mockRoleId = 1;
    const mockRole = {
      id: mockRoleId,
      roleName: 'Admin',
    };

    roleAndPermissions.findOne.mockResolvedValue(mockRole);

    const result = await findRoleById(mockRoleId);

    // Verify that `findOne` was called with the correct condition
    expect(roleAndPermissions.findOne).toHaveBeenCalledWith({
      where: { id: mockRoleId },
      attributes: ['id', 'roleName'],
    });

    // Verify the result
    expect(result).toEqual(mockRole);
  });

  it('should return null if the role does not exist', async () => {
    const mockRoleId = 999; // Nonexistent role ID

    roleAndPermissions.findOne.mockResolvedValue(null);

    const result = await findRoleById(mockRoleId);

    // Verify that `findOne` was called with the correct condition
    expect(roleAndPermissions.findOne).toHaveBeenCalledWith({
      where: { id: mockRoleId },
      attributes: ['id', 'roleName'],
    });

    // Verify the result is null
    expect(result).toBeNull();
  });

  it('should throw an error if the database query fails', async () => {
    const mockRoleId = 1;
    const errorMessage = 'Database error';

    roleAndPermissions.findOne.mockRejectedValue(new Error(errorMessage));

    await expect(findRoleById(mockRoleId)).rejects.toThrow(errorMessage);

    // Verify that `findOne` was called with the correct condition
    expect(roleAndPermissions.findOne).toHaveBeenCalledWith({
      where: { id: mockRoleId },
      attributes: ['id', 'roleName'],
    });
  });
});
