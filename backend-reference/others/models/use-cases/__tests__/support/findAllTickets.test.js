const { findAllTickets } = require('../../../use-cases/support');
const messages = require('../../../entities/support');
const { Op } = require('sequelize');

jest.mock('../../../entities/support', () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock('../../../entities/corporateUser',()=>({
    hasMany: jest.fn()
}));

describe('findAllTickets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch tickets with correct parameters', async () => {
    const params = {
      from: new Date('2024-08-01'),
      to: new Date('2024-08-10'),
      searchText: 'test',
      limit: 10,
      offset: 0,
      corporateId: 1,
      module: 'testModule',
      excludeAttribute: ['someAttribute']
    };

    const tomorrow = new Date(params.to);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const expectedWhereClause = {
      createdAt: {
        [Op.between]: [params.from, tomorrow],
      },
      [Op.or]: [
        { id: { [Op.like]: `%${params.searchText}%` } },
        { issueType: { [Op.like]: `%${params.searchText}%` } },
        { module: { [Op.like]: `%${params.searchText}%` } },
        { description: { [Op.like]: `%${params.searchText}%` } },
      ],
      module: params.module,
      corporateUserId: params.corporateId,
    };

    const mockResult = {
      count: 2,
      rows: [
        { id: 1, description: 'Test message 1' },
        { id: 2, description: 'Test message 2' }
      ]
    };
    messages.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findAllTickets(params);

    expect(result).toEqual(mockResult);
    expect(messages.findAndCountAll).toHaveBeenCalledWith({
      where: expectedWhereClause,
      limit: params.limit,
      order: [['createdAt', 'DESC']],
      offset: params.offset,
      attributes: {
        exclude: params.excludeAttribute
      }
    });
  });

  it('should handle missing module parameter', async () => {
    const params = {
      from: new Date('2024-08-01'),
      to: new Date('2024-08-10'),
      searchText: 'test',
      limit: 10,
      offset: 0,
      corporateId: 1,
      excludeAttribute: ['someAttribute']
    };

    const tomorrow = new Date(params.to);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const expectedWhereClause = {
      createdAt: {
        [Op.between]: [params.from, tomorrow],
      },
      [Op.or]: [
        { id: { [Op.like]: `%${params.searchText}%` } },
        { issueType: { [Op.like]: `%${params.searchText}%` } },
        { module: { [Op.like]: `%${params.searchText}%` } },
        { description: { [Op.like]: `%${params.searchText}%` } },
      ],
      corporateUserId: params.corporateId,
    };

    const mockResult = {
      count: 1,
      rows: [{ id: 1, description: 'Test message' }]
    };
    messages.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findAllTickets(params);

    expect(result).toEqual(mockResult);
    expect(messages.findAndCountAll).toHaveBeenCalledWith({
      where: expectedWhereClause,
      limit: params.limit,
      order: [['createdAt', 'DESC']],
      offset: params.offset,
      attributes: {
        exclude: params.excludeAttribute
      }
    });
  });

  it('should handle errors gracefully', async () => {
  

    const error = new Error('Database error');
    messages.findAndCountAll.mockRejectedValue(error);

  
    await expect(findAllTickets({})).rejects.toThrow('Database error');
  });
});
