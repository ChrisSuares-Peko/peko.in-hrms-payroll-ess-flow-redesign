const { find } = require('../../serviceOperator'); // Adjust the path as needed
const serviceOperator = require('../../../entities/serviceOperator');
const { Op } = require('sequelize');

jest.mock('../../../entities/serviceOperator', () => ({
  findOne: jest.fn(),
}));

describe('find', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find a service operator with matching serviceProvider or accessKey', async () => {
    const mockParams = { serviceProvider: 'Test Provider', accessKey: 'testKey' };
    const mockResult = { id: 1, serviceProvider: 'Test Provider', accessKey: 'testKey' };

    serviceOperator.findOne.mockResolvedValue(mockResult);

    const result = await find(mockParams);

    // Verify `findOne` is called with correct parameters
    expect(serviceOperator.findOne).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          { serviceProvider: mockParams.serviceProvider },
          { accessKey: mockParams.accessKey },
        ],
      },
      raw: true,
    });

    // Validate the result
    expect(result).toEqual(mockResult);
  });

  it('should return null if no service operator matches the criteria', async () => {
    const mockParams = { serviceProvider: 'Nonexistent Provider', accessKey: 'invalidKey' };

    serviceOperator.findOne.mockResolvedValue(null);

    const result = await find(mockParams);

    // Verify `findOne` is called with correct parameters
    expect(serviceOperator.findOne).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          { serviceProvider: mockParams.serviceProvider },
          { accessKey: mockParams.accessKey },
        ],
      },
      raw: true,
    });

    // Validate the result
    expect(result).toBeNull();
  });

  it('should handle errors during the database operation', async () => {
    const mockParams = { serviceProvider: 'Test Provider', accessKey: 'testKey' };
    const mockError = new Error('Database error');

    serviceOperator.findOne.mockRejectedValue(mockError);

    await expect(find(mockParams)).rejects.toThrow('Database error');

    // Verify `findOne` is called with correct parameters
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
