const { findOneServiceOperatorForLimits } = require('../../serviceOperator');
const serviceOperator = require('../../../entities/serviceOperator');

jest.mock('../../../entities/serviceOperator', () => ({
  findOne: jest.fn(),
}));

describe('findOneServiceOperatorForLimits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return service operator with limited attributes when found', async () => {
    const mockParams = { accessKey: 'AK123' };
    const mockResult = { id: 1, accessKey: 'AK123', serviceProvider: 'Airtel', vendor: { apiUrl: 'http://api.com', optional1: 'opt1' } };

    serviceOperator.findOne.mockResolvedValue(mockResult);

    const result = await findOneServiceOperatorForLimits(mockParams);

    expect(serviceOperator.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { accessKey: 'AK123' },
        attributes: ['id', 'accessKey', 'serviceProvider'],
        raw: true,
        nest: true,
      })
    );
    expect(result).toEqual(mockResult);
  });

  it('should add serviceType to where clause when provided', async () => {
    const mockParams = { accessKey: 'AK123', serviceType: 'PREPAID' };

    serviceOperator.findOne.mockResolvedValue(null);

    await findOneServiceOperatorForLimits(mockParams);

    expect(serviceOperator.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { accessKey: 'AK123', serviceType: 'PREPAID' },
      })
    );
  });

  it('should return null when not found', async () => {
    serviceOperator.findOne.mockResolvedValue(null);

    const result = await findOneServiceOperatorForLimits({ accessKey: 'NONE' });

    expect(result).toBeNull();
  });

  it('should throw error when DB fails', async () => {
    serviceOperator.findOne.mockRejectedValue(new Error('DB Error'));

    await expect(findOneServiceOperatorForLimits({ accessKey: 'AK' })).rejects.toThrow('DB Error');
  });
});
