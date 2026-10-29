const { deleteRole } = require('../../roleAndPermissions'); // Adjust the path as needed
const roleAndPermissions = require('../../../entities/roleAndPermissions');

jest.mock('../../../entities/roleAndPermissions', () => ({
  findByPk: jest.fn(),
}));

describe('deleteRole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete the role if it exists', async () => {
    const mockRoleId = 1;
    const mockRole = {
      id: mockRoleId,
      destroy: jest.fn().mockResolvedValue(true),
    };

    roleAndPermissions.findByPk.mockResolvedValue(mockRole);

    const result = await deleteRole(mockRoleId);

    // Verify that `findByPk` was called with the correct ID
    expect(roleAndPermissions.findByPk).toHaveBeenCalledWith(mockRoleId);

    // Verify that `destroy` was called on the role
    expect(mockRole.destroy).toHaveBeenCalled();

    // Verify the result
    expect(result).toBe(true);
  });

  it('should return null if the role is not found', async () => {
    const mockRoleId = 999; // Nonexistent role ID

    roleAndPermissions.findByPk.mockResolvedValue(null);

    const result = await deleteRole(mockRoleId);

    // Verify that `findByPk` was called with the correct ID
    expect(roleAndPermissions.findByPk).toHaveBeenCalledWith(mockRoleId);

    // Verify the result is null
    expect(result).toBeNull();
  });

  it('should throw an error if the destroy operation fails', async () => {
    const mockRoleId = 1;
    const mockRole = {
      id: mockRoleId,
      destroy: jest.fn().mockRejectedValue(new Error('Database error')),
    };

    roleAndPermissions.findByPk.mockResolvedValue(mockRole);

    await expect(deleteRole(mockRoleId)).rejects.toThrow('Database error');

    // Verify that `findByPk` was called with the correct ID
    expect(roleAndPermissions.findByPk).toHaveBeenCalledWith(mockRoleId);

    // Verify that `destroy` was called on the role
    expect(mockRole.destroy).toHaveBeenCalled();
  });
});
