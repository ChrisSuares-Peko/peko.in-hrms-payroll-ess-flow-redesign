const { Delete } = require('../../support'); 
const messages = require('../../../entities/support');

jest.mock('../../../entities/support'); // Mock the messages entity

jest.mock('../../../entities/corporateUser', () => ({
    hasMany: jest.fn(),
}));

describe('Delete', () => {
  beforeEach(() => {
    // Reset mocks to avoid interference between tests
    jest.clearAllMocks();
  });

  it('should delete a message with the correct id', async () => {
    // Mocking messages.destroy to simulate a successful deletion
    messages.destroy.mockResolvedValue(1); // Simulates one row deleted

    const params = { id: 123 };

    const result = await Delete(params);

    expect(messages.destroy).toHaveBeenCalledWith({
      where: { id: params.id },
    });
    expect(result).toBe(1); // Expect the result to match the mock
  });

  it('should return 0 if no message is deleted', async () => {
    // Mocking messages.destroy to simulate no rows deleted
    messages.destroy.mockResolvedValue(0); // Simulates no rows deleted

    const params = { id: 999 };

    const result = await Delete(params);

    expect(messages.destroy).toHaveBeenCalledWith({
      where: { id: params.id },
    });
    expect(result).toBe(0); // Expect 0 as no rows were deleted
  });

  it('should throw an error if destroy method fails', async () => {
    // Mocking messages.destroy to simulate a failure
    messages.destroy.mockRejectedValue(new Error('Database error'));

    const params = { id: 123 };

    await expect(Delete(params)).rejects.toThrow('Database error');
    expect(messages.destroy).toHaveBeenCalledWith({
      where: { id: params.id },
    });
  });

  it('should ignore additional parameters and only use id', async () => {
    // Mocking messages.destroy to simulate a successful deletion
    messages.destroy.mockResolvedValue(1); // Simulates one row deleted

    const params = {
      id: 123,
      irrelevantField: 'irrelevant',
    };

    const result = await Delete(params);

    expect(messages.destroy).toHaveBeenCalledWith({
      where: { id: params.id },
    });
    expect(result).toBe(1); // Expect the result to match the mock
  });

  it('should handle the case when id is a very large number', async () => {
    // Mocking messages.destroy to simulate a successful deletion
    messages.destroy.mockResolvedValue(1); // Simulates one row deleted

    const params = { id: 999999999999 };

    const result = await Delete(params);

    expect(messages.destroy).toHaveBeenCalledWith({
      where: { id: params.id },
    });
    expect(result).toBe(1); // Expect the result to match the mock
  });
});
