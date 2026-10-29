const { findConnected } = require('../../../use-cases/peko_connect'); 
const connections = require('../../../entities/connections'); 

jest.mock('../../../entities/connections', () => ({
  findAll: jest.fn(),
}));

describe('findConnected Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find and return connections by credentialId ordered by createdAt DESC', async () => {
    const params = { id: 1 };

    const mockConnections = [
      {
        id: 1,
        credentialId: 1,
        serviceProvider: 'ServiceProvider1',
        name: 'John Doe',
        createdAt: new Date('2021-01-01')
      },
      {
        id: 2,
        credentialId: 1,
        serviceProvider: 'ServiceProvider2',
        name: 'Jane Doe',
        createdAt: new Date('2021-02-01')
      }
    ];

    connections.findAll.mockResolvedValue(mockConnections);

    const result = await findConnected(params);

    expect(connections.findAll).toHaveBeenCalledWith({
      where: { credentialId: params.id },
      order: [['createdAt', 'DESC']]
    });
    expect(result).toEqual(mockConnections);
  });

  it('should throw an error if the findAll method throws an error', async () => {
    const params = { id: 1 };

    const errorMessage = 'Something went wrong';
    connections.findAll.mockRejectedValue(new Error(errorMessage));

    await expect(findConnected(params)).rejects.toThrow(errorMessage);

    expect(connections.findAll).toHaveBeenCalledWith({
      where: { credentialId: params.id },
      order: [['createdAt', 'DESC']]
    });
  });
});
