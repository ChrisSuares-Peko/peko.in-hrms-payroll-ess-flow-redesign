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
jest.mock('axios', () => ({
  default: { post: jest.fn() },
}));
jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }));

const axios = require('axios');
const { findServiceOperatorByAccessKey } = require('../../utils/checkAndFetchServiceDetails');
const ondc = require('../../services/ondc');
const { buildReturnRequestTagList } = ondc;

const ACK = { status: 200, data: { message: { ack: { status: 'ACK' } } } };
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

beforeEach(() => {
  jest.clearAllMocks();
  findServiceOperatorByAccessKey.mockResolvedValue(VENDOR);
  axios.default.post.mockResolvedValue(ACK);
});

const sent = () => JSON.parse(axios.default.post.mock.calls[0][1]);

describe('buildReturnRequestTagList', () => {
  it('matches DigiDukaan Scenario 2 return_request fields', () => {
    const list = buildReturnRequestTagList({
      id: 'R1',
      itemId: 'I1',
      itemQuantity: 5,
      reasonId: '003',
      reasonDesc: 'Product quality not as expected',
      images: ['https://a.jpg', 'https://b.jpg'],
      ttlApproval: 'PT24H',
      ttlReverseQc: 'P3D',
    });
    const byCode = Object.fromEntries(list.map((e) => [e.code, e.value]));
    expect(byCode.id).toBe('R1');
    expect(byCode.item_id).toBe('I1');
    expect(byCode.item_quantity).toBe('5');
    expect(byCode.reason_id).toBe('003');
    expect(byCode.reason_desc).toContain('quality');
    expect(byCode.images).toBe('https://a.jpg,https://b.jpg');
    expect(byCode.ttl_approval).toBe('PT24H');
    expect(byCode.ttl_reverseqc).toBe('P3D');
    // Return_Flow: omit replace → "no". Replacement_Flow sends "yes".
    expect(byCode.replace).toBe('no');
  });

  it('sends replace yes for the Workbench Replacement Flow', () => {
    const list = buildReturnRequestTagList({ id: 'RP1', itemId: 'I1', replace: true });
    expect(Object.fromEntries(list.map((e) => [e.code, e.value])).replace).toBe('yes');
  });
});

describe('/update return fulfillments carry FULFILLMENTS_ID', () => {
  const ID_RE = /^[0-9a-zA-Z/-_]{1,36}$/;

  it('puts the return_request id on fulfillments[].id — tags alone were NACKed', async () => {
    await ondc.update({
      bppId: 'seller.example',
      bppUri: 'https://seller.example/ondc',
      orderId: 'ORDER1',
      transactionId: 'txn-1',
      returnRequest: { id: 'Rabc123', itemId: 'I1', itemQuantity: 1 },
    });
    const fulfillment = sent().message.order.fulfillments[0];
    expect(fulfillment.id).toBe('Rabc123');
    expect(fulfillment.id).toMatch(ID_RE);
    expect(fulfillment.type).toBe('Return');
    const tagId = fulfillment.tags[0].list.find((e) => e.code === 'id').value;
    expect(tagId).toBe(fulfillment.id);
  });

  it('strips hyphens so a UUID return id still matches the regex', async () => {
    await ondc.update({
      bppId: 'seller.example',
      bppUri: 'https://seller.example/ondc',
      orderId: 'ORDER1',
      returnRequest: { id: '550e8400-e29b-41d4-a716-446655440000', itemId: 'I1' },
    });
    const fulfillment = sent().message.order.fulfillments[0];
    expect(fulfillment.id).toBe('550e8400e29b41d4a716446655440000');
    expect(fulfillment.id).toMatch(ID_RE);
  });
});

describe('/update replace tag on the wire', () => {
  const tagReplace = () =>
    sent().message.order.fulfillments[0].tags[0].list.find((e) => e.code === 'replace').value;

  it('defaults to no so Return_Flow is unchanged', async () => {
    await ondc.update({
      bppId: 'seller.example',
      bppUri: 'https://seller.example/ondc',
      orderId: 'ORDER1',
      returnRequest: { id: 'R1', itemId: 'I1' },
    });
    expect(tagReplace()).toBe('no');
  });

  it('sends yes when the caller asks for a replacement', async () => {
    await ondc.update({
      bppId: 'seller.example',
      bppUri: 'https://seller.example/ondc',
      orderId: 'ORDER1',
      returnRequest: { id: 'RP1', itemId: 'I1', replace: true },
    });
    expect(tagReplace()).toBe('yes');
  });
});
