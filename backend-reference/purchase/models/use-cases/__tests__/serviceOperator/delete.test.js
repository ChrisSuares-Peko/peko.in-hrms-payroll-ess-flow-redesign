const { Delete } = require('../../serviceOperator'); 
const serviceOperator = require('../../../entities/serviceOperator');

jest.mock('../../../entities/serviceOperator', () => ({
  destroy: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

describe('Delete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a service operator successfully', async () => {
    const params = { serviceId: 1 };
    const mockResult = 1; 

    serviceOperator.destroy.mockResolvedValue(mockResult);

    const result = await Delete(params);

    expect(serviceOperator.destroy).toHaveBeenCalledWith({
      where: { serviceId: 1 },
    });

    expect(result).toEqual(mockResult);
  });

  it('should throw an error if destroy fails', async () => {
    const params = { serviceId: 1 };
    const error = new Error('DB Error');

    serviceOperator.destroy.mockRejectedValue(error);

    await expect(Delete(params)).rejects.toThrow(error);
  });
});
