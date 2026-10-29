const { create } = require('../../serviceOperator'); 
const serviceOperator = require('../../../entities/serviceOperator');

jest.mock('../../../entities/serviceOperator', () => ({
  create: jest.fn(),
}));

describe('create', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a service operator successfully', async () => {
    const mockParams = { name: 'Test Operator', email: 'test@example.com' };
    const mockResult = { id: 1, ...mockParams };

    serviceOperator.create.mockResolvedValue(mockResult);

    const result = await create(mockParams);

    // Verify serviceOperator.create was called correctly
    expect(serviceOperator.create).toHaveBeenCalledWith(mockParams);

    // Result should match
    expect(result).toEqual(mockResult);
  });

  it('should throw an error if creation fails', async () => {
    const mockParams = { name: 'Test Operator', email: 'test@example.com' };
    const mockError = new Error('Database error');

    serviceOperator.create.mockRejectedValue(mockError);

    await expect(create(mockParams)).rejects.toThrow('Database error');

    expect(serviceOperator.create).toHaveBeenCalledWith(mockParams);
  });

  it('should allow creating with empty params', async () => {
    const mockParams = {};
    const mockResult = { id: 1 };

    serviceOperator.create.mockResolvedValue(mockResult);

    const result = await create(mockParams);

    expect(serviceOperator.create).toHaveBeenCalledWith(mockParams);
    expect(result).toEqual(mockResult);
  });
});
