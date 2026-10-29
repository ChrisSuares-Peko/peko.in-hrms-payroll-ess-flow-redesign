jest.mock('../../models/use-cases/order', () => ({ findOneOrder: jest.fn() }));
jest.mock('../../models/entities/order', () => ({ create: jest.fn(), update: jest.fn(), findOne: jest.fn() }));
jest.mock('../../models/entities/wallet', () => ({ findOne: jest.fn(), update: jest.fn() }));
jest.mock('../../models/entities/transaction', () => ({ findOne: jest.fn(), create: jest.fn(), update: jest.fn() }));
jest.mock('../../models/entities/userCoupons', () => ({ update: jest.fn() }));

const sequelizeConfig = require('../../configs/database/index');
const order = require('../../models/entities/order');
const wallet = require('../../models/entities/wallet');
const walletTransaction = require('../../models/entities/transaction');
const { refundWalletTransaction } = require('../walletTransaction');

const t = { LOCK: { UPDATE: 'UPDATE' }, commit: jest.fn(), rollback: jest.fn() };

describe('refundWalletTransaction — service coupon usage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sequelizeConfig.transaction.mockImplementation(async (arg) => (typeof arg === 'function' ? arg(t) : t));
    wallet.findOne.mockResolvedValue({ balance: '1000.0000' });
    order.findOne.mockResolvedValue(null);
    walletTransaction.findOne.mockResolvedValue({
      id: 11,
      corporateTxnId: 'TXN1',
      credentialId: 7,
      orderId: 5,
      debitAmount: 0,
      creditAmount: 0,
      corporateCashback: 0,
      systemCashback: 0,
      remarks: 'PENDING',
      createdAt: '2026-10-01T10:00:00.000Z',
    });
  });

  it('detaches the coupon from a refunded order so the failed payment does not use it up', async () => {
    await refundWalletTransaction({ corporateTxnId: 'TXN1', status: 'FAILED', message: 'Bill payment failed' });

    expect(order.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'FAILED', couponCodeId: null }),
      expect.objectContaining({ where: { corporateTxnId: 'TXN1' } })
    );
  });
});
