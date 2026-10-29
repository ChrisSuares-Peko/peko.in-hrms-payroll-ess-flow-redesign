const { updateStatus } = require('../../serviceOperator'); // Adjust the path as needed
const serviceOperator = require('../../../entities/serviceOperator');

jest.mock('../../../entities/serviceOperator', () => ({
  update: jest.fn(),
}));

describe('updateStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update the status of a service operator with the provided data', async () => {
    const mockParams = { id: 1 };
    const mockData = { serviceStatus: true };
    const mockResult = [1]; // Sequelize update method returns an array with the number of affected rows

    serviceOperator.update.mockResolvedValue(mockResult);

    const result = await updateStatus(mockParams, mockData);

    expect(serviceOperator.update).toHaveBeenCalledWith(mockData, {
      where: { id: mockParams.id },
    });

    expect(result).toEqual(mockResult);
  });

  it('should return 0 if no rows are updated', async () => {
    const mockParams = { id: 999 };
    const mockData = { serviceStatus: false };
    const mockResult = [0]; // No rows affected

    serviceOperator.update.mockResolvedValue(mockResult);

    const result = await updateStatus(mockParams, mockData);

    expect(serviceOperator.update).toHaveBeenCalledWith(mockData, {
      where: { id: mockParams.id },
    });

    expect(result).toEqual(mockResult);
  });

  it('should throw an error if the update fails', async () => {
    const mockParams = { id: 1 };
    const mockData = { serviceStatus: true };
    const mockError = new Error('Database error');

    serviceOperator.update.mockRejectedValue(mockError);

    await expect(updateStatus(mockParams, mockData)).rejects.toThrow(
      'Database error'
    );

    expect(serviceOperator.update).toHaveBeenCalledWith(mockData, {
      where: { id: mockParams.id },
    });
  });
});
