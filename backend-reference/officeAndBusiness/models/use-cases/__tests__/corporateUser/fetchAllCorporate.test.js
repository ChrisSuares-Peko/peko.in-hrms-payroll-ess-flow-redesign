const { fetchAllCorporate } = require('../../corporateUser'); // Adjust the path if needed
const corporateUser = require('../../../entities/corporateUser');
const credential = require('../../../entities/credential');
const { Op } = require('sequelize');

jest.mock('../../../entities/corporateUser', () => ({
  findAll: jest.fn(),
}));

describe('fetchAllCorporate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully retrieve all corporate users based on query and role', async () => {
    const query = 'John';
    const role = 'admin';
    const mockUsers = [
      {
        name: 'John Doe',
        id: 1,
        credentialId: 10,
        email: 'john@example.com',
        mobileNo: '1234567890',
        credential: { name: 'John', username: 'john.doe' },
      },
    ];

    corporateUser.findAll.mockResolvedValue(mockUsers);

    const result = await fetchAllCorporate(query, role);

    expect(corporateUser.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: credential,
          where: {
            name: { [Op.like]: `%${query}%` },
            role,
          },
          attributes: ['name', 'username'],
        },
      ],
      attributes: ['name', 'id', 'credentialId', 'email', 'mobileNo'],
      order: [[{ model: credential }, 'name', 'ASC']],
      raw: true,
      nest: true,
    });
    expect(result).toEqual(mockUsers);
  });

  it('should handle no results found', async () => {
    const query = 'Unknown';
    const role = 'user';

    corporateUser.findAll.mockResolvedValue([]);

    const result = await fetchAllCorporate(query, role);

    expect(corporateUser.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: credential,
          where: {
            name: { [Op.like]: `%${query}%` },
            role,
          },
          attributes: ['name', 'username'],
        },
      ],
      attributes: ['name', 'id', 'credentialId', 'email', 'mobileNo'],
      order: [[{ model: credential }, 'name', 'ASC']],
      raw: true,
      nest: true,
    });
    expect(result).toEqual([]);
  });

  it('should handle errors thrown by corporateUser.findAll', async () => {
    const query = 'John';
    const role = 'admin';
    const error = new Error('Database error');

    corporateUser.findAll.mockRejectedValue(error);

    await expect(fetchAllCorporate(query, role)).rejects.toThrow('Database error');

    expect(corporateUser.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: credential,
          where: {
            name: { [Op.like]: `%${query}%` },
            role,
          },
          attributes: ['name', 'username'],
        },
      ],
      attributes: ['name', 'id', 'credentialId', 'email', 'mobileNo'],
      order: [[{ model: credential }, 'name', 'ASC']],
      raw: true,
      nest: true,
    });
  });

  it('should handle undefined query and role', async () => {
    const query = undefined;
    const role = undefined;
    const error = new Error('Cannot read properties of undefined');

    corporateUser.findAll.mockRejectedValue(error);

    await expect(fetchAllCorporate(query, role)).rejects.toThrow('Cannot read properties of undefined');

    expect(corporateUser.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: credential,
          where: {
            name: { [Op.like]: `%${query}%` },
            role,
          },
          attributes: ['name', 'username'],
        },
      ],
      attributes: ['name', 'id', 'credentialId', 'email', 'mobileNo'],
      order: [[{ model: credential }, 'name', 'ASC']],
      raw: true,
      nest: true,
    });
  });
});
