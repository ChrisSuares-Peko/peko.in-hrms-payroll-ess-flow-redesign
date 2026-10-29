const corporateUser = require('../../../entities/corporateUser')
const { findAll } = require('../../corporateUser')
jest.mock('../../../entities/corporateUser'); // Mock corporateUser model

describe('findAll function', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks between tests
  });

  it('should successfully retrieve corporate users by ID', async () => {
    // Mock parameters
    const mockParams = { id: 1 };

    // Mock response from corporateUser.findAll
    const mockResponse = [
      { id: 1, name: 'Corporate User 1' },
      { id: 1, name: 'Corporate User 2' },
    ];

    corporateUser.findAll.mockResolvedValue(mockResponse);

    // Call the function
    const result = await findAll(mockParams);

    // Assertions
    expect(corporateUser.findAll).toHaveBeenCalledTimes(1);
    expect(corporateUser.findAll).toHaveBeenCalledWith({
      where: { id: mockParams.id },
    });
    expect(result).toEqual(mockResponse);
  });

  it('should throw an error if corporateUser.findAll fails', async () => {
    // Mock parameters
    const mockParams = { id: 1 };

    // Mock error from corporateUser.findAll
    const mockError = new Error('Database error');
    corporateUser.findAll.mockRejectedValue(mockError);

    // Assertions
    await expect(findAll(mockParams)).rejects.toThrow('Database error');
    expect(corporateUser.findAll).toHaveBeenCalledTimes(1);
    expect(corporateUser.findAll).toHaveBeenCalledWith({
      where: { id: mockParams.id },
    });
  });

  it('should return an empty array if no corporate users are found', async () => {
    // Mock parameters
    const mockParams = { id: 999 }; // ID that doesn't exist

    // Mock response from corporateUser.findAll
    const mockResponse = [];
    corporateUser.findAll.mockResolvedValue(mockResponse);

    // Call the function
    const result = await findAll(mockParams);

    // Assertions
    expect(corporateUser.findAll).toHaveBeenCalledTimes(1);
    expect(corporateUser.findAll).toHaveBeenCalledWith({
      where: { id: mockParams.id },
    });
    expect(result).toEqual(mockResponse);
  });

  it('should handle invalid input gracefully', async () => {
    // Mock invalid parameters
    const mockParams = null;

    // Assertions
    await expect(findAll(mockParams)).rejects.toThrow();
    expect(corporateUser.findAll).not.toHaveBeenCalled();
  });
});
