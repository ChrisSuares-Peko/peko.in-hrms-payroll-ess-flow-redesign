const { fetchServiceOperator } = require('../../serviceOperator'); // Adjust the path as needed
const serviceOperator = require('../../../entities/serviceOperator');
const { Op } = require('sequelize');

jest.mock('../../../entities/serviceOperator', () => ({
  findAll: jest.fn(),
}));

describe('fetchServiceOperator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch service operators matching the query', async () => {
    const mockQuery = 'test';
    const mockData = [
      { id: 1, serviceProvider: 'Test Operator A' },
      { id: 2, serviceProvider: 'Test Operator B' },
    ];

    serviceOperator.findAll.mockResolvedValue(mockData);

    const result = await fetchServiceOperator(mockQuery);

    // Verify `findAll` is called with correct parameters
    expect(serviceOperator.findAll).toHaveBeenCalledWith({
      where: {
        serviceProvider: {
          [Op.like]: `%${mockQuery}%`,
        },
        serviceStatus: true,
      },
      order: [['serviceProvider', 'ASC']],
      attributes: ['id', 'serviceProvider', 'serviceCategory'],
    });

    // Validate the result
    expect(result).toEqual(mockData);
  });

  it('should return an empty array if no service operators match the query', async () => {
    const mockQuery = 'nonexistent';
    const mockData = [];

    serviceOperator.findAll.mockResolvedValue(mockData);

    const result = await fetchServiceOperator(mockQuery);

    // Verify `findAll` is called with correct parameters
    expect(serviceOperator.findAll).toHaveBeenCalledWith({
      where: {
        serviceProvider: {
          [Op.like]: `%${mockQuery}%`,
        },
        serviceStatus: true,
      },
      order: [['serviceProvider', 'ASC']],
      attributes: ['id', 'serviceProvider', 'serviceCategory'],
    });

    // Validate the result
    expect(result).toEqual([]);
  });

  it('should handle errors during fetch', async () => {
    const mockQuery = 'test';
    const mockError = new Error('Database error');

    serviceOperator.findAll.mockRejectedValue(mockError);

    await expect(fetchServiceOperator(mockQuery)).rejects.toThrow('Database error');

    // Verify `findAll` is called with correct parameters
    expect(serviceOperator.findAll).toHaveBeenCalledWith({
      where: {
        serviceProvider: {
          [Op.like]: `%${mockQuery}%`,
        },
        serviceStatus: true,
      },
      order: [['serviceProvider', 'ASC']],
      attributes: ['id', 'serviceProvider', 'serviceCategory'],
    });
  });
});
