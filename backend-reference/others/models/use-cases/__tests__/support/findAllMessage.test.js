const { findAllMessage } = require('../../support');
const messages = require('../../../entities/support');
const { Op } = require('sequelize');

jest.mock('../../../entities/support', () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock('../../../entities/corporateUser', () => ({
  findOne: jest.fn(),
  hasMany: jest.fn(),
}));

jest.mock('../../../entities/systemUser', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../entities/credential', () => ({
  findOne: jest.fn(),
  hasMany: jest.fn(),
}));

describe('findAllMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should find and count all messages with the correct where clause', async () => {
    const params = {
      from: new Date('2024-08-01'),
      to: new Date('2024-08-10'),
      limit: 10,
      offset: 0,
      searchText: 'test',
      sort: 'ASC',
      column: 'createdAt',
      status: 'open',
      corporateId: 1,
      module: 'testModule',
    };

  
    const mockResult = { count: 1, rows: [{ id: 1, description: 'Test message' }] };
    messages.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findAllMessage(params);

    expect(result).toEqual(mockResult);
    expect(messages.findAndCountAll).toHaveBeenCalledWith(
  expect.objectContaining({
    include: expect.any(Array), // since includes contain extra fields
    where: expect.objectContaining({
      createdAt: expect.any(Object),
      [Op.or]: expect.any(Array),
      status: 'open',
      corporateUserId: 1,
      module: { [Op.like]: '%testModule%' },
    }),
    order: [['createdAt', 'ASC']],
    limit: 10,
    offset: 0,
  })
);

  });

  it('should handle errors gracefully', async () => {
    const params = {
      from: new Date('2024-08-01'),
      to: new Date('2024-08-10'),
    };

    messages.findAndCountAll.mockRejectedValue(new Error('Database error'));

    const result = await findAllMessage(params);

    expect(result).toBeUndefined();
    expect(console.log).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should handle missing optional parameters', async () => {
    const params = {
      from: new Date('2024-08-01'),
      to: new Date('2024-08-10'),
      limit: 10,
      offset: 0,
      searchText: 'test',
      sort: 'ASC',
      column: 'createdAt',
    };

    const mockResult = { count: 1, rows: [{ id: 1, description: 'Test message' }] };
    messages.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findAllMessage(params);

    expect(result).toEqual(mockResult);
    expect(messages.findAndCountAll).toHaveBeenCalledWith(
  expect.objectContaining({
    include: expect.any(Array), // we don't assert exact include, because it has extra fields
    where: expect.objectContaining({
      createdAt: expect.any(Object),
      [Op.or]: expect.any(Array),
    }),
    order: [['createdAt', 'ASC']],
    limit: 10,
    offset: 0,
  })
);

  });

  it('should handle when status is "all"', async () => {
    const params = {
      from: new Date('2024-08-01'),
      to: new Date('2024-08-10'),
      limit: 10,
      offset: 0,
      searchText: 'test',
      sort: 'ASC',
      column: 'createdAt',
      status: 'all',
      corporateId: 1,
      module: 'testModule',
    };

    const mockResult = { count: 1, rows: [{ id: 1, description: 'Test message' }] };
    messages.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findAllMessage(params);

    expect(result).toEqual(mockResult);
   expect(messages.findAndCountAll).toHaveBeenCalledWith(
  expect.objectContaining({
    include: expect.any(Array), // Do not deep match commonInclude
    where: expect.objectContaining({
      corporateUserId: 1,
      module: expect.objectContaining({
        [Op.like]: `%${params.module}%`,
      }),
      createdAt: expect.any(Object), // Date range check separately
      [Op.or]: expect.any(Array),
    }),
    order: [['createdAt', 'ASC']],
    limit: 10,
    offset: 0,
  })
);

  });

  it('should handle when corporateId is not provided', async () => {
    const params = {
      from: new Date('2024-08-01'),
      to: new Date('2024-08-10'),
      limit: 10,
      offset: 0,
      searchText: 'test',
      sort: 'ASC',
      column: 'createdAt',
      status: 'open',
      module: 'testModule',
    };

  

    const mockResult = { count: 1, rows: [{ id: 1, description: 'Test message' }] };
    messages.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findAllMessage(params);

    expect(result).toEqual(mockResult);
   expect(messages.findAndCountAll).toHaveBeenCalledWith(
  expect.objectContaining({
    include: expect.any(Array),
    where: expect.objectContaining({
      status: 'open',
      module: expect.objectContaining({
        [Op.like]: `%${params.module}%`,
      }),
      createdAt: expect.any(Object),
      [Op.or]: expect.any(Array),
    }),
    order: [['createdAt', 'ASC']],
    limit: 10,
    offset: 0,
  })
);

  });
});
