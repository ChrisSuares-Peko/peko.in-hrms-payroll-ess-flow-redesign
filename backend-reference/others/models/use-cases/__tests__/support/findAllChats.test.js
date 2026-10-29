const { findAllChats } = require('../../support'); // Adjust path as needed
const messages = require('../../../entities/support');

jest.mock('../../../entities/support', () => ({
  findAll: jest.fn(),
}));

jest.mock('../../../entities/corporateUser', () => ({
  hasMany: jest.fn(),
}));

describe('findAllChats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve all chats for the given id', async () => {
    const mockChats = [
      { id: 1, message: 'Chat message 1', date: new Date() },
      { id: 1, message: 'Chat message 2', date: new Date() },
    ];

    messages.findAll.mockResolvedValue(mockChats);

    const id = 1;
    const result = await findAllChats(id);

    expect(messages.findAll).toHaveBeenCalledWith({
      where: {
        id: id,
      },
    });

    expect(result).toEqual(mockChats);
  });

  it('should return an empty array when no chats are found', async () => {
    messages.findAll.mockResolvedValue([]);

    const id = 1;
    const result = await findAllChats(id);

    expect(messages.findAll).toHaveBeenCalledWith({
      where: {
        id: id,
      },
    });

    expect(result).toEqual([]);
  });

  it('should handle invalid id input gracefully', async () => {
    const invalidId = undefined;
    const mockChats = [];

    messages.findAll.mockResolvedValue(mockChats);

    const result = await findAllChats(invalidId);

    expect(messages.findAll).toHaveBeenCalledWith({
      where: {
        id: invalidId,
      },
    });

    expect(result).toEqual(mockChats);
  });

  it('should handle errors gracefully', async () => {
    messages.findAll.mockRejectedValue(new Error('Database error'));

    const id = 1;

    await expect(findAllChats(id)).rejects.toThrow('Database error');
  });

  it('should handle multiple ids input', async () => {
    const mockChats = [
      { id: 1, message: 'Chat message 1', date: new Date() },
      { id: 2, message: 'Chat message 2', date: new Date() },
    ];

    messages.findAll.mockResolvedValue(mockChats);

    const ids = [1, 2];
    const result = await findAllChats(ids);

    expect(messages.findAll).toHaveBeenCalledWith({
      where: {
        id: ids,
      },
    });

    expect(result).toEqual(mockChats);
  });

  it('should return an empty array when findAll is called with an invalid query', async () => {
    messages.findAll.mockResolvedValue([]);

    const invalidQuery = {};
    const result = await findAllChats(invalidQuery);

    expect(messages.findAll).toHaveBeenCalledWith({
      where: {
        id: invalidQuery,
      },
    });

    expect(result).toEqual([]);
  });

});
