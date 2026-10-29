const { updateOauthClient } = require('../../oauth_clients');
const oauth_clients = require('../../../entities/oauth_clients');

jest.mock('../../../entities/oauth_clients', () => ({
  update: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

describe('updateOauthClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update the client matched by client_id', async () => {
    oauth_clients.update.mockResolvedValue([1]);

    const result = await updateOauthClient('abc123', {
      client_name: 'Renamed App',
      logo_uri: 'https://cdn.example.com/new-logo.png',
      frontend_url: 'https://app.example.com',
      redirect_uris: ['https://app.example.com/cb'],
      active: false,
    });

    expect(oauth_clients.update).toHaveBeenCalledWith(
      {
        client_name: 'Renamed App',
        logo_uri: 'https://cdn.example.com/new-logo.png',
        frontend_url: 'https://app.example.com',
        redirect_uris: ['https://app.example.com/cb'],
        active: false,
      },
      { where: { client_id: 'abc123' } }
    );
    expect(result).toEqual([1]);
  });

  it('should write only the fields that were supplied', async () => {
    oauth_clients.update.mockResolvedValue([1]);

    await updateOauthClient('abc123', { client_name: 'Renamed App' });

    expect(oauth_clients.update).toHaveBeenCalledWith(
      { client_name: 'Renamed App' },
      { where: { client_id: 'abc123' } }
    );
  });

  // Regression: defaulting omitted fields let an admin form that did not
  // repopulate the callback list wipe a live client's redirect URIs (and
  // silently re-activate a deactivated client).
  it('should not clear redirect_uris or reactivate the client when they are omitted', async () => {
    oauth_clients.update.mockResolvedValue([1]);

    await updateOauthClient('abc123', { logo_uri: 'https://cdn.example.com/logo.png' });

    const [changes] = oauth_clients.update.mock.calls[0];
    expect(changes).not.toHaveProperty('redirect_uris');
    expect(changes).not.toHaveProperty('active');
  });

  it('should not touch the record when no updatable field is supplied', async () => {
    const result = await updateOauthClient('abc123', {});

    expect(oauth_clients.update).not.toHaveBeenCalled();
    expect(result).toEqual([0]);
  });

  it('should ignore keys that are not updatable', async () => {
    oauth_clients.update.mockResolvedValue([1]);

    await updateOauthClient('abc123', { client_name: 'Renamed App', client_secret: 'REDACTED' });

    expect(oauth_clients.update).toHaveBeenCalledWith(
      { client_name: 'Renamed App' },
      { where: { client_id: 'abc123' } }
    );
  });

  it('should return false when the update fails', async () => {
    oauth_clients.update.mockRejectedValue(new Error('Database error'));

    const result = await updateOauthClient('abc123', { client_name: 'Renamed App' });

    expect(result).toBe(false);
  });
});
