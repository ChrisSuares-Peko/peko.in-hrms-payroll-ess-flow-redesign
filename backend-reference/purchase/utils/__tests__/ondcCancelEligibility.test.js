const {
  isShippedOrBeyond,
  assertOndcOrderCancellable,
  isForceCancellable,
  SHIPPED_OR_BEYOND_CODES,
} = require('../ondcCancelEligibility');

const withDelivery = (code) => ({
  type: 'Delivery',
  state: { descriptor: { code } },
});

describe('isShippedOrBeyond', () => {
  it('allows pre-shipping states', () => {
    expect(isShippedOrBeyond({ fulfillments: [withDelivery('Pending')] })).toBe(false);
    expect(isShippedOrBeyond({ fulfillments: [withDelivery('Packed')] })).toBe(false);
    expect(isShippedOrBeyond({ fulfillments: [withDelivery('Agent-assigned')] })).toBe(false);
    expect(isShippedOrBeyond({ fulfillments: [withDelivery('Out-for-pickup')] })).toBe(false);
    expect(isShippedOrBeyond({ fulfillments: [] })).toBe(false);
    expect(isShippedOrBeyond({})).toBe(false);
  });

  it('blocks once picked up or further', () => {
    for (const code of SHIPPED_OR_BEYOND_CODES) {
      expect(isShippedOrBeyond({ fulfillments: [withDelivery(code)] })).toBe(true);
    }
  });

  it('blocks when deliveredAt or Completed', () => {
    expect(isShippedOrBeyond({ deliveredAt: new Date() })).toBe(true);
    expect(isShippedOrBeyond({ orderState: 'Completed' })).toBe(true);
  });
});

describe('assertOndcOrderCancellable', () => {
  const base = {
    orderState: 'Created',
    bppUri: 'https://bpp.example.com',
    orderId: 'O-1',
    quote: { rows: [{ titleType: 'item', cancellable: true }] },
    fulfillments: [withDelivery('Packed')],
  };

  it('allows a packed cancellable order', () => {
    expect(assertOndcOrderCancellable(base)).toEqual({ ok: true });
  });

  it('rejects shipped orders', () => {
    const result = assertOndcOrderCancellable({
      ...base,
      fulfillments: [withDelivery('Order-picked-up')],
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('already_shipped');
  });

  it('rejects seller policy non-cancellable items', () => {
    const result = assertOndcOrderCancellable({
      ...base,
      quote: { rows: [{ titleType: 'item', cancellable: false }] },
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('seller_policy');
  });

  it('rejects terminal states', () => {
    expect(assertOndcOrderCancellable({ ...base, orderState: 'Cancelled' }).reason).toBe(
      'terminal_state'
    );
  });
});

// ONDC's descriptor.tags[params].force = yes exists to cancel past a seller's
// refusal or after the parcel has left them (triggering RTO). It does not make
// structurally impossible cancellations possible.
describe('assertOndcOrderCancellable with force', () => {
  const base = {
    orderState: 'In-progress',
    bppUri: 'https://bpp.example.com',
    orderId: 'O-1',
    quote: { rows: [{ titleType: 'item', cancellable: true }] },
    fulfillments: [withDelivery('Out-for-delivery')],
  };

  it('overrides already_shipped — the whole point of a force cancel', () => {
    expect(assertOndcOrderCancellable(base).reason).toBe('already_shipped');
    expect(assertOndcOrderCancellable(base, { force: true })).toEqual({ ok: true });
  });

  it('overrides the seller policy flag', () => {
    const refused = {
      ...base,
      fulfillments: [withDelivery('Packed')],
      quote: { rows: [{ titleType: 'item', cancellable: false }] },
    };
    expect(assertOndcOrderCancellable(refused).reason).toBe('seller_policy');
    expect(assertOndcOrderCancellable(refused, { force: true })).toEqual({ ok: true });
  });

  it('overrides even a delivered order', () => {
    const delivered = { ...base, deliveredAt: new Date(), fulfillments: [withDelivery('Order-delivered')] };
    expect(assertOndcOrderCancellable(delivered, { force: true })).toEqual({ ok: true });
  });

  it('still refuses an already-cancelled order — force is not a time machine', () => {
    const done = { ...base, orderState: 'Cancelled' };
    expect(assertOndcOrderCancellable(done, { force: true }).ok).toBe(false);
    expect(assertOndcOrderCancellable(done, { force: true }).reason).toBe('terminal_state');
  });

  it('still refuses a completed order', () => {
    const done = { ...base, orderState: 'Completed' };
    expect(assertOndcOrderCancellable(done, { force: true }).reason).toBe('terminal_state');
  });

  it('still refuses without a seller order reference — nothing to send', () => {
    for (const missing of [{ bppUri: null }, { orderId: null }]) {
      const row = { ...base, ...missing };
      expect(assertOndcOrderCancellable(row, { force: true }).reason).toBe('missing_seller_ref');
    }
  });

  it('still refuses an order that does not exist', () => {
    expect(assertOndcOrderCancellable(null, { force: true }).reason).toBe('not_found');
  });

  it('leaves an ordinary cancellable order untouched', () => {
    const fine = { ...base, orderState: 'Created', fulfillments: [withDelivery('Packed')] };
    expect(assertOndcOrderCancellable(fine)).toEqual({ ok: true });
    expect(assertOndcOrderCancellable(fine, { force: true })).toEqual({ ok: true });
  });

  it('defaults to non-force when no options are passed', () => {
    expect(assertOndcOrderCancellable(base, {}).reason).toBe('already_shipped');
    expect(assertOndcOrderCancellable(base).reason).toBe('already_shipped');
  });
});

// Drives whether the operator is offered the force path at all.
describe('isForceCancellable', () => {
  const base = {
    orderState: 'In-progress',
    bppUri: 'https://bpp.example.com',
    orderId: 'O-1',
    quote: { rows: [{ titleType: 'item', cancellable: true }] },
  };

  it('is true when only a force-overridable reason blocks it', () => {
    expect(isForceCancellable({ ...base, fulfillments: [withDelivery('Out-for-delivery')] })).toBe(true);
    expect(
      isForceCancellable({ ...base, quote: { rows: [{ titleType: 'item', cancellable: false }] } })
    ).toBe(true);
  });

  it('is false when a normal cancel would already work', () => {
    expect(isForceCancellable({ ...base, fulfillments: [withDelivery('Packed')] })).toBe(false);
  });

  it('is false when nothing could make it cancellable', () => {
    expect(isForceCancellable({ ...base, orderState: 'Cancelled' })).toBe(false);
    expect(isForceCancellable({ ...base, bppUri: null })).toBe(false);
    expect(isForceCancellable(null)).toBe(false);
  });
});
