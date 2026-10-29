const { find } = require('../../serviceOperator'); 
const serviceOperator = require('../../../entities/serviceOperator');
const { Op } = require('sequelize');

jest.mock('../../../entities/serviceOperator', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

describe('find', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find a service operator by serviceProvider or accessKey', async () => {
    const params = { serviceProvider: 'ServiceA', accessKey: 'ABC123' };
    const mockResult = { id: 1, serviceProvider: 'ServiceA', accessKey: 'ABC123' };

    serviceOperator.findOne.mockResolvedValue(mockResult);

    const result = await find(params);

    expect(serviceOperator.findOne).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          { serviceProvider: params.serviceProvider },
          { accessKey: params.accessKey },
        ],
      },
      raw: true,
    });

    expect(result).toEqual(mockResult);
  });

  it('should throw an error if findOne fails', async () => {
    const params = { serviceProvider: 'ServiceA', accessKey: 'ABC123' };
    const error = new Error('DB Error');

    serviceOperator.findOne.mockRejectedValue(error);

    await expect(find(params)).rejects.toThrow(error);
  });
});
