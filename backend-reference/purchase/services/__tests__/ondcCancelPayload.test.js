/**
 * The /cancel payload, including the force-cancellation descriptor, and the
 * settlement trail's fulfillment type.
 *
 * Enums here are not invented — they come from the network validator,
 * automation-specifications@release-eks-RET10-1.2.5 config/validations/index.yaml
 * (CANCEL_DESCRIPTOR / PARAMS_TAG / CANCEL_REQUEST_TAG).
 */

jest.mock('../../utils/checkAndFetchServiceDetails', () => ({
  findServiceOperatorByAccessKey: jest.fn(),
}));
jest.mock('libsodium-wrappers', () => ({
  ready: Promise.resolve(),
  crypto_generichash: jest.fn(() => new Uint8Array(64)),
  from_string: jest.fn((s) => s),
  to_base64: jest.fn(() => 'b64'),
  from_base64: jest.fn(() => new Uint8Array(64)),
  crypto_sign_detached: jest.fn(() => new Uint8Array(64)),
  base64_variants: { ORIGINAL: 1 },
}));
jest.mock('axios', () => ({ default: { post: jest.fn() } }));
jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }));

const axios = require('axios');
const { findServiceOperatorByAccessKey } = require('../../utils/checkAndFetchServiceDetails');
const ondc = require('../../services/ondc');

const VENDOR = {
  vendor: {
    apiUrl: 'https://gateway.example/',
    optional1: 'cHJpdmF0ZS1rZXk=',
    optional2: 'ukid-1',
    optional3: 'peko.example',
    optional4: 'https://peko.example/ondc',
    optional6: 'std:080',
    optionals: {},
  },
};

const sent = () => JSON.parse(axios.default.post.mock.calls[0][1]);

// These cases are about what goes on the wire, so the reply only has to get past
// the ACK check (assertOndcAck) — an ack-less body now throws before returning.
const ACK = { status: 200, data: { message: { ack: { status: 'ACK' } } } };

beforeEach(() => {
  jest.clearAllMocks();
  findServiceOperatorByAccessKey.mockResolvedValue(VENDOR);
  axios.default.post.mockResolvedValue(ACK);
});

const args = (over = {}) => ({
  bppId: 'seller.example',
  bppUri: 'https://seller.example/ondc',
  orderId: 'O-1',
  transactionId: 'txn-1',
  ...over,
});

describe('/cancel without force options', () => {
  // A caller that doesn't mention forcing must get byte-identical output to
  // before the force work existed — no stray descriptor on the wire.
  it('sends only order_id and the reason code', async () => {
    await ondc.cancel(args({ cancellationReasonId: '001' }));
    expect(sent().message).toEqual({
      order_id: 'O-1',
      cancellation_reason_id: '001',
    });
  });

  it('attaches no descriptor at all', async () => {
    await ondc.cancel(args());
    expect(sent().message.descriptor).toBeUndefined();
  });
});

describe('/cancel with the force descriptor', () => {
  const paramsList = (msg) =>
    Object.fromEntries(
      msg.descriptor.tags.find((t) => t.code === 'params').list.map((e) => [e.code, e.value])
    );

  it('sends force yes when forcing', async () => {
    await ondc.cancel(args({ force: true, cancellationReasonId: '001' }));
    expect(paramsList(sent().message).force).toBe('yes');
  });

  // The polite first leg of Forced_Cancellation_Flow (cancel_no) — same call,
  // force "no". Without this the two-attempt protocol can't be expressed.
  it('sends force no for the non-forced attempt', async () => {
    await ondc.cancel(args({ force: false }));
    expect(paramsList(sent().message).force).toBe('no');
  });

  it('only ever sends yes or no, never a boolean or a truthy string', async () => {
    for (const value of [true, false]) {
      jest.clearAllMocks();
      axios.default.post.mockResolvedValue(ACK);
      await ondc.cancel(args({ force: value }));
      expect(['yes', 'no']).toContain(paramsList(sent().message).force);
    }
  });

  it('carries ttl_response', async () => {
    await ondc.cancel(args({ force: true, ttlResponse: 'PT2H' }));
    expect(paramsList(sent().message).ttl_response).toBe('PT2H');
  });

  it('names us as the initiator', async () => {
    await ondc.cancel(args({ force: true }));
    const cancelRequest = sent().message.descriptor.tags.find((t) => t.code === 'cancel_request');
    expect(cancelRequest.list).toEqual([{ code: 'initiated_by', value: 'peko.example' }]);
  });

  it('carries the fulfillment being cancelled when given', async () => {
    await ondc.cancel(args({ force: true, fulfillmentId: 'F1' }));
    expect(sent().message.descriptor.short_desc).toBe('F1');
  });

  // Anything outside these enums is a validation failure on the network.
  it('uses only tag codes the validator accepts', async () => {
    await ondc.cancel(args({ force: true, fulfillmentId: 'F1' }));
    const { descriptor } = sent().message;

    for (const tag of descriptor.tags) {
      expect(['params', 'cancel_request']).toContain(tag.code);
    }
    const params = descriptor.tags.find((t) => t.code === 'params');
    for (const entry of params.list) {
      expect(['force', 'ttl_response']).toContain(entry.code);
    }
    const cancelRequest = descriptor.tags.find((t) => t.code === 'cancel_request');
    for (const entry of cancelRequest.list) {
      expect(['initiated_by']).toContain(entry.code);
    }
  });

  it('keeps order_id and the reason code alongside the descriptor', async () => {
    await ondc.cancel(args({ force: true, cancellationReasonId: '001' }));
    const { message } = sent();
    expect(message.order_id).toBe('O-1');
    expect(message.cancellation_reason_id).toBe('001');
  });

  it('posts to the BPP cancel endpoint', async () => {
    await ondc.cancel(args({ force: true }));
    expect(axios.default.post.mock.calls[0][0]).toBe('https://seller.example/ondc/cancel');
    expect(sent().context.action).toBe('cancel');
  });
});

