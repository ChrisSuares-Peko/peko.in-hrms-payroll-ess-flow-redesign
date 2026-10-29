const corporateUser = require('../../../entities/corporateUser');
const { updateStatus } = require('../../corporateUser');

jest.mock('../../../entities/corporateUser', () => ({
  update: jest.fn(), // Mocking the `update` method
}));

describe('updating the status', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear any previous mocks before each test
  });

  it('should successfully update status', async () => {
    const req = {
      params: { id: 1 },
      body: { isActive: false },
    };

    const mockUpdateResult = [1]; // Mock result from update method

    // Mocking update method to resolve with the mockUpdateResult
    corporateUser.update.mockResolvedValue(mockUpdateResult);

    const result = await updateStatus(req);

    // Check that the update method was called with correct arguments
    expect(corporateUser.update).toHaveBeenCalledWith(
      { isActive: false },
      { where: { id: 1 } }
    );
    expect(result).toEqual(mockUpdateResult);
  });

  it('should handle missing id in params gracefully', async () => {
    const req = {
      params: {}, // Empty params (missing id)
      body: { isActive: false },
    };

    const mockUpdateResult = [0]; // Mock result when update doesn't affect any rows

    corporateUser.update.mockResolvedValue(mockUpdateResult);

    const result = await updateStatus(req);

    // Check that the update method was called with id as undefined
    expect(corporateUser.update).toHaveBeenCalledWith(
      { isActive: false },
      { where: { id: undefined } }
    );

    expect(result).toBe(mockUpdateResult);
  });

  it('should handle missing data in body', async () => {
    const req = {
      params: { id: 1 },
      body: {}, // Empty body (missing data to update)
    };

    const mockUpdateResult = [0]; // Mock result when update doesn't affect any rows

    corporateUser.update.mockResolvedValue(mockUpdateResult);

    const result = await updateStatus(req);

    // Check that the update method was called with an empty object as data
    expect(corporateUser.update).toHaveBeenCalledWith(
      {},
      { where: { id: 1 } }
    );
    expect(result).toEqual(mockUpdateResult);
  });

  it('should handle errors during update', async () => {
    const req = {
      params: { id: 1 },
      body: { isActive: false },
    };

    const mockError = new Error('Update failed');
    corporateUser.update.mockRejectedValue(mockError); // Simulate an error in the update method

    // Expect the error to be thrown when calling the updateStatus function
    await expect(updateStatus(req)).rejects.toThrow('Update failed');
  });
});
