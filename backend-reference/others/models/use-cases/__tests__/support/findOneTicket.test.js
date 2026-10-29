const { findOneTicket } = require('../../support'); // Adjust path as needed
const messages = require('../../../entities/support');

jest.mock('../../../entities/support', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../entities/corporateUser',()=>({
    hasMany: jest.fn()
}));

describe('findOneTicket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the correct ticket for the given id', async () => {
    const mockTicket = {
      id: 1,
      issueType: 'Issue Type 1',
      module: 'Module 1',
      description: 'Description 1',
      createdAt: new Date(),
    };

    messages.findOne.mockResolvedValue(mockTicket);

    const params = { id: 1 };
    const result = await findOneTicket(params);

    expect(messages.findOne).toHaveBeenCalledWith({
      where: {
        id: params.id,
      },
    });

    expect(result).toEqual(mockTicket);
  });

  it('should return null if no ticket is found for the given id', async () => {
    messages.findOne.mockResolvedValue(null);

    const params = { id: 999 };
    const result = await findOneTicket(params);

    expect(messages.findOne).toHaveBeenCalledWith({
      where: {
        id: params.id,
      },
    });

    expect(result).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    messages.findOne.mockRejectedValue(new Error('Database error'));

    const params = { id: 1 };

    await expect(findOneTicket(params)).rejects.toThrow('Database error');
  });

  it('should return the correct ticket with different id', async () => {
    const mockTicket = {
      id: 2,
      issueType: 'Issue Type 2',
      module: 'Module 2',
      description: 'Description 2',
      createdAt: new Date(),
    };

    messages.findOne.mockResolvedValue(mockTicket);

    const params = { id: 2 };
    const result = await findOneTicket(params);

    expect(messages.findOne).toHaveBeenCalledWith({
      where: {
        id: params.id,
      },
    });

    expect(result).toEqual(mockTicket);
  });
});
