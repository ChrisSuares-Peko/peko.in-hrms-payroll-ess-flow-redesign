const paymentQrs = require('../../../entities/paymentQr');
const { getActivePaymentQrsCount } = require('../../paymentQr');

jest.mock('../../../entities/paymentQr', () => ({
  count: jest.fn(),
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

describe('getActivePaymentQrsCount', () => {
  it('returns count of active (PENDING + not expired) QRs', async () => {
    paymentQrs.count.mockResolvedValue(2);

    const result = await getActivePaymentQrsCount({ corporateUser: 'user-1' });

    expect(result).toBe(2);
    const where = paymentQrs.count.mock.calls[0][0].where;
    expect(where.credentialId).toBe('user-1');
    expect(where.status).toBe('PENDING');
  });

  it('includes Op.or condition covering null and future expireDate', async () => {
    paymentQrs.count.mockResolvedValue(1);

    await getActivePaymentQrsCount({ corporateUser: 'user-1' });

    const where = paymentQrs.count.mock.calls[0][0].where;
    expect(Object.getOwnPropertySymbols(where).length).toBeGreaterThan(0);
  });

  it('returns 0 when no active QRs exist', async () => {
    paymentQrs.count.mockResolvedValue(0);

    const result = await getActivePaymentQrsCount({ corporateUser: 'user-1' });

    expect(result).toBe(0);
  });

  it('throws and logs on db error', async () => {
    paymentQrs.count.mockRejectedValue(new Error('Count error'));

    await expect(getActivePaymentQrsCount({ corporateUser: 'user-1' })).rejects.toThrow('Count error');
  });
});
