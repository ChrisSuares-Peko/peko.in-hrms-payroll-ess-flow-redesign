const {
  isDeliveredForReturn,
  assertOndcOrderReturnable,
  RETURN_REFUND_TRIGGER_CODES,
} = require('../ondcReturnEligibility');

const withDelivery = (code) => ({
  type: 'Delivery',
  state: { descriptor: { code } },
});

describe('isDeliveredForReturn', () => {
  it('is true when deliveredAt / Completed / Order-delivered', () => {
    expect(isDeliveredForReturn({ deliveredAt: new Date() })).toBe(true);
    expect(isDeliveredForReturn({ orderState: 'Completed' })).toBe(true);
    expect(
      isDeliveredForReturn({ fulfillments: [withDelivery('Order-delivered')] })
    ).toBe(true);
  });

  it('is false before delivery', () => {
    expect(isDeliveredForReturn({ fulfillments: [withDelivery('Packed')] })).toBe(false);
    expect(isDeliveredForReturn({})).toBe(false);
  });
});

describe('assertOndcOrderReturnable', () => {
  const base = {
    orderState: 'Completed',
    bppUri: 'https://bpp.example.com',
    orderId: 'O-1',
    deliveredAt: new Date(),
    quote: {
      rows: [
        {
          titleType: 'item',
          itemId: 'I1',
          quantity: 2,
          returnable: true,
          returnWindow: 'P2D',
        },
      ],
    },
    fulfillments: [withDelivery('Order-delivered')],
  };

  it('allows a delivered returnable order within window', () => {
    expect(assertOndcOrderReturnable(base)).toEqual({ ok: true });
  });

  it('rejects undelivered orders', () => {
    const result = assertOndcOrderReturnable({
      ...base,
      orderState: 'Created',
      deliveredAt: null,
      fulfillments: [withDelivery('Packed')],
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('not_delivered');
  });

  it('rejects non-returnable items', () => {
    const result = assertOndcOrderReturnable({
      ...base,
      quote: {
        rows: [{ titleType: 'item', itemId: 'I1', quantity: 1, returnable: false }],
      },
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('seller_policy');
  });

  it('rejects expired return window', () => {
    const result = assertOndcOrderReturnable(
      {
        ...base,
        deliveredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      { settings: { defaultReturnWindow: 'P2D' } }
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('return_window_expired');
  });

  it('rejects in-flight returns', () => {
    const result = assertOndcOrderReturnable({
      ...base,
      returnStatus: 'Return_Initiated',
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('return_in_progress');
  });

  it('rejects invalid return quantity', () => {
    const result = assertOndcOrderReturnable(base, {
      items: [{ itemId: 'I1', quantity: 99 }],
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('invalid_quantity');
  });

  it('exposes refund trigger codes', () => {
    expect(RETURN_REFUND_TRIGGER_CODES.has('Liquidated')).toBe(true);
    expect(RETURN_REFUND_TRIGGER_CODES.has('Return_Picked')).toBe(true);
    expect(RETURN_REFUND_TRIGGER_CODES.has('Return_Delivered')).toBe(true);
  });
});
