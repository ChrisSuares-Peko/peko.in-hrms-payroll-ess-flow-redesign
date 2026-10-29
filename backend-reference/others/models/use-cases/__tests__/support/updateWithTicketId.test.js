const { updateWithTicketId } = require('../../support');
const messages = require('../../../entities/support');

jest.mock('../../../entities/support'); // Mock the messages entity

jest.mock('../../../entities/corporateUser',()=>({
    hasMany: jest.fn()
}));

describe('updateWithTicketId', () => {
  beforeEach(() => {
    // Reset mocks to avoid interference between tests
    jest.clearAllMocks();
  });

  it('should update a message with the correct ticketId and data', async () => {
    // Mocking messages.update to simulate a successful update
    messages.update.mockResolvedValue([1]); // Simulates one row affected

    const ticketId = 123;
    const data = {
      description: 'Updated description',
      status: 'RESOLVED',
    };

    const result = await updateWithTicketId(ticketId, data);

    expect(messages.update).toHaveBeenCalledWith(data, {
      where: {
        ticketId,
      },
    });
    expect(result).toEqual([1]); // Expect the result to match the mock
  });
});
