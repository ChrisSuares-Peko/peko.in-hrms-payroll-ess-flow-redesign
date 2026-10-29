/**
 * /select must never put an empty address.area_code on the wire — Polestar
 * (and the network validator) NACKs that. pinCOde is required before POST.
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
jest.mock('../ondcObservability', () => ({
  reportOutbound: jest.fn(),
  reportInbound: jest.fn(),
}));

const axios = require('axios');
const { findServiceOperatorByAccessKey } = require('../../utils/checkAndFetchServiceDetails');
const ondc = require('../ondc');

const VENDOR = {
  vendor: {
    apiUrl: 'https://gateway.example/',
    optional1: 'cHJpdmF0ZS1rZXk=',
    optional2: 'ukid-1',
    optional3: 'peko.example',
    optional4: 'https://peko.example/ondc',
    optional5: 'ONDC:RET14',
    optional6: 'std:080',
    optionals: {},
  },
};

const ACK = { status: 200, data: { message: { ack: { status: 'ACK' } } } };
const sent = () => JSON.parse(axios.default.post.mock.calls[0][1]);

const SELECT_BASE = {
  bppProviderId: 'P1',
  bppLocationId: 'L1',
  bppId: 'bpp.example',
  bppUri: 'https://bpp.example',
  domain: 'ONDC:RET14',
  city: 'std:080',
  transactionId: 'txn-select-1',
  items: [{ id: 'SKU-1', quantity: 1, locationId: 'L1', fulfillmentId: 'F1' }],
};

beforeEach(() => {
  jest.clearAllMocks();
  ondc.clearOndcConfigCache();
  findServiceOperatorByAccessKey.mockResolvedValue(VENDOR);
  axios.default.post.mockResolvedValue(ACK);
});

describe('select area_code', () => {
  it('throws and does not POST when pinCOde is empty', async () => {
    expect(() => ondc.select({ ...SELECT_BASE, pinCOde: '' })).toThrow(
      'ONDC select: areaCode is required'
    );
    expect(() => ondc.select({ ...SELECT_BASE, pinCOde: '   ' })).toThrow(
      'ONDC select: areaCode is required'
    );
    expect(() => ondc.select({ ...SELECT_BASE })).toThrow(
      'ONDC select: areaCode is required'
    );
    expect(axios.default.post).not.toHaveBeenCalled();
  });

  it('sends the PIN as fulfillments[0].end.location.address.area_code', async () => {
    await ondc.select({ ...SELECT_BASE, pinCOde: '560001' });

    const body = sent();
    expect(body.message.order.fulfillments[0].end.location.address.area_code).toBe(
      '560001'
    );
    expect(axios.default.post).toHaveBeenCalledTimes(1);
  });
});
