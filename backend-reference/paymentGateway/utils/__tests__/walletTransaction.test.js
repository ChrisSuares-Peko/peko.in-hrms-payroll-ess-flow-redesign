jest.mock('../../models/use-cases/order', () => ({ findOneOrder: jest.fn() }));
jest.mock('../../models/entities/order', () => ({ create: jest.fn(), update: jest.fn(), findOne: jest.fn() }));
jest.mock('../../models/entities/wallet', () => ({ findOne: jest.fn(), update: jest.fn() }));
jest.mock('../../models/entities/transaction', () => ({ findOne: jest.fn(), create: jest.fn(), update: jest.fn() }));
jest.mock('../../models/entities/userCoupons', () => ({ update: jest.fn() }));

const sequelizeConfig = require('../../configs/database/index');
const orders = require('../../models/use-cases/order');
const order = require('../../models/entities/order');
const wallet = require('../../models/entities/wallet');
const walletTransaction = require('../../models/entities/transaction');
const { createWalletTransaction, refundWalletTransaction } = require('../walletTransaction');

const t = { LOCK: { UPDATE: 'UPDATE' }, commit: jest.fn(), rollback: jest.fn() };

const debit = (overrides = {}) => ({
  providerId: 'P1',
  corporateTxnId: 'TXN1',
  credentialId: 7,
  serviceOperatorId: 3,
  corporateCashback: 0,
  transactionCategory: 'Travel',
  amount: 1000,
  commissionType: 'FLAT',
  cashbackType: 'FLAT',
  providerCommission: 0,
  surcharge: 20,
  ...overrides,
});

const paymentRow = (overrides = {}) => ({
  id: 11,
  corporateTxnId: 'TXN1',
  credentialId: 7,
  orderId: 5,
  debitAmount: 1020,
  creditAmount: 0,
  corporateCashback: 0,
  systemCashback: 0,
  remarks: 'Payment Successful',
  createdAt: '2026-10-01T10:00:00.000Z',
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  sequelizeConfig.transaction.mockImplementation(async (arg) => (typeof arg === 'function' ? arg(t) : t));
  orders.findOneOrder.mockResolvedValue(null);
  wallet.findOne.mockResolvedValue({ balance: '5000.0000' });
  order.create.mockResolvedValue({ id: 5, paymentMode: 'WALLET' });
  order.findOne.mockResolvedValue(null);
  walletTransaction.create.mockResolvedValue({ id: 11 });
});

describe('createWalletTransaction — amount guard', () => {
  it.each([
    ['a negative amount', { amount: -500 }],
    ['a zero amount', { amount: 0 }],
    ['a non-numeric amount', { amount: '12abc' }],
    ['a missing amount', { amount: undefined }],
    ['a negative surcharge', { surcharge: -20 }],
    ['a non-numeric surcharge', { surcharge: 'abc' }],
  ])('refuses %s before touching the wallet', async (_label, overrides) => {
    const result = await createWalletTransaction(debit(overrides));

    expect(result).toEqual({ error: 'INVALID AMOUNT' });
    expect(orders.findOneOrder).not.toHaveBeenCalled();
    expect(wallet.findOne).not.toHaveBeenCalled();
    expect(wallet.update).not.toHaveBeenCalled();
  });

  it('refuses a debit whose resulting balance is not a number', async () => {
    const result = await createWalletTransaction(debit({ corporateCashback: undefined }));

    expect(result).toEqual({ error: 'INVALID AMOUNT' });
    expect(wallet.update).not.toHaveBeenCalled();
  });

  it('debits amount plus surcharge', async () => {
    const result = await createWalletTransaction(debit());

    expect(wallet.update).toHaveBeenCalledWith({ balance: '3980.0000' }, expect.objectContaining({ transaction: t }));
    expect(result).toEqual(expect.objectContaining({ orderId: 5, transactionId: 11, paymentMode: 'WALLET' }));
  });
});

describe('refundWalletTransaction — concurrent refunds', () => {
  it('skips a refund that another request completed while this one waited for the wallet lock', async () => {
    walletTransaction.findOne
      .mockResolvedValueOnce(paymentRow())
      .mockResolvedValueOnce({ remarks: 'REFUNDED' });

    const result = await refundWalletTransaction({ corporateTxnId: 'TXN1' });

    expect(result).toBe('ALREADY REFUNDED');
    expect(walletTransaction.findOne).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { id: 11 }, lock: 'UPDATE', transaction: t })
    );
    expect(wallet.update).not.toHaveBeenCalled();
    expect(t.rollback).toHaveBeenCalled();
  });

  it('refunds once when the payment row is still unrefunded under the lock', async () => {
    walletTransaction.findOne
      .mockResolvedValueOnce(paymentRow())
      .mockResolvedValueOnce({ remarks: 'Payment Successful' });

    const result = await refundWalletTransaction({ corporateTxnId: 'TXN1' });

    expect(result).toEqual({ corporateBalance: 6020 });
    expect(wallet.update).toHaveBeenCalledTimes(1);
    expect(t.commit).toHaveBeenCalled();
  });
});
