const wallet = require('../../../entities/wallet');
const { findAllWallets } = require('../../wallets');

jest.mock('../../../entities/wallet', () => ({
  findAll: jest.fn(),
  findOne: jest.fn(),
}));

describe('findAllWallets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return all wallets successfully', async () => {
    const mockWallets = [
      { id: 1, balance: 500, credentialId: 'CRED1' },
      { id: 2, balance: 1000, credentialId: 'CRED2' },
    ];

    wallet.findAll.mockResolvedValue(mockWallets);

    const result = await findAllWallets();

    expect(wallet.findAll).toHaveBeenCalledWith({ raw: true });
    expect(wallet.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockWallets);
  });

  it('should return empty array when no wallets found', async () => {
    wallet.findAll.mockResolvedValue([]);

    const result = await findAllWallets();

    expect(result).toEqual([]);
  });

  it('should handle errors and return undefined', async () => {
    wallet.findAll.mockRejectedValue(new Error('DB Error'));

    const result = await findAllWallets();

    expect(result).toBeUndefined();
  });

  it('should log the final message in the finally block', async () => {
    wallet.findAll.mockResolvedValue([]);

    await findAllWallets();

    expect(console.log).toHaveBeenCalledWith('WALLET FIND ALL ROUTE CALLED');
  });
});
