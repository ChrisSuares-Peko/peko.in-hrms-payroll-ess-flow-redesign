const { findOne } = require('../../serviceOperator');
const  serviceOperator  = require('../../../entities/serviceOperator'); // Ensure this path is correct
const vendors = require('../../../entities/vendor');

jest.mock('../../../entities/serviceOperator', () => {
  return {   
      findOne: jest.fn()   
  };
});

describe('findOne', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should call findOne with correct where clause when serviceType is provided', async () => {
    // Arrange
    const params = {
        accessKey: 'REDACTED',
        serviceType: 'someServiceType',
    };
    const mockResult = { id: 1, accessKey: 'REDACTED' };
    serviceOperator.findOne.mockResolvedValue(mockResult);

    // Act
    const result = await findOne(params);

    // Assert
    expect(serviceOperator.findOne).toHaveBeenCalledWith({
        include: [{
            model: vendors,
            attributes: ['apiUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5','healthUrl','optional6','optionals']
        }],
        where: {
            accessKey: 'REDACTED',
            serviceType: 'someServiceType',
        },
        raw: true,
        nest: true,
    });
    expect(result).toEqual(mockResult);
});

test('should call findOne with correct where clause when serviceType is not provided', async () => {
    // Arrange
    const params = {
        accessKey: 'REDACTED',
    };
    const mockResult = { id: 1, accessKey: 'REDACTED' };
    serviceOperator.findOne.mockResolvedValue(mockResult);

    // Act
    const result = await findOne(params);

    // Assert
    expect(serviceOperator.findOne).toHaveBeenCalledWith({
        include: [{
            model: vendors,
            attributes: ['apiUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5','healthUrl','optional6','optionals']
        }],
        where: {
            accessKey: 'REDACTED',
        },
        raw: true,
        nest: true,
    });
    expect(result).toEqual(mockResult);
});

test('should handle errors thrown by findOne', async () => {
    // Arrange
    const params = {
        accessKey: 'REDACTED',
        serviceType: 'someServiceType',
    };
    const errorMessage = 'Database error';
    serviceOperator.findOne.mockRejectedValue(new Error(errorMessage));

    // Act & Assert
    await expect(findOne(params)).rejects.toThrow(errorMessage);
});

test('should return null when no result is found', async () => {
    // Arrange
    const params = {
        accessKey: 'REDACTED',
    };
    serviceOperator.findOne.mockResolvedValue(null);

    // Act
    const result = await findOne(params);

    // Assert
    expect(serviceOperator.findOne).toHaveBeenCalledWith({
        include: [{
            model: vendors,
            attributes: ['apiUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5','healthUrl','optional6','optionals']
        }],
        where: {
            accessKey: 'REDACTED',
        },
        raw: true,
        nest: true,
    });
    expect(result).toBeNull();
});
});
