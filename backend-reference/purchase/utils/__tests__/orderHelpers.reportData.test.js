jest.mock('../../models/use-cases/order', () => ({ findOneOrder: jest.fn() }));
jest.mock('../../models/entities/order', () => ({ create: jest.fn(), update: jest.fn(), findOne: jest.fn() }));
jest.mock('../../models/entities/wallet', () => ({ findOne: jest.fn(), update: jest.fn() }));
jest.mock('../../models/entities/transaction', () => ({ create: jest.fn(), findOne: jest.fn(), update: jest.fn() }));

const sequelizeConfig = require('../../configs/database/index');
const { findOneOrder } = require('../../models/use-cases/order');
const order = require('../../models/entities/order');
const wallet = require('../../models/entities/wallet');
const walletTransaction = require('../../models/entities/transaction');
const { createPGTransaction, createPaytmTransaction } = require('../pamentGatewayTransaction');
const { createLeanTransaction } = require('../leanTransaction');
const { createRazorPayTransaction } = require('../dapiTransaction');
const { createWalletTransaction } = require('../walletTransaction');

const t = { LOCK: { UPDATE: 'UPDATE' } };

const params = {
  providerId: 'P-1',
  corporateTxnId: 'TXN-1',
  credentialId: 5,
  serviceOperatorId: 3,
  accountNo: 'ACC-1',
  corporateCashback: 1,
  payCashback: false,
  orderAmount: 100,
  amount: 100,
  commissionType: 'FLAT',
  cashbackType: 'FLAT',
  providerCommission: 2,
  transactionCategory: 'Hike',
  surcharge: 10,
};

const HELPERS = [
  ['createPGTransaction', createPGTransaction, { pgResponse: { id: 'pg' }, pgAmount: 110 }],
  ['createPaytmTransaction', createPaytmTransaction, { paytmResponse: { id: 'paytm' }, paytmAmount: 110 }],
  ['createLeanTransaction', createLeanTransaction, { leanResponse: { id: 'lean' }, leanAmount: 110 }],
  ['createRazorPayTransaction', createRazorPayTransaction, { razorPayResponse: { id: 'razor' }, razorPayAmount: 110 }],
  ['createWalletTransaction', createWalletTransaction, {}],
];

beforeEach(() => {
  jest.clearAllMocks();
  sequelizeConfig.transaction.mockImplementation(async (work) => work(t));
  findOneOrder.mockResolvedValue(null);
  wallet.findOne.mockResolvedValue({ balance: 1000 });
  order.create.mockResolvedValue({ id: 9, paymentMode: 'WALLET' });
  walletTransaction.create.mockResolvedValue({ id: 11 });
});

describe.each(HELPERS)('%s', (name, helper, extra) => {
  it('keeps the journal data it is given on the order', async () => {
    const journalData = { commissionIncludingGST: 5, paymentGatewayName: 'WALLET' };

    const result = await helper({ ...params, ...extra, reportData: { journalData } });

    expect(result.error).toBeUndefined();
    expect(order.create).toHaveBeenCalledTimes(1);
    expect(order.create).toHaveBeenCalledWith(
      expect.objectContaining({ corporateTxnId: 'TXN-1', journalData }),
      { transaction: t }
    );
  });

  it('creates the order without journal data when none is given', async () => {
    const result = await helper({ ...params, ...extra });

    expect(result.error).toBeUndefined();
    expect(order.create.mock.calls[0][0]).not.toHaveProperty('journalData');
  });
});