describe('settlement trail fulfillment type', () => {
  const trailArgs = (over = {}) => ({
    bppId: 'seller.example',
    bppUri: 'https://seller.example/ondc',
    orderId: 'O-1',
    settlementAmount: 200,
    transactionId: 'txn-1',
    ...over,
  });

  // The network reads the fulfillment type to attribute the settlement, so a
  // cancellation refund filed as a Return is misattributed.
  it('files a cancellation refund against a Cancel fulfillment', async () => {
    await ondc.updateSettlementTrail(trailArgs({ fulfillmentType: 'Cancel', fulfillmentId: 'C1' }));
    const { order } = sent().message;
    expect(sent().message.update_target).toBe('payment');
    expect(order.fulfillments).toEqual([{ id: 'C1', type: 'Cancel' }]);
  });

  it('still defaults to Return, so the return path is unchanged', async () => {
    await ondc.updateSettlementTrail(trailArgs({ fulfillmentId: 'R1' }));
    expect(sent().message.order.fulfillments).toEqual([{ id: 'R1', type: 'Return' }]);
  });

  it('carries the refund phase and a normalised amount', async () => {
    await ondc.updateSettlementTrail(trailArgs({ settlementAmount: 200.5, fulfillmentType: 'Cancel' }));
    const [detail] = sent().message.order.payment['@ondc/org/settlement_details'];
    expect(detail.settlement_counterparty).toBe('buyer');
    expect(detail.settlement_phase).toBe('refund');
    expect(detail.settlement_amount).toBe('200.50');
  });

  it('accepts an explicit settlement phase for other trails', async () => {
    await ondc.updateSettlementTrail(trailArgs({ settlementPhase: 'sale-amount' }));
    const [detail] = sent().message.order.payment['@ondc/org/settlement_details'];
    expect(detail.settlement_phase).toBe('sale-amount');
  });
});

describe('/confirm fills the three fields the Workbench NACK named', () => {
  const ORDER_ID_RE = /^[0-9a-zA-Z/-_]{1,36}$/;

  const confirmArgs = (over = {}) => ({
    bppId: 'seller.example',
    bppUri: 'https://seller.example/ondc',
    transactionId: 'txn-1',
    paymentRef: 'pay-1',
    initOrder: {
      billing: { name: 'Asha Rao' },
      fulfillments: [{ id: 'F1', type: 'Delivery', end: { location: { gps: '12.920000,77.580000' } } }],
      quote: { price: { currency: 'INR', value: '100.00' } },
      payment: {},
      ...over.initOrder,
    },
    ...over,
  });

  it('mints an ORDER_ID, sets state Created, and puts the billing name on the recipient', async () => {
    await ondc.confirm(confirmArgs());
    const { order } = sent().message;

    expect(order.id).toMatch(ORDER_ID_RE);
    expect(order.id).not.toContain('-');
    expect(order.state).toBe('Created');
    expect(order.fulfillments[0].end.person.name).toBe('Asha Rao');
  });

  it('keeps a seller-issued id that already satisfies the regex', async () => {
    await ondc.confirm(confirmArgs({ initOrder: { id: 'SELLERO1', billing: { name: 'Asha Rao' }, fulfillments: [{ id: 'F1', type: 'Delivery', end: {} }], quote: { price: { value: '1' } }, payment: {} } }));
    expect(sent().message.order.id).toBe('SELLERO1');
  });

  it('puts person.name on /init so confirm can echo it', async () => {
    await ondc.init({
      bppId: 'seller.example',
      bppUri: 'https://seller.example/ondc',
      bppProviderId: 'P1',
      bppLocationId: 'L1',
      items: [{ id: 'I1', quantity: 1, locationId: 'L1' }],
      billing: { name: 'Asha Rao', phone: '9876543210', areaCode: '560001' },
    });
    expect(sent().message.order.fulfillments[0].end.person.name).toBe('Asha Rao');
  });

  it('never sends a missing or hyphenated fulfillment id', async () => {
    await ondc.confirm(confirmArgs({
      initOrder: {
        billing: { name: 'Asha Rao' },
        items: [{ id: 'I1', fulfillment_id: '550e8400-e29b-41d4-a716-446655440000' }],
        fulfillments: [
          { type: 'Delivery', end: {} },
          { id: '550e8400-e29b-41d4-a716-446655440000', type: 'Delivery', end: {} },
        ],
        quote: { price: { value: '1' } },
        payment: {},
      },
    }));
    const { order } = sent().message;
    for (const f of order.fulfillments) {
      expect(f.id).toMatch(ORDER_ID_RE);
      expect(f.id).toBeDefined();
    }
    expect(order.fulfillments[0].id).toBe('F1');
    expect(order.fulfillments[1].id).toBe('550e8400e29b41d4a716446655440000');
    expect(order.items[0].fulfillment_id).toBe('550e8400e29b41d4a716446655440000');
  });
});
