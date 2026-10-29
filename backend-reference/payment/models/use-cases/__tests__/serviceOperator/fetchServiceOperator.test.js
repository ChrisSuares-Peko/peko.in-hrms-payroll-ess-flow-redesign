const { fetchServiceOperator } = require('../../serviceOperator'); // Replace with the correct path
const serviceOperator = require('../../../entities/serviceOperator'); // Replace with the correct path
const { Op } = require('sequelize');

jest.mock('../../../entities/serviceOperator'); // Mock the serviceOperator model

describe('fetchServiceOperator function', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks between tests
  });

  it('should return a filtered list of service operators', async () => {
    const mockQuery = 'provider';
    const mockResponse = [
      { id: 1, serviceProvider: 'Service Provider 1' },
      { id: 2, serviceProvider: 'Service Provider 2' },
    ];

    // Mock response from serviceOperator.findAll
    serviceOperator.findAll.mockResolvedValue(mockResponse);

    // Call the function
    const result = await fetchServiceOperator(mockQuery);

    // Assertions
    expect(serviceOperator.findAll).toHaveBeenCalledTimes(1);
    expect(serviceOperator.findAll).toHaveBeenCalledWith({
      where: {
        serviceProvider: {
          [Op.like]: `%${mockQuery}%`,
        },
        serviceStatus: true,
      },
      attributes: ['id', 'serviceProvider'],
    });
    expect(result).toEqual(mockResponse);
  });

  it('should return an empty array if no service operators match', async () => {
    const mockQuery = 'nonexistent';
    const mockResponse = [];

    // Mock response from serviceOperator.findAll
    serviceOperator.findAll.mockResolvedValue(mockResponse);

    // Call the function
    const result = await fetchServiceOperator(mockQuery);

    // Assertions
    expect(serviceOperator.findAll).toHaveBeenCalledTimes(1);
    expect(serviceOperator.findAll).toHaveBeenCalledWith({
      where: {
        serviceProvider: {
          [Op.like]: `%${mockQuery}%`,
        },
        serviceStatus: true,
      },
      attributes: ['id', 'serviceProvider'],
    });
    expect(result).toEqual(mockResponse);
  });

  it('should handle errors gracefully', async () => {
    const mockQuery = 'provider';
    const mockError = new Error('Database error');

    // Mock error from serviceOperator.findAll
    serviceOperator.findAll.mockRejectedValue(mockError);

    // Call the function and verify it throws the error
    await expect(fetchServiceOperator(mockQuery)).rejects.toThrow('Database error');

    // Assertions
    expect(serviceOperator.findAll).toHaveBeenCalledTimes(1);
    expect(serviceOperator.findAll).toHaveBeenCalledWith({
      where: {
        serviceProvider: {
          [Op.like]: `%${mockQuery}%`,
        },
        serviceStatus: true,
      },
      attributes: ['id', 'serviceProvider'],
    });
  });
});
