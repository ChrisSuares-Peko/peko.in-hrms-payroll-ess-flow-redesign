const { deleteOauthClient } = require('../../oauth_clients');
const oauth_clients = require('../../../entities/oauth_clients');

jest.mock('../../../entities/oauth_clients', () => ({
  destroy: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

describe('deleteOauthClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when a row was deleted', async () => {
    oauth_clients.destroy.mockResolvedValue(1);

    const result = await deleteOauthClient('abc123');

    expect(oauth_clients.destroy).toHaveBeenCalledWith({
      where: { client_id: 'abc123' },
    });
    expect(result).toBe(true);
  });

  it('should return false when no row matched', async () => {
    oauth_clients.destroy.mockResolvedValue(0);

    const result = await deleteOauthClient('missing');

    expect(result).toBe(false);
  });

  it('should return false when the delete fails', async () => {
    oauth_clients.destroy.mockRejectedValue(new Error('Database error'));

    const result = await deleteOauthClient('abc123');

    expect(result).toBe(false);
  });
});
