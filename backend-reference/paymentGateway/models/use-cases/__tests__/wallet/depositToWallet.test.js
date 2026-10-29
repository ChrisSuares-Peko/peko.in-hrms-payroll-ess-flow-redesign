const { depositToWallet } = require('../../wallet');
const wallet = require('../../../entities/wallet');
const walletTransaction = require('../../../entities/transaction');

jest.mock('../../../entities/wallet', () => ({
  findOne: jest.fn(),
  update: jest.fn(),
}));

jest.mock('../../../entities/transaction', () => ({
  create: jest.fn(),
}));

describe('wallet - depositToWallet', () => {
  const mockTransaction = {
    LOCK: { UPDATE: 'UPDATE' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should deposit to wallet and return success', async () => {
    const mockData = {
      credentialId: 'C1',
      amount: 100,
      remarks: 'Test deposit',
      corporateTxnId: 'TXN123',
    };

    wallet.findOne.mockResolvedValue({ balance: '500.0000' });
    wallet.update.mockResolvedValue([1]);
    walletTransaction.create.mockResolvedValue({ id: 1 });

    const result = await depositToWallet(mockData, mockTransaction);

    expect(wallet.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { credentialId: 'C1' },
        lock: 'UPDATE',
        attributes: ['balance'],
        transaction: mockTransaction,
      })
    );
    expect(wallet.update).toHaveBeenCalledWith(
      { balance: '600.0000' },
      expect.objectContaining({
        where: { credentialId: 'C1' },
        transaction: mockTransaction,
      })
    );
    expect(walletTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        corporateTxnId: 'TXN123',
        transactionCategory: 'RECHARGE WALLET',
        transactionType: 'CREDIT',
        creditAmount: 100,
        status: 'SUCCESS',
      }),
      { transaction: mockTransaction }
    );
    expect(result).toEqual({
      status: true,
      corporateFinalBalance: '600.0000',
    });
  });

  it('should throw error when wallet not found', async () => {
    wallet.findOne.mockResolvedValue(null);

    await expect(
      depositToWallet({ credentialId: 'C1', amount: 100, remarks: 'Test', corporateTxnId: 'TXN123' }, mockTransaction)
    ).rejects.toThrow();
  });
});
