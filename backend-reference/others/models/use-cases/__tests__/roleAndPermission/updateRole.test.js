const { updateRole } = require('../../roleAndPermissions'); // Adjust the path as needed
const roleAndPermissions = require('../../../entities/roleAndPermissions');

jest.mock('../../../entities/roleAndPermissions', () => ({
  findByPk: jest.fn(),
}));

describe('updateRole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update the role with valid data', async () => {
    const mockRoleId = 1;
    const mockUpdatedData = { roleName: 'Updated Role', status: true };
    const mockRole = {
      id: mockRoleId,
      update: jest.fn().mockResolvedValue({ id: mockRoleId, ...mockUpdatedData }),
    };

    roleAndPermissions.findByPk.mockResolvedValue(mockRole);

    const result = await updateRole(mockRoleId, mockUpdatedData);

    // Verify that `findByPk` was called with the correct ID
    expect(roleAndPermissions.findByPk).toHaveBeenCalledWith(mockRoleId);

    // Verify that `update` was called with the updated data
    expect(mockRole.update).toHaveBeenCalledWith(mockUpdatedData);

    // Verify the result matches the updated role
    expect(result).toEqual({ id: mockRoleId, ...mockUpdatedData });
  });

  it('should return null if the role is not found', async () => {
    const mockRoleId = 999; // Nonexistent role ID
    const mockUpdatedData = { roleName: 'Updated Role', status: true };

    roleAndPermissions.findByPk.mockResolvedValue(null);

    const result = await updateRole(mockRoleId, mockUpdatedData);

    // Verify that `findByPk` was called with the correct ID
    expect(roleAndPermissions.findByPk).toHaveBeenCalledWith(mockRoleId);

    // Verify the result is null
    expect(result).toBeNull();
  });

  it('should throw an error if the update operation fails', async () => {
    const mockRoleId = 1;
    const mockUpdatedData = { roleName: 'Updated Role', status: true };
    const mockRole = {
      id: mockRoleId,
      update: jest.fn().mockRejectedValue(new Error('Database error')),
    };

    roleAndPermissions.findByPk.mockResolvedValue(mockRole);

    await expect(updateRole(mockRoleId, mockUpdatedData)).rejects.toThrow('Database error');

    // Verify that `findByPk` was called with the correct ID
    expect(roleAndPermissions.findByPk).toHaveBeenCalledWith(mockRoleId);

    // Verify that `update` was called with the updated data
    expect(mockRole.update).toHaveBeenCalledWith(mockUpdatedData);
  });
});
