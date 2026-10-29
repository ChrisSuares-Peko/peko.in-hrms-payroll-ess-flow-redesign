const { createChatMessage } = require('../../support'); // Adjust path as needed
const messages = require('../../../entities/support');

jest.mock('../../../entities/support', () => ({
  findOne: jest.fn(),
  save: jest.fn(),
}));

jest.mock('../../../entities/corporateUser',()=>({
    hasMany: jest.fn()
}));


describe('createChatMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to avoid cluttering test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error
    console.error.mockRestore();
  });

  it('should create and save a chat message successfully', async () => {
    const mockSupport = {
      getDataValue: jest.fn().mockReturnValue([]), // Initial empty chats array
      setDataValue: jest.fn(),
      save: jest.fn(),
    };

    messages.findOne.mockResolvedValue(mockSupport);

    const params = {
      supportId: 1,
      message: 'Test message',
      isAdmin: true,
      date: new Date(),
      name: 'Admin',
    };

    const result = await createChatMessage(params);

    // Check that findOne was called with the correct parameters
    expect(messages.findOne).toHaveBeenCalledWith({
      where: {
        id: params.supportId,
      },
    });

    // Check that setDataValue was called with the updated chats array
    expect(mockSupport.setDataValue).toHaveBeenCalledWith('chats', [{
      message: params.message,
      name: params.name,
      admin: params.isAdmin,
      date: params.date,
    }]);

    // Check that save was called
    expect(mockSupport.save).toHaveBeenCalled();

    // Verify the function returns the updated support object
    expect(result).toEqual(mockSupport);
  });

  it('should throw an error if support is not found', async () => {
    messages.findOne.mockResolvedValue(null);

    const params = {
      supportId: 1,
      message: 'Test message',
      isAdmin: true,
      date: new Date(),
      name: 'Admin',
    };

    await expect(createChatMessage(params)).rejects.toThrow('Support not found');

    // Check that console.error was called with the correct message
    expect(console.error).toHaveBeenCalledWith("Error creating chat message:", new Error('Support not found'));
  });

  it('should handle errors during save', async () => {
    const mockSupport = {
      getDataValue: jest.fn().mockReturnValue([]),
      setDataValue: jest.fn(),
      save: jest.fn().mockRejectedValue(new Error('Save error')),
    };

    messages.findOne.mockResolvedValue(mockSupport);

    const params = {
      supportId: 1,
      message: 'Test message',
      isAdmin: true,
      date: new Date(),
      name: 'Admin',
    };

    await expect(createChatMessage(params)).rejects.toThrow('Save error');

    // Check that console.error was called with the correct message
    expect(console.error).toHaveBeenCalledWith("Error creating chat message:", new Error('Save error'));
  });
});
