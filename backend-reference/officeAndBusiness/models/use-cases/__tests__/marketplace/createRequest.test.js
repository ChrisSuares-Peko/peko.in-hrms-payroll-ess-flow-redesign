const { createRequest } = require('../../../use-cases/peko_connect'); 
const connections = require('../../../entities/connections'); 

jest.mock('../../../entities/connections', () => ({
  create: jest.fn(),
}));

describe('createRequest Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create and return a new connection', async () => {
    const params = {
      serviceProvider: 'ServiceProvider1',
      name: 'John Doe',
      mobile: '1234567890',
      email: 'johndoe@example.com',
      preferredMode: 'email',
      requirement: 'Need more information'
    };

    const mockConnection = {
      id: 1,
      ...params,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    connections.create.mockResolvedValue(mockConnection);

    const result = await createRequest(params);

    expect(connections.create).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockConnection);
  });

  it('should throw an error if the create method throws an error', async () => {
    const params = {
      serviceProvider: 'ServiceProvider1',
      name: 'John Doe',
      mobile: '1234567890',
      email: 'johndoe@example.com',
      preferredMode: 'email',
      requirement: 'Need more information'
    };

    const errorMessage = 'Something went wrong';
    connections.create.mockRejectedValue(new Error(errorMessage));

    await expect(createRequest(params)).rejects.toThrow(errorMessage);

    expect(connections.create).toHaveBeenCalledWith(params);
  });
});
