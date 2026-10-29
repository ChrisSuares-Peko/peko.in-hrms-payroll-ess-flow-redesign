const { findAllServiceOperator } = require('../../serviceOperator'); // Adjust the path as needed
const serviceOperator = require('../../../entities/serviceOperator');

jest.mock('../../../entities/serviceOperator', () => ({
  findAll: jest.fn(),
}));

describe('findAllServiceOperator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve all service operators with active status', async () => {
    const mockData = [
      { id: 1, name: 'Service Operator 1', serviceStatus: true },
      { id: 2, name: 'Service Operator 2', serviceStatus: true },
    ];

    serviceOperator.findAll.mockResolvedValue(mockData);

    const result = await findAllServiceOperator();

    expect(serviceOperator.findAll).toHaveBeenCalledWith({
      where: {
        serviceStatus: true,
      },
    });

    expect(result).toEqual(mockData);
  });

  it('should return an empty array if no active service operators are found', async () => {
    const mockData = [];

    serviceOperator.findAll.mockResolvedValue(mockData);

    const result = await findAllServiceOperator();

    expect(serviceOperator.findAll).toHaveBeenCalledWith({
      where: {
        serviceStatus: true,
      },
    });

    expect(result).toEqual(mockData);
  });

  it('should throw an error if an exception occurs', async () => {
    const mockError = new Error('Database error');

    serviceOperator.findAll.mockRejectedValue(mockError);

    await expect(findAllServiceOperator()).rejects.toThrow('Database error');

    expect(serviceOperator.findAll).toHaveBeenCalledWith({
      where: {
        serviceStatus: true,
      },
    });
  });
});
