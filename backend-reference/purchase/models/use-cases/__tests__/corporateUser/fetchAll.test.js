const { fetchAll } = require('../../corporateUser');
const corporateUser = require('../../../entities/corporateUser');
const credential = require('../../../entities/credential');
const { Op } = require('sequelize');

jest.mock('../../../entities/corporateUser', () => ({
  findAll: jest.fn(), // Mocking findAll method explicitly
}));

jest.mock('../../../entities/credential', () => ({
  findOne: jest.fn(),
}));

describe('fetchAll', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully retrieve data with valid query', async () => {
    const query = 'test';
    const mockData = [{ id: 1, name: 'testUser', credential: { name: 'testCredential' } }];
    
    corporateUser.findAll.mockResolvedValue(mockData);

    const result = await fetchAll(query, 'CORPORATE', null);

    expect(corporateUser.findAll).toHaveBeenCalledWith(expect.objectContaining({
      include: [
        {
          model: credential,
          where: {
            name: {
              [Op.like]: `%${query}%`,
            },
            role: 'CORPORATE',
          },
        },
      ],
      raw: true,
      nest: true,
    }));
    expect(result).toEqual(mockData);
  });

  it('should return an empty array when no results are found', async () => {
    const query = 'nonexistent';
    corporateUser.findAll.mockResolvedValue([]);

    const result = await fetchAll(query, 'CORPORATE', null);

    expect(result).toEqual([]);
  });

  it('should handle special characters in query', async () => {
    const query = 'sp@ci@l';
    const mockData = [{ id: 1, name: 'sp@ci@lUser', credential: { name: 'specialCredential' } }];
    
    corporateUser.findAll.mockResolvedValue(mockData);

    const result = await fetchAll(query, 'CORPORATE', null);

    expect(corporateUser.findAll).toHaveBeenCalledWith(expect.objectContaining({
      include: [
        {
          model: credential,
          where: {
            name: {
              [Op.like]: `%${query}%`,
            },
            role: 'CORPORATE',
          },
        },
      ],
      raw: true,
      nest: true,
    }));
    expect(result).toEqual(mockData);
  });

  it('should return all records for an empty query', async () => {
    const query = '';
    const mockData = [
      { id: 1, name: 'user1', credential: { name: 'credential1' } },
      { id: 2, name: 'user2', credential: { name: 'credential2' } },
    ];
    
    corporateUser.findAll.mockResolvedValue(mockData);

    const result = await fetchAll(query, 'CORPORATE', null);

    expect(corporateUser.findAll).toHaveBeenCalledWith(expect.objectContaining({
      include: [
        {
          model: credential,
          where: {
            name: {
              [Op.like]: `%${query}%`,
            },
            role: 'CORPORATE',
          },
        },
      ],
      raw: true,
      nest: true,
    }));
    expect(result).toEqual(mockData);
  });

  it('should handle large query string', async () => {
    const query = 'a'.repeat(1000);
    const mockData = [{ id: 1, name: 'a'.repeat(1000), credential: { name: 'largeQuery' } }];
    
    corporateUser.findAll.mockResolvedValue(mockData);

    const result = await fetchAll(query, 'CORPORATE', null);

    expect(corporateUser.findAll).toHaveBeenCalledWith(expect.objectContaining({
      include: [
        {
          model: credential,
          where: {
            name: {
              [Op.like]: `%${query}%`,
            },
            role: 'CORPORATE',
          },
        },
      ],
      raw: true,
      nest: true,
    }));
    expect(result).toEqual(mockData);
  });

  it('should handle database errors gracefully', async () => {
    const errorMessage = 'Database connection error';
    corporateUser.findAll.mockRejectedValue(new Error(errorMessage));

    const query = 'test';
    await expect(fetchAll(query, 'CORPORATE', null)).rejects.toThrow(errorMessage);

    expect(corporateUser.findAll).toHaveBeenCalledWith(expect.objectContaining({
      include: [
        {
          model: credential,
          where: {
            name: {
              [Op.like]: `%${query}%`,
            },
            role: 'CORPORATE',
          },
        },
      ],
      raw: true,
      nest: true,
    }));
  });
});
