jest.mock('../../models/use-cases/order', () => ({ findOneOrder: jest.fn() }));
jest.mock('../../models/entities/order', () => ({ create: jest.fn(), update: jest.fn(), findOne: jest.fn() }));
jest.mock('../../models/use-cases/transaction', () => ({ findOneTransaction: jest.fn() }));
jest.mock('../../models/entities/wallet', () => ({ findOne: jest.fn(), update: jest.fn() }));
jest.mock('../../models/entities/transaction', () => ({ create: jest.fn(), findOne: jest.fn(), update: jest.fn() }));
jest.mock('../../models/entities/userCoupons', () => ({ update: jest.fn() }));
jest.mock('../bull/queue/accountingEventsQueue', () => ({ publishJournalEvent: jest.fn() }));

const sequelizeConfig = require('../../configs/database/index');
const { findOneOrder } = require('../../models/use-cases/order');
const order = require('../../models/entities/order');
const wallet = require('../../models/entities/wallet');
const walletTransaction = require('../../models/entities/transaction');
const { createWalletTransaction } = require('../walletTransaction');

const t = { LOCK: { UPDATE: 'UPDATE' } };

const charge = (extra) =>
  createWalletTransaction({
    providerId: 'P-1',
    corporateTxnId: 'TXN-1',
    credentialId: 5,
    serviceOperatorId: 3,
    accountNo: 'ACC-1',
    corporateCashback: 1,
    transactionCategory: 'Bill Payments',
    amount: 100,
    commissionType: 'FLAT',
    cashbackType: 'FLAT',
    providerCommission: 2,
    surcharge: 10,
    ...extra,
  });

beforeEach(() => {
  jest.clearAllMocks();
  sequelizeConfig.transaction.mockImplementation(async (work) => work(t));
  findOneOrder.mockResolvedValue(null);
  wallet.findOne.mockResolvedValue({ balance: 1000 });
  order.create.mockResolvedValue({ id: 9, paymentMode: 'WALLET' });
  walletTransaction.create.mockResolvedValue({ id: 11 });
});

describe('a wallet charge in the payment service', () => {
  it('keeps the journal data it is given on the order', async () => {
    const journalData = { commissionIncludingGST: 5, paymentGatewayName: 'WALLET' };

    const result = await charge({ reportData: { journalData } });

    expect(result.error).toBeUndefined();
    expect(order.create).toHaveBeenCalledWith(
      expect.objectContaining({ corporateTxnId: 'TXN-1', paymentMode: 'WALLET', journalData }),
      { transaction: t }
    );
  });

  it('creates the order without journal data when none is given', async () => {
    await charge({});

    expect(order.create.mock.calls[0][0]).not.toHaveProperty('journalData');
  });

  it('takes the wallet balance down by the amount and the surcharge', async () => {
    await charge({ reportData: { journalData: {} } });

    expect(wallet.update).toHaveBeenCalledWith({ balance: '891.0000' }, { where: { credentialId: 5 }, transaction: t });
  });
});
