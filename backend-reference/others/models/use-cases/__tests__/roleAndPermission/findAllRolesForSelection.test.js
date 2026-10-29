const { findAllRolesForSelection } = require('../../roleAndPermissions'); // Adjust the path as necessary
const roleAndPermissions = require('../../../entities/roleAndPermissions');

jest.mock('../../../entities/roleAndPermissions', () => ({
  findAll: jest.fn(),
}));

describe('findAllRolesForSelection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a list of roles with formatted attributes', async () => {
    const mockRoles = [
      { id: 1, roleName: 'User' },
      { id: 2, roleName: 'Guest' },
    ];
   

    roleAndPermissions.findAll.mockResolvedValue(mockRoles);

    const result = await findAllRolesForSelection();

    // Verify `findAll` was called with the correct parameters
    expect(roleAndPermissions.findAll).toHaveBeenCalledWith({
      where: { isAdmin: false },
      attributes: [
        ['id', 'value'],
        ['roleName', 'label'],
      ],
    });

    // Verify the result matches the expected formatted data
    expect(result).toEqual(mockRoles);
  });

  it('should return an empty list if no roles are found', async () => {
    roleAndPermissions.findAll.mockResolvedValue([]);

    const result = await findAllRolesForSelection();

    // Verify `findAll` was called with the correct parameters
    expect(roleAndPermissions.findAll).toHaveBeenCalledWith({
      where: { isAdmin: false },
      attributes: [
        ['id', 'value'],
        ['roleName', 'label'],
      ],
    });

    // Verify the result is an empty array
    expect(result).toEqual([]);
  });

  it('should throw an error if the query fails', async () => {
    const mockError = new Error('Database error');
    roleAndPermissions.findAll.mockRejectedValue(mockError);

    await expect(findAllRolesForSelection()).rejects.toThrow('Database error');

    // Verify `findAll` was called with the correct parameters
    expect(roleAndPermissions.findAll).toHaveBeenCalledWith({
      where: { isAdmin: false },
      attributes: [
        ['id', 'value'],
        ['roleName', 'label'],
      ],
    });
  });
});
