const { findServiceOperatorOnAccesskey } = require('../../serviceOperator'); 
const serviceOperator = require('../../../entities/serviceOperator');

jest.mock('../../../entities/serviceOperator', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

describe('findServiceOperatorOnAccesskey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find a service operator by accessKey', async () => {
    const accessKey = 'ABC123';
    const mockResult = { id: 1, accessKey: 'ABC123', serviceProvider: 'Service A' };

    serviceOperator.findOne.mockResolvedValue(mockResult);

    const result = await findServiceOperatorOnAccesskey(accessKey);

    expect(serviceOperator.findOne).toHaveBeenCalledWith({
      where: { accessKey },
    });

    expect(result).toEqual(mockResult);
  });

  it('should throw an error if findOne fails', async () => {
    const accessKey = 'ABC123';
    const error = new Error('DB Error');

    serviceOperator.findOne.mockRejectedValue(error);

    await expect(findServiceOperatorOnAccesskey(accessKey)).rejects.toThrow(error);
  });
});
