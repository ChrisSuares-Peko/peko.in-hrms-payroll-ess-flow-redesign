const { DeleteWithTicketId } = require('../../support'); 
const messages = require('../../../entities/support');

jest.mock('../../../entities/support'); // Mock the messages entity

jest.mock('../../../entities/corporateUser', () => ({
    hasMany: jest.fn(),
}));

describe('DeleteWithTicketId', () => {
  beforeEach(() => {
    // Reset mocks to avoid interference between tests
    jest.clearAllMocks();
  });

  it('should delete a message with the correct ticketId', async () => {
    // Mocking messages.destroy to simulate a successful deletion
    messages.destroy.mockResolvedValue(1); // Simulates one row deleted

    const ticketId = 456;

    const result = await DeleteWithTicketId(ticketId);

    expect(messages.destroy).toHaveBeenCalledWith({
      where: {
        ticketId: ticketId,
      },
    });
    expect(result).toBe(1); // Expect the result to match the mock
  });

  it('should return 0 if no message is deleted', async () => {
    // Mocking messages.destroy to simulate no rows deleted
    messages.destroy.mockResolvedValue(0); // Simulates no rows deleted

    const ticketId = 999;

    const result = await DeleteWithTicketId(ticketId);

    expect(messages.destroy).toHaveBeenCalledWith({
      where: {
        ticketId: ticketId,
      },
    });
    expect(result).toBe(0); // Expect 0 as no rows were deleted
  });

  it('should throw an error if destroy method fails', async () => {
    // Mocking messages.destroy to simulate a failure
    messages.destroy.mockRejectedValue(new Error('Database error'));

    const ticketId = 456;

    await expect(DeleteWithTicketId(ticketId)).rejects.toThrow('Database error');
    expect(messages.destroy).toHaveBeenCalledWith({
      where: {
        ticketId: ticketId,
      },
    });
  });

  it('should ignore additional parameters and only use ticketId', async () => {
    // Mocking messages.destroy to simulate a successful deletion
    messages.destroy.mockResolvedValue(1); // Simulates one row deleted

    const ticketId = 456;
    const extraParams = { irrelevantField: 'irrelevant' };

    const result = await DeleteWithTicketId(ticketId, extraParams);

    expect(messages.destroy).toHaveBeenCalledWith({
      where: {
        ticketId: ticketId,
      },
    });
    expect(result).toBe(1); // Expect the result to match the mock
  });

  it('should handle large numeric ticketId values', async () => {
    // Mocking messages.destroy to simulate a successful deletion
    messages.destroy.mockResolvedValue(1); // Simulates one row deleted

    const ticketId = 999999999999;

    const result = await DeleteWithTicketId(ticketId);

    expect(messages.destroy).toHaveBeenCalledWith({
      where: {
        ticketId: ticketId,
      },
    });
    expect(result).toBe(1); // Expect the result to match the mock
  });
});
