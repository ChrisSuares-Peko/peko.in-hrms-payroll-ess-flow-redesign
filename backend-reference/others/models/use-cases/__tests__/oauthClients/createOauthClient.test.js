const { createOauthClient } = require('../../oauth_clients');
const oauth_clients = require('../../../entities/oauth_clients');

jest.mock('../../../entities/oauth_clients', () => ({
  create: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

describe('createOauthClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a client with generated client_id and client_secret', async () => {
    const plain = { id: 1, client_name: 'Test App' };
    oauth_clients.create.mockResolvedValue({ get: () => plain });

    const result = await createOauthClient({
      client_name: 'Test App',
      logo_uri: 'https://cdn.example.com/logo.png',
      frontend_url: 'https://app.example.com',
      redirect_uris: ['https://app.example.com/cb'],
    });

    expect(oauth_clients.create).toHaveBeenCalledWith({
      client_name: 'Test App',
      client_id: expect.stringMatching(/^[0-9a-f]{32}$/),
      client_secret: expect.stringMatching(/^[0-9a-f]{64}$/),
      logo_uri: 'https://cdn.example.com/logo.png',
      frontend_url: 'https://app.example.com',
      redirect_uris: ['https://app.example.com/cb'],
    });
    expect(result).toEqual(plain);
  });

  it('should default optional fields when omitted', async () => {
    const plain = { id: 2 };
    oauth_clients.create.mockResolvedValue({ get: () => plain });

    await createOauthClient({});

    expect(oauth_clients.create).toHaveBeenCalledWith({
      client_name: null,
      client_id: expect.any(String),
      client_secret: expect.any(String),
      logo_uri: null,
      frontend_url: null,
      redirect_uris: [],
    });
  });

  it('should return false when creation fails', async () => {
    oauth_clients.create.mockRejectedValue(new Error('Database error'));

    const result = await createOauthClient({ client_name: 'Broken' });

    expect(result).toBe(false);
  });
});
