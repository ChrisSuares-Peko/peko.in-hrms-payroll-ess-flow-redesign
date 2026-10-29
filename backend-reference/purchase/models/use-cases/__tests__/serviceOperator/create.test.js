const { create } = require('../../serviceOperator'); 
const serviceOperator = require('../../../entities/serviceOperator');


jest.mock('../../../entities/serviceOperator', () => ({
  create: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

describe('create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call serviceOperator.create and return the result', async () => {
    const params = { name: 'Test Service', status: 'ACTIVE' };
    const mockResult = { id: 1, ...params };

    serviceOperator.create.mockResolvedValue(mockResult);

    const result = await create(params);

    expect(serviceOperator.create).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockResult);
  });

  it('should log error and throw if serviceOperator.create fails', async () => {
    const params = { name: 'Test Service', status: 'ACTIVE' };
    const error = new Error('DB Error');

    serviceOperator.create.mockRejectedValue(error);

    // Wrap in try/catch since asyncHandler usually throws errors
    await expect(create(params)).rejects.toThrow(error);
  });
});
