const paymentQrs = require('../../../entities/paymentQr');
const { getPaymentQrsCount } = require('../../paymentQr');

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

describe('getPaymentQrsCount', () => {
  it('returns count of PENDING QRs for the given user', async () => {
    paymentQrs.count.mockResolvedValue(4);

    const result = await getPaymentQrsCount({ corporateUser: 'user-1' });

    expect(paymentQrs.count).toHaveBeenCalledWith({
      where: { credentialId: 'user-1', status: 'PENDING' },
    });
    expect(result).toBe(4);
  });

  it('returns 0 when no pending QRs exist', async () => {
    paymentQrs.count.mockResolvedValue(0);

    const result = await getPaymentQrsCount({ corporateUser: 'user-1' });

    expect(result).toBe(0);
  });

  it('throws and logs on db error', async () => {
    paymentQrs.count.mockRejectedValue(new Error('Count failed'));

    await expect(getPaymentQrsCount({ corporateUser: 'user-1' })).rejects.toThrow('Count failed');
  });
});
