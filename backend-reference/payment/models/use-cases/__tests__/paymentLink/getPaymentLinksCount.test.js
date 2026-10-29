const paymentLinks = require('../../../entities/paymentLink');
const { customLog } = require('../../../../utils/loggerHelper');
const { getPaymentLinksCount } = require('../../paymentLink');

jest.mock('../../../entities/paymentLink', () => ({
  count: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getPaymentLinksCount', () => {
  it('returns count of PENDING links for the given user', async () => {
    paymentLinks.count.mockResolvedValue(5);

    const result = await getPaymentLinksCount({ corporateUser: 'user-1' });

    expect(paymentLinks.count).toHaveBeenCalledWith({
      where: { credentialId: 'user-1', status: 'PENDING' },
    });
    expect(result).toBe(5);
  });

  it('returns 0 when no pending links exist', async () => {
    paymentLinks.count.mockResolvedValue(0);

    const result = await getPaymentLinksCount({ corporateUser: 'user-1' });

    expect(result).toBe(0);
  });

  it('throws and logs on db error', async () => {
    paymentLinks.count.mockRejectedValue(new Error('Count failed'));

    await expect(getPaymentLinksCount({ corporateUser: 'user-1' })).rejects.toThrow('Count failed');
    expect(customLog).toHaveBeenCalled();
  });
});
