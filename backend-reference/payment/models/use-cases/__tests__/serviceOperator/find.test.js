const { find } = require('../../serviceOperator'); // Replace with the correct path
const serviceOperator = require('../../../entities/serviceOperator'); // Replace with the correct path
const { Op } = require('sequelize');

jest.mock('../../../entities/serviceOperator'); // Mock the serviceOperator model

describe('find function', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks between tests
  });

  it('should return a matching service operator when found', async () => {
    const mockParams = {
      serviceProvider: 'Test Provider',
      accessKey: '12345',
    };

    const mockResponse = {
      id: 1,
      serviceProvider: 'Test Provider',
      accessKey: '12345',
    };

    // Mock response from serviceOperator.findOne
    serviceOperator.findOne.mockResolvedValue(mockResponse);

    // Call the function
    const result = await find(mockParams);

    // Assertions
    expect(serviceOperator.findOne).toHaveBeenCalledTimes(1);
    expect(serviceOperator.findOne).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          { serviceProvider: mockParams.serviceProvider },
          { accessKey: mockParams.accessKey },
        ],
      },
      raw: true,
    });
    expect(result).toEqual(mockResponse);
  });

  it('should return null when no matching service operator is found', async () => {
    const mockParams = {
      serviceProvider: 'Nonexistent Provider',
      accessKey: '67890',
    };

    // Mock response from serviceOperator.findOne
    serviceOperator.findOne.mockResolvedValue(null);

    // Call the function
    const result = await find(mockParams);

    // Assertions
    expect(serviceOperator.findOne).toHaveBeenCalledTimes(1);
    expect(serviceOperator.findOne).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          { serviceProvider: mockParams.serviceProvider },
          { accessKey: mockParams.accessKey },
        ],
      },
      raw: true,
    });
    expect(result).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    const mockParams = {
      serviceProvider: 'Test Provider',
      accessKey: '12345',
    };

    const mockError = new Error('Database error');

    // Mock error from serviceOperator.findOne
    serviceOperator.findOne.mockRejectedValue(mockError);

    // Call the function and verify it throws the error
    await expect(find(mockParams)).rejects.toThrow('Database error');

    // Assertions
    expect(serviceOperator.findOne).toHaveBeenCalledTimes(1);
    expect(serviceOperator.findOne).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          { serviceProvider: mockParams.serviceProvider },
          { accessKey: mockParams.accessKey },
        ],
      },
      raw: true,
    });
  });
});
