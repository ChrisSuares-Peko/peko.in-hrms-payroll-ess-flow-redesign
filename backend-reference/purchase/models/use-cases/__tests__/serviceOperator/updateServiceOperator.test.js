const { updateServiceOperator } = require('../../serviceOperator'); 
const serviceOperator = require('../../../entities/serviceOperator');

jest.mock('../../../entities/serviceOperator', () => ({
  update: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

describe('updateServiceOperator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update a service operator successfully', async () => {
    const params = { id: 1 };
    const data = { serviceProvider: 'Updated Service' };
    const mockResult = [1]; 

    serviceOperator.update.mockResolvedValue(mockResult);

    const result = await updateServiceOperator(params, data);

    expect(serviceOperator.update).toHaveBeenCalledWith(data, {
      where: { id: 1 },
    });

    expect(result).toEqual(mockResult);
  });

  it('should throw an error if update fails', async () => {
    const params = { id: 1 };
    const data = { serviceProvider: 'Updated Service' };
    const error = new Error('DB Error');

    serviceOperator.update.mockRejectedValue(error);

    await expect(updateServiceOperator(params, data)).rejects.toThrow(error);
  });
});
