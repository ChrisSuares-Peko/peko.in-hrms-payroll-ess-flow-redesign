/**
 * Discovery /search payloads: catalog_full, catalog_inc (start/pull), and
 * directed item search (no catalog tags).
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

const sent = () => JSON.parse(axios.default.post.mock.calls[0][1]);
const tagByCode = (tags, code) => (tags || []).find((t) => t.code === code);
const ACK = { status: 200, data: { message: { ack: { status: 'ACK' } } } };

beforeEach(() => {
  jest.clearAllMocks();
  ondc.clearOndcConfigCache();
  findServiceOperatorByAccessKey.mockResolvedValue(VENDOR);
  axios.default.post.mockResolvedValue(ACK);
});

describe('search catalogMode full', () => {
  it('sends inline catalog_full, finder fee, and a long ttl in production', async () => {
    await ondc.search({
      searchText: '',
      domain: 'ONDC:RET10',
      city: 'std:080',
      transactionId: 'txn-full',
      catalogMode: 'full',
    });

    const body = sent();
    expect(body.context.city).toBe('std:080');
    expect(body.context.domain).toBe('ONDC:RET10');
    expect(body.context.transaction_id).toBe('txn-full');
    expect(body.context.ttl).toBe('PT30M');
    expect(body.message.intent.item).toBeUndefined();
    expect(body.message.intent.fulfillment).toEqual({ type: 'Delivery' });
    expect(body.message.intent.payment).toEqual({
      '@ondc/org/buyer_app_finder_fee_type': 'percent',
      '@ondc/org/buyer_app_finder_fee_amount': '3',
    });
    expect(tagByCode(body.message.intent.tags, 'catalog_full')).toEqual({
      code: 'catalog_full',
      list: [{ code: 'payload_type', value: 'inline' }],
    });
    expect(tagByCode(body.message.intent.tags, 'bap_terms')).toBeTruthy();
    expect(tagByCode(body.message.intent.tags, 'catalog_inc')).toBeUndefined();
  });

  it('keeps payload_type link and configured ttl for Workbench', async () => {
    findServiceOperatorByAccessKey.mockResolvedValue({
      vendor: {
        ...VENDOR.vendor,
        optionals: { forceTransactionId: 'wb-txn', ttl: 'PT30S' },
      },
    });
    ondc.clearOndcConfigCache();

    await ondc.search({
      catalogMode: 'full',
      domain: 'ONDC:RET14',
      city: 'std:080',
      transactionId: 'ignored',
    });

    const body = sent();
    expect(body.context.transaction_id).toBe('wb-txn');
    expect(body.context.ttl).toBe('PT30S');
    expect(tagByCode(body.message.intent.tags, 'catalog_full')).toEqual({
      code: 'catalog_full',
      list: [{ code: 'payload_type', value: 'link' }],
    });
  });
});

describe('search catalogMode incremental', () => {
  it('forces city * and catalog_inc mode=start', async () => {
    await ondc.search({
      catalogMode: 'inc_start',
      domain: 'ONDC:RET16',
      city: 'std:080',
      transactionId: 'txn-start',
    });

    const body = sent();
    expect(body.context.city).toBe('*');
    expect(body.context.domain).toBe('ONDC:RET16');
    expect(body.message.intent.fulfillment).toBeUndefined();
    expect(tagByCode(body.message.intent.tags, 'catalog_inc')).toEqual({
      code: 'catalog_inc',
      list: [{ code: 'mode', value: 'start' }],
    });
    expect(tagByCode(body.message.intent.tags, 'catalog_full')).toBeUndefined();
  });

  it('sends catalog_inc start_time/end_time on pull', async () => {
    await ondc.search({
      catalogMode: 'inc_pull',
      domain: 'ONDC:RET16',
      startTime: '2026-08-23T00:00:00.000Z',
      endTime: '2026-08-24T00:00:00.000Z',
      transactionId: 'txn-pull',
    });

    const body = sent();
    expect(body.context.city).toBe('*');
    expect(tagByCode(body.message.intent.tags, 'catalog_inc')).toEqual({
      code: 'catalog_inc',
      list: [
        { code: 'start_time', value: '2026-08-23T00:00:00.000Z' },
        { code: 'end_time', value: '2026-08-24T00:00:00.000Z' },
      ],
    });
  });

  it('does not steal the Workbench pin for incremental search', async () => {
    findServiceOperatorByAccessKey.mockResolvedValue({
      vendor: {
        ...VENDOR.vendor,
        optionals: { forceTransactionId: 'wb-txn' },
      },
    });
    ondc.clearOndcConfigCache();

    await ondc.search({
      catalogMode: 'inc_start',
      domain: 'ONDC:RET16',
      transactionId: 'txn-start',
    });

    expect(sent().context.transaction_id).toBe('txn-start');
    expect(sent().context.city).toBe('*');
  });
});

describe('directed search', () => {
  it('omits catalog tags even if catalogMode is passed', async () => {
    await ondc.search({
      itemId: 'SKU-1',
      providerId: 'V1',
      bppId: 'seller.bpp',
      bppUri: 'https://seller.example/bpp',
      domain: 'ONDC:RET16',
      city: 'std:080',
      catalogMode: 'full',
      transactionId: 'txn-dir',
    });

    const body = sent();
    expect(body.context.city).toBe('std:080');
    expect(body.message.intent.item).toEqual({ id: 'SKU-1' });
    expect(body.message.intent.tags).toBeUndefined();
  });
});
