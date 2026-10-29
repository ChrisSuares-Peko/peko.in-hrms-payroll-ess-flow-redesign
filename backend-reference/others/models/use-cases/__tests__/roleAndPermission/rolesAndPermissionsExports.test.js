const { rolesAndPermissionsExports } = require('../../roleAndPermissions'); // Adjust the path as needed
const roleAndPermissions = require('../../../entities/roleAndPermissions');
const { Op } = require('sequelize');

jest.mock('../../../entities/roleAndPermissions', () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/formatter', () => ({
  formattedDateTime: jest.fn((date) => date.toISOString()),
}));

describe('rolesAndPermissionsExports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return formatted data when roles are found', async () => {
    const mockParams = {
      searchText: 'Admin',
      sort: 'ASC',
      sortField: 'roleName',
    };
    const mockData = {
      rows: [
        { id: 1, roleName: 'Admin', createdAt: new Date(), status: 1 },
        { id: 2, roleName: 'User', createdAt: new Date(), status: 0 },
      ],
      count: 2,
    };

    roleAndPermissions.findAndCountAll.mockResolvedValue(mockData);

    const result = await rolesAndPermissionsExports(mockParams);

    // Verify the call to `findAndCountAll`
    expect(roleAndPermissions.findAndCountAll).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          {
            roleName: {
              [Op.like]: '%Admin%',
            },
          },
        ],
        isAdmin: false,
      },
      order: [['roleName', 'ASC']],
      raw: true,
      nest: true,
    });

    // Verify the result matches the expected formatted data
    expect(result).toEqual([
      {
        Date: mockData.rows[0].createdAt.toISOString(),
        'Role Name': 'Admin',
        Status: 'Active',
      },
      {
        Date: mockData.rows[1].createdAt.toISOString(),
        'Role Name': 'User',
        Status: 'In Active',
      },
    ]);
  });

  it('should return an empty array when no roles are found', async () => {
    const mockParams = {
      searchText: 'Nonexistent',
      sort: 'ASC',
      sortField: 'roleName',
    };
    const mockData = { rows: [], count: 0 };

    roleAndPermissions.findAndCountAll.mockResolvedValue(mockData);

    const result = await rolesAndPermissionsExports(mockParams);

    expect(roleAndPermissions.findAndCountAll).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          {
            roleName: {
              [Op.like]: '%Nonexistent%',
            },
          },
        ],
        isAdmin: false,
      },
      order: [['roleName', 'ASC']],
      raw: true,
      nest: true,
    });

    expect(result).toEqual([]);
  });

  it('should handle errors gracefully', async () => {
    const mockParams = {
      searchText: 'Error',
      sort: 'ASC',
      sortField: 'roleName',
    };
    const mockError = new Error('Database error');

    roleAndPermissions.findAndCountAll.mockRejectedValue(mockError);

    await expect(rolesAndPermissionsExports(mockParams)).rejects.toEqual({
      message: 'Something went wrong',
    });

    expect(roleAndPermissions.findAndCountAll).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          {
            roleName: {
              [Op.like]: '%Error%',
            },
          },
        ],
        isAdmin: false,
      },
      order: [['roleName', 'ASC']],
      raw: true,
      nest: true,
    });
  });
});
