const { getUserPaymentUsage } = require('../../order');
const order = require('../../../entities/order');

jest.mock('../../../entities/order', () => ({
  findOne: jest.fn(),
  sum: jest.fn(),
  update: jest.fn(),
  findByPk: jest.fn(),
}));

describe('getUserPaymentUsage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return wallet and gateway usage when data exists', async () => {
    order.sum
      .mockResolvedValueOnce(100)   // walletToday
      .mockResolvedValueOnce(500)   // walletMonth
      .mockResolvedValueOnce(200)   // gatewayToday
      .mockResolvedValueOnce(1000)  // gatewayMonth
      .mockResolvedValueOnce(300)   // cardToday
      .mockResolvedValueOnce(1500); // cardMonth

    const result = await getUserPaymentUsage({ credentialId: 'CRED123' });

    expect(order.sum).toHaveBeenCalledTimes(6);
    expect(result).toEqual({
      wallet: { today: 100, month: 500 },
      gateway: { today: 200, month: 1000 },
      corporateCard: { today: 300, month: 1500 },
    });
  });

  it('should return 0 when sum returns null', async () => {
    order.sum
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const result = await getUserPaymentUsage({ credentialId: 'CRED123' });

    expect(result).toEqual({
      wallet: { today: 0, month: 0 },
      gateway: { today: 0, month: 0 },
      corporateCard: { today: 0, month: 0 },
    });
  });

  it('should return zeros on error', async () => {
    order.sum.mockRejectedValue(new Error('DB Error'));

    const result = await getUserPaymentUsage({ credentialId: 'CRED_ERR' });

    expect(result).toEqual({
      wallet: { today: 0, month: 0 },
      gateway: { today: 0, month: 0 },
      corporateCard: { today: 0, month: 0 },
    });
  });
});
