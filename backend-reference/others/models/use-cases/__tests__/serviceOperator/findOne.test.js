const { findOne } = require('../../serviceOperator'); // Adjust the path as needed
const serviceOperator = require('../../../entities/serviceOperator');
const vendors = require('../../../entities/vendor');

jest.mock('../../../entities/serviceOperator', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../entities/vendor', () => ({
  attributes: ['apiUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5'],
}));

describe('findOne', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find a service operator with accessKey and serviceType', async () => {
    const mockParams = { accessKey: 'testKey', serviceType: 'testService' };
    const mockResult = {
      id: 1,
      accessKey: 'testKey',
      serviceType: 'testService',
      vendor: {
        apiUrl: 'https://example.com',
        optional1: 'opt1',
        optional2: 'opt2',
        optional3: 'opt3',
        optional4: 'opt4',
        optional5: 'opt5',
      },
    };

    serviceOperator.findOne.mockResolvedValue(mockResult);

    const result = await findOne(mockParams);

    expect(serviceOperator.findOne).toHaveBeenCalledWith({
      include: [
        {
          model: vendors,
          attributes: ['apiUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5'],
        },
      ],
      where: {
        accessKey: mockParams.accessKey,
        serviceType: mockParams.serviceType,
      },
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockResult);
  });

  it('should find a service operator with accessKey only', async () => {
    const mockParams = { accessKey: 'testKey' };
    const mockResult = {
      id: 2,
      accessKey: 'testKey',
      vendor: {
        apiUrl: 'https://example.com',
        optional1: 'opt1',
        optional2: 'opt2',
        optional3: 'opt3',
        optional4: 'opt4',
        optional5: 'opt5',
      },
    };

    serviceOperator.findOne.mockResolvedValue(mockResult);

    const result = await findOne(mockParams);

    expect(serviceOperator.findOne).toHaveBeenCalledWith({
      include: [
        {
          model: vendors,
          attributes: ['apiUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5'],
        },
      ],
      where: {
        accessKey: mockParams.accessKey,
      },
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockResult);
  });

  it('should return null if no service operator is found', async () => {
    const mockParams = { accessKey: 'invalidKey', serviceType: 'testService' };

    serviceOperator.findOne.mockResolvedValue(null);

    const result = await findOne(mockParams);

    expect(serviceOperator.findOne).toHaveBeenCalledWith({
      include: [
        {
          model: vendors,
          attributes: ['apiUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5'],
        },
      ],
      where: {
        accessKey: mockParams.accessKey,
        serviceType: mockParams.serviceType,
      },
      raw: true,
      nest: true,
    });

    expect(result).toBeNull();
  });

  it('should throw an error if an exception occurs', async () => {
    const mockParams = { accessKey: 'testKey', serviceType: 'testService' };
    const mockError = new Error('Database error');

    serviceOperator.findOne.mockRejectedValue(mockError);

    await expect(findOne(mockParams)).rejects.toThrow('Database error');

    expect(serviceOperator.findOne).toHaveBeenCalledWith({
      include: [
        {
          model: vendors,
          attributes: ['apiUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5'],
        },
      ],
      where: {
        accessKey: mockParams.accessKey,
        serviceType: mockParams.serviceType,
      },
      raw: true,
      nest: true,
    });
  });
});
