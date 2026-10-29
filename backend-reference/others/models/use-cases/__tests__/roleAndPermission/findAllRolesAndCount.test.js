const { findAllRolesAndCount } = require('../../roleAndPermissions'); // Adjust the path as necessary
const roleAndPermissions = require('../../../entities/roleAndPermissions');
const { Op } = require('sequelize');

jest.mock('../../../entities/roleAndPermissions', () => ({
  findAndCountAll: jest.fn(),
}));

describe('findAllRolesAndCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return roles and their count with valid parameters', async () => {
    const mockParams = {
      limit: 10,
      offset: 0,
      searchText: 'Admin',
      sort: 'ASC',
      sortField: 'roleName',
    };
    const mockResult = {
      rows: [
        { id: 1, roleName: 'Admin' },
        { id: 2, roleName: 'User' },
      ],
      count: 2,
    };

    roleAndPermissions.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findAllRolesAndCount(mockParams);

    // Verify `findAndCountAll` is called with correct parameters
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
      order: [['roleName', 'ASC']], // Simulating sortField and sort conversion
      limit: 10,
      offset: 0,
      raw: true,
      nest: true,
    });

    // Verify the result matches the expected output
    expect(result).toEqual(mockResult);
  });

  it('should return an empty result if no roles match the search criteria', async () => {
    const mockParams = {
      limit: 10,
      offset: 0,
      searchText: 'Nonexistent',
      sort: 'ASC',
      sortField: 'roleName',
    };
    const mockResult = {
      rows: [],
      count: 0,
    };

    roleAndPermissions.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findAllRolesAndCount(mockParams);

    // Verify the result is as expected
    expect(result).toEqual(mockResult);

    // Ensure `findAndCountAll` was called with appropriate filters
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
      limit: 10,
      offset: 0,
      raw: true,
      nest: true,
    });
  });

  it('should handle missing parameters gracefully', async () => {
    const mockParams = {
      searchText: '',
    };
    const mockResult = {
      rows: [],
      count: 0,
    };

    roleAndPermissions.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findAllRolesAndCount(mockParams);

    expect(roleAndPermissions.findAndCountAll).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          {
            roleName: {
              [Op.like]: '%%',
            },
          },
        ],
        isAdmin: false,
      },
      order: [['createdAt', 'DESC']], // Default if sortField and sort are missing
      limit: undefined,
      offset: undefined,
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockResult);
  });

  it('should throw an error if findAndCountAll fails', async () => {
    const mockParams = {
      limit: 10,
      offset: 0,
      searchText: 'Error',
    };
    const mockError = new Error('Database error');

    roleAndPermissions.findAndCountAll.mockRejectedValue(mockError);

    await expect(findAllRolesAndCount(mockParams)).rejects.toThrow('Database error');
  });
});
