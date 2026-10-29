jest.mock('../../models/entities/paymentGatewayOrders', () => ({ findOne: jest.fn() }));

const paymentGatewayOrders = require('../../models/entities/paymentGatewayOrders');
const { resolveSubscriptionQuote } = require('../subscriptionQuote');

describe('resolveSubscriptionQuote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the quote stored on the AUTH order with the current-plan credit rules', async () => {
    paymentGatewayOrders.findOne.mockResolvedValue({
      paymentData: JSON.stringify({ quotedAt: '2026-10-06T18:29:00.000Z', pgAmount: 56640 }),
      createdAt: new Date('2026-10-06T18:29:01.000Z'),
    });

    await expect(resolveSubscriptionQuote('1700000000000')).resolves.toEqual({
      quotedAt: '2026-10-06T18:29:00.000Z',
      creditCurrentGroupPlan: true,
    });
    expect(paymentGatewayOrders.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { vendorSubscriptionId: '1700000000000', orderKind: 'SUBSCRIPTION_AUTH' } })
    );
  });

  it('prices an order created before quotes were stored as of its creation, under the old rules', async () => {
    const createdAt = new Date('2026-10-01T10:00:00.000Z');
    paymentGatewayOrders.findOne.mockResolvedValue({ paymentData: JSON.stringify({ pgAmount: 59000 }), createdAt });

    await expect(resolveSubscriptionQuote(1700000000000)).resolves.toEqual({
      quotedAt: createdAt,
      creditCurrentGroupPlan: false,
    });
  });

  it('falls back to pricing as of now when the AUTH order is missing or the lookup fails', async () => {
    paymentGatewayOrders.findOne.mockResolvedValue(null);
    await expect(resolveSubscriptionQuote('missing')).resolves.toEqual({ quotedAt: null, creditCurrentGroupPlan: true });

    paymentGatewayOrders.findOne.mockRejectedValue(new Error('db unavailable'));
    await expect(resolveSubscriptionQuote('missing')).resolves.toEqual({ quotedAt: null, creditCurrentGroupPlan: true });
  });
});
