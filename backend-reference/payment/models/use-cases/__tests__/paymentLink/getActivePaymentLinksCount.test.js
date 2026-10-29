const paymentLinks = require('../../../entities/paymentLink');
const { customLog } = require('../../../../utils/loggerHelper');
const { getActivePaymentLinksCount } = require('../../paymentLink');

jest.mock('../../../entities/paymentLink', () => ({
  count: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getActivePaymentLinksCount', () => {
  it('returns count of active (PENDING and not expired) links', async () => {
    paymentLinks.count.mockResolvedValue(3);

    const result = await getActivePaymentLinksCount({ corporateUser: 'user-1' });

    expect(result).toBe(3);
    const where = paymentLinks.count.mock.calls[0][0].where;
    expect(where.credentialId).toBe('user-1');
    expect(where.status).toBe('PENDING');
  });

  it('includes Op.or condition for null or future expireDate', async () => {
    paymentLinks.count.mockResolvedValue(2);

    await getActivePaymentLinksCount({ corporateUser: 'user-1' });

    const where = paymentLinks.count.mock.calls[0][0].where;
    expect(Object.getOwnPropertySymbols(where).length).toBeGreaterThan(0);
  });

  it('returns 0 when no active links exist', async () => {
    paymentLinks.count.mockResolvedValue(0);

    const result = await getActivePaymentLinksCount({ corporateUser: 'user-1' });

    expect(result).toBe(0);
  });

  it('throws and logs on db error', async () => {
    paymentLinks.count.mockRejectedValue(new Error('Count error'));

    await expect(getActivePaymentLinksCount({ corporateUser: 'user-1' })).rejects.toThrow('Count error');
    expect(customLog).toHaveBeenCalled();
  });
});
