const paymentQrs = require('../../../entities/paymentQr');
const { customLog } = require('../../../../utils/loggerHelper');
const { getTotalAmountFromPaymentQr } = require('../../paymentQr');

jest.mock('../../../entities/paymentQr', () => ({
  findAll: jest.fn(),
  sequelize: {
    fn: jest.fn(() => 'SUM(amount)'),
    col: jest.fn(() => 'amount'),
  },
}));

jest.mock('../../../../services/paymentLinks', () => ({
  getTransactionStatus: jest.fn(),
}));

jest.mock('../../paymentCollectionTransaction', () => ({
  upsertUnifiedTransactionStatus: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getTotalAmountFromPaymentQr', () => {
  it('returns numeric total for SUCCESS QRs', async () => {
    paymentQrs.findAll.mockResolvedValue([{ totalAmount: '900' }]);

    const result = await getTotalAmountFromPaymentQr({ corporateUser: 'user-1' });

    expect(result).toBe(900);
    const where = paymentQrs.findAll.mock.calls[0][0].where;
    expect(where.status).toBe('SUCCESS');
    expect(where.credentialId).toBe('user-1');
  });

  it('returns 0 when totalAmount is null', async () => {
    paymentQrs.findAll.mockResolvedValue([{ totalAmount: null }]);

    const result = await getTotalAmountFromPaymentQr({ corporateUser: 'user-1' });

    expect(result).toBe(0);
  });

  it('returns 0 when result row has no totalAmount field', async () => {
    paymentQrs.findAll.mockResolvedValue([{}]);

    const result = await getTotalAmountFromPaymentQr({ corporateUser: 'user-1' });

    expect(result).toBe(0);
  });

  it('applies startDate filter only when provided', async () => {
    paymentQrs.findAll.mockResolvedValue([{ totalAmount: '100' }]);

    await getTotalAmountFromPaymentQr({
      corporateUser: 'user-1',
      startDate: new Date('2024-01-01'),
    });

    const where = paymentQrs.findAll.mock.calls[0][0].where;
    expect(where.createdAt).toBeDefined();
  });

  it('applies endDate filter only when provided', async () => {
    paymentQrs.findAll.mockResolvedValue([{ totalAmount: '200' }]);

    await getTotalAmountFromPaymentQr({
      corporateUser: 'user-1',
      endDate: new Date('2024-01-31'),
    });

    const where = paymentQrs.findAll.mock.calls[0][0].where;
    expect(where.createdAt).toBeDefined();
  });

  it('applies both startDate and endDate when both provided', async () => {
    paymentQrs.findAll.mockResolvedValue([{ totalAmount: '500' }]);

    await getTotalAmountFromPaymentQr({
      corporateUser: 'user-1',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    });

    const where = paymentQrs.findAll.mock.calls[0][0].where;
    expect(where.createdAt).toBeDefined();
  });

  it('does not add createdAt filter when neither date is provided', async () => {
    paymentQrs.findAll.mockResolvedValue([{ totalAmount: '0' }]);

    await getTotalAmountFromPaymentQr({ corporateUser: 'user-1' });

    const where = paymentQrs.findAll.mock.calls[0][0].where;
    expect(where).not.toHaveProperty('createdAt');
  });

  it('throws and logs on db error', async () => {
    paymentQrs.findAll.mockRejectedValue(new Error('Sum failed'));

    await expect(getTotalAmountFromPaymentQr({ corporateUser: 'user-1' })).rejects.toThrow('Sum failed');
    expect(customLog).toHaveBeenCalled();
  });
});
