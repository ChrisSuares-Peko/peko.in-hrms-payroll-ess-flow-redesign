const { allMessages } = require('../../support'); // Adjust path as needed
const messages = require('../../../entities/support');

jest.mock('../../../entities/support', () => ({
  findAll: jest.fn(),
}));

jest.mock('../../../entities/corporateUser',()=>({
    hasMany: jest.fn()
}));


describe('allMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.log to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.log
    console.log.mockRestore();
  });

  it('should retrieve all messages successfully', async () => {
    const mockMessages = [
      { id: 1, message: 'Message 1' },
      { id: 2, message: 'Message 2' },
    ];

    messages.findAll.mockResolvedValue(mockMessages);

    const result = await allMessages();

    expect(messages.findAll).toHaveBeenCalledWith({});
    expect(result).toEqual(mockMessages);
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('Database error');
    messages.findAll.mockRejectedValue(error);

    // Ensure the function under test handles the rejection
    await expect(allMessages()).resolves.toBeUndefined();

    // Check console.log to ensure the error was logged
    expect(console.log).toHaveBeenCalledWith(error);
  });

  it('should log a message after attempting to retrieve messages', async () => {
    const mockMessages = [
      { id: 1, message: 'Message 1' },
      { id: 2, message: 'Message 2' },
    ];

    messages.findAll.mockResolvedValue(mockMessages);

    await allMessages();

    // Check that the final log message is printed
    expect(console.log).toHaveBeenCalledWith("NOTIFICATION FIND ALL ROUTE CALLED");
  });
});
