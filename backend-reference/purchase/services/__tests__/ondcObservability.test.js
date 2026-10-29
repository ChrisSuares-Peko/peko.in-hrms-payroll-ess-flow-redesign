/**
 * Network Observability envelopes: PII mask, ACK vs 4xx, skip when unconfigured.
 */

jest.mock('../../utils/checkAndFetchServiceDetails', () => ({
  findServiceOperatorByAccessKey: jest.fn(),
}));
jest.mock('axios', () => ({ default: { post: jest.fn() } }));
jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }));

const axios = require('axios');
const { findServiceOperatorByAccessKey } = require('../../utils/checkAndFetchServiceDetails');
const {
  anonymizeOndcPayload,
  normalizeNoApiUrl,
  buildOutboundEnvelopes,
  buildInboundEnvelopes,
  reportOutbound,
  clearNoConfigCache,
} = require('../ondcObservability');

const INIT_PAYLOAD = {
  context: {
    action: 'init',
    transaction_id: 'txn-1',
    city: 'std:080',
  },
  message: {
    order: {
      billing: {
        name: 'faris',
        phone: '9999999999',
        email: 'faris@example.com',
        address: {
          name: 'faris',
          city: 'Bengaluru',
          area_code: '560048',
        },
      },
      fulfillments: [
        {
          end: {
            person: { name: 'faris' },
            contact: { phone: '9999999999', email: 'faris@example.com' },
          },
        },
      ],
      quote: {
        breakup: [{ title: 'Plain Atta', price: { value: '200.00' } }],
      },
    },
  },
};

const ACK = { message: { ack: { status: 'ACK' } } };

beforeEach(() => {
  jest.clearAllMocks();
  clearNoConfigCache();
  findServiceOperatorByAccessKey.mockResolvedValue({ error: 'Service is disabled' });
  axios.default.post.mockResolvedValue({ status: 200, data: { message: 'Successful' } });
});

describe('normalizeNoApiUrl', () => {
  it('keeps a full push-txn-logs URL', () => {
    expect(
      normalizeNoApiUrl('https://analytics-api-pre-prod.aws.ondc.org/v1/api/push-txn-logs')
    ).toBe('https://analytics-api-pre-prod.aws.ondc.org/v1/api/push-txn-logs');
  });

  it('appends the path when only the host is stored', () => {
    expect(normalizeNoApiUrl('https://analytics-api-pre-prod.aws.ondc.org')).toBe(
      'https://analytics-api-pre-prod.aws.ondc.org/v1/api/push-txn-logs'
    );
  });
});

describe('anonymizeOndcPayload', () => {
  it('masks phone, email, and person/billing names, keeps city, pincode, and item title', () => {
    const out = anonymizeOndcPayload(INIT_PAYLOAD);
    expect(out.message.order.billing.name).toBe('****');
    expect(out.message.order.billing.phone).toBe('****');
    expect(out.message.order.billing.email).toBe('****');
    expect(out.message.order.billing.address.name).toBe('****');
    expect(out.message.order.fulfillments[0].end.person.name).toBe('****');
    expect(out.message.order.fulfillments[0].end.contact.phone).toBe('****');
    expect(out.message.order.billing.address.city).toBe('Bengaluru');
    expect(out.message.order.billing.address.area_code).toBe('560048');
    expect(out.message.order.quote.breakup[0].title).toBe('Plain Atta');
    expect(out.context.city).toBe('std:080');
  });
});

describe('buildOutboundEnvelopes', () => {
  it('sends init then init_response on HTTP 200 ACK', () => {
    const envelopes = buildOutboundEnvelopes({
      action: 'init',
      requestPayload: INIT_PAYLOAD,
      httpStatus: 200,
      responseData: ACK,
    });
    expect(envelopes.map((e) => e.type)).toEqual(['init', 'init_response']);
    expect(envelopes[0].data.context.action).toBe('init');
    expect(envelopes[1].data.message.ack.status).toBe('ACK');
  });

  it('attaches TECH-ERROR on HTTP 401 and omits _response', () => {
    const envelopes = buildOutboundEnvelopes({
      action: 'init',
      requestPayload: INIT_PAYLOAD,
      httpStatus: 401,
      responseData: { error: { message: 'unauthorized' } },
    });
    expect(envelopes).toHaveLength(1);
    expect(envelopes[0].type).toBe('init');
    expect(envelopes[0].data.error).toEqual({
      type: 'TECH-ERROR',
      code: '401',
      message: 'unauthorized',
    });
  });
});

describe('buildInboundEnvelopes', () => {
  it('types the callback as context.action and the ACK as action_response', () => {
    const envelopes = buildInboundEnvelopes({
      reqBody: INIT_PAYLOAD,
      ackBody: ACK,
    });
    expect(envelopes.map((e) => e.type)).toEqual(['init', 'init_response']);
  });
});

describe('reportOutbound skip when unconfigured', () => {
  it('posts nothing when the vendor row is missing', async () => {
    reportOutbound({
      action: 'init',
      requestPayload: INIT_PAYLOAD,
      httpStatus: 200,
      responseData: ACK,
    });
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
    expect(axios.default.post).not.toHaveBeenCalled();
  });

  it('posts type + Bearer token when the vendor row is set', async () => {
    findServiceOperatorByAccessKey.mockResolvedValue({
      vendor: {
        apiUrl: 'https://analytics-api-pre-prod.aws.ondc.org/v1/api/push-txn-logs',
        optional1: 'portal-token',
      },
    });
    reportOutbound({
      action: 'init',
      requestPayload: INIT_PAYLOAD,
      httpStatus: 200,
      responseData: ACK,
    });
    await new Promise((resolve) => setImmediate(resolve));
    await Promise.resolve();
    await Promise.resolve();
    expect(axios.default.post).toHaveBeenCalled();
    const types = axios.default.post.mock.calls.map((c) => c[1].type);
    expect(types).toEqual(['init', 'init_response']);
    expect(axios.default.post.mock.calls[0][2].headers.Authorization).toBe('Bearer portal-token');
  });
});
