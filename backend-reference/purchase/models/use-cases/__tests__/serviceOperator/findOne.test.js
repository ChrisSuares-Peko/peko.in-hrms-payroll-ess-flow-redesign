const { findOne } = require('../../serviceOperator'); 
const serviceOperator = require('../../../entities/serviceOperator');
const vendors = require('../../../entities/vendor'); 


jest.mock('../../../entities/serviceOperator', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../entities/vendor', () => ({}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

describe('findOne', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find a service operator with accessKey only', async () => {
    const params = { accessKey: 'ABC123' };
    const mockResult = { id: 1, accessKey: 'ABC123', serviceType: 'TYPE1' };

    serviceOperator.findOne.mockResolvedValue(mockResult);

    const result = await findOne(params);

    expect(serviceOperator.findOne).toHaveBeenCalledWith({
      include: [{
        model: vendors,
        attributes: ['apiUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5'],
      }],
      where: { accessKey: 'ABC123' },
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockResult);
  });

  it('should find a service operator with accessKey and serviceType', async () => {
    const params = { accessKey: 'ABC123', serviceType: 'TYPE1' };
    const mockResult = { id: 2, accessKey: 'ABC123', serviceType: 'TYPE1' };

    serviceOperator.findOne.mockResolvedValue(mockResult);

    const result = await findOne(params);

    expect(serviceOperator.findOne).toHaveBeenCalledWith({
      include: [{
        model: vendors,
        attributes: ['apiUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5'],
      }],
      where: { accessKey: 'ABC123', serviceType: 'TYPE1' },
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockResult);
  });

  it('should throw an error if findOne rejects', async () => {
    const params = { accessKey: 'ABC123' };
    const error = new Error('DB Error');

    serviceOperator.findOne.mockRejectedValue(error);

    await expect(findOne(params)).rejects.toThrow(error);
  });
});
