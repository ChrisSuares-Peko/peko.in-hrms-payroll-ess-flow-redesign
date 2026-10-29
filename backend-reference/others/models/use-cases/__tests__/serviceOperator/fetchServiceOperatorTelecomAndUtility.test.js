const { fetchServiceOperatorTelecomAndUtility } = require('../../serviceOperator'); // Adjust the path as needed
const serviceOperator = require('../../../entities/serviceOperator');
const { Op } = require('sequelize');

jest.mock('../../../entities/serviceOperator', () => ({
  findAll: jest.fn(),
}));

describe('fetchServiceOperatorTelecomAndUtility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch service operators matching query and category conditions', async () => {
    const mockQuery = 'Test';
    const mockResult = [
      { id: 1, serviceProvider: 'Test Telecom', serviceCategory: 'Telecom Payments' },
      { id: 2, serviceProvider: 'Test Utility', serviceCategory: 'Utility Payments' },
    ];

    serviceOperator.findAll.mockResolvedValue(mockResult);

    const result = await fetchServiceOperatorTelecomAndUtility(mockQuery);

    // Verify `findAll` is called with the correct parameters
    expect(serviceOperator.findAll).toHaveBeenCalledWith({
      where: {
        serviceProvider: {
          [Op.like]: `%${mockQuery}%`,
        },
        serviceStatus: true,
        [Op.or]: [
          { serviceCategory: 'Telecom Payments' },
          { serviceCategory: 'Utility Payments' },
        ],
      },
      attributes: ['id', 'serviceProvider', 'serviceCategory'],
    });

    // Validate the result
    expect(result).toEqual(mockResult);
  });

  it('should return an empty array if no service operators match the query or category conditions', async () => {
    const mockQuery = 'Nonexistent';
    const mockResult = [];

    serviceOperator.findAll.mockResolvedValue(mockResult);

    const result = await fetchServiceOperatorTelecomAndUtility(mockQuery);

    // Verify `findAll` is called with the correct parameters
    expect(serviceOperator.findAll).toHaveBeenCalledWith({
      where: {
        serviceProvider: {
          [Op.like]: `%${mockQuery}%`,
        },
        serviceStatus: true,
        [Op.or]: [
          { serviceCategory: 'Telecom Payments' },
          { serviceCategory: 'Utility Payments' },
        ],
      },
      attributes: ['id', 'serviceProvider', 'serviceCategory'],
    });

    // Validate the result
    expect(result).toEqual(mockResult);
  });

  it('should handle errors during the database operation', async () => {
    const mockQuery = 'Test';
    const mockError = new Error('Database error');

    serviceOperator.findAll.mockRejectedValue(mockError);

    await expect(fetchServiceOperatorTelecomAndUtility(mockQuery)).rejects.toThrow('Database error');

    // Verify `findAll` is called with the correct parameters
    expect(serviceOperator.findAll).toHaveBeenCalledWith({
      where: {
        serviceProvider: {
          [Op.like]: `%${mockQuery}%`,
        },
        serviceStatus: true,
        [Op.or]: [
          { serviceCategory: 'Telecom Payments' },
          { serviceCategory: 'Utility Payments' },
        ],
      },
      attributes: ['id', 'serviceProvider', 'serviceCategory'],
    });
  });
});
