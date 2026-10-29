const { findAllServiceOperator } = require('../../serviceOperator'); // Replace with the correct path
const serviceOperator = require('../../../entities/serviceOperator'); // Replace with the correct path

jest.mock('../../../entities/serviceOperator'); // Mock the serviceOperator model

describe('findAllServiceOperator function', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks between tests
  });

  it('should return all active service operators', async () => {
    // Mock response from serviceOperator.findAll
    const mockResponse = [
      { id: 1, name: 'Operator 1', serviceStatus: true },
      { id: 2, name: 'Operator 2', serviceStatus: true },
    ];
    serviceOperator.findAll.mockResolvedValue(mockResponse);

    // Call the function
    const result = await findAllServiceOperator();

    // Assertions
    expect(serviceOperator.findAll).toHaveBeenCalledTimes(1);
    expect(serviceOperator.findAll).toHaveBeenCalledWith({
      where: { serviceStatus: true },
    });
    expect(result).toEqual(mockResponse);
  });

  it('should handle errors gracefully', async () => {
    // Mock error
    const mockError = new Error('Database error');
    serviceOperator.findAll.mockRejectedValue(mockError);

    // Call the function and verify the error is thrown
    await expect(findAllServiceOperator()).rejects.toThrow('Database error');

    // Assertions
    expect(serviceOperator.findAll).toHaveBeenCalledTimes(1);
    expect(serviceOperator.findAll).toHaveBeenCalledWith({
      where: { serviceStatus: true },
    });
  });
});
