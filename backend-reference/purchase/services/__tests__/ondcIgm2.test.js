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
const {
  seedIgm2OpenSession,
  appendBuyerAction,
  buildIgm2IssueMessage,
  pickIgm2Resolution,
} = require('../../services/ondcIgm2');
const { ISSUE_LEVEL } = require('../../utils/ondcIgmStatus');

const ACK = { status: 200, data: { message: { ack: { status: 'ACK' } } } };
const VENDOR = {
  vendor: {
    apiUrl: 'https://gateway.example/',
    optional1: 'cHJpdmF0ZS1rZXk=',
    optional2: 'ukid-1',
    optional3: 'peko.example',
    optional4: 'https://peko.example/ondc',
    optional5: 'ONDC:RET10',
    optional6: 'std:080',
    optionals: { forceTransactionId: 'wb-txn' },
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  findServiceOperatorByAccessKey.mockResolvedValue(VENDOR);
  axios.default.post.mockResolvedValue(ACK);
  ondc.clearOndcConfigCache();
});

const sent = () => JSON.parse(axios.default.post.mock.calls[0][1]);

const order = {
  orderId: 'ORD123',
  providerId: 'P1',
  fulfillments: [{ id: 'F1', type: 'Delivery' }],
  quote: { rows: [{ titleType: 'item', itemId: 'I1', quantity: 1 }] },
  billing: { name: 'Asha Rao', phone: '9876543210', email: 'a@b.c' },
};

describe('IGM 2.0 outbound /issue', () => {
  it('sends actors/refs/actions instead of issue_actions when igm2Session is set', async () => {
    const session = seedIgm2OpenSession({
      cfg: { bapId: 'peko.example', domain: 'ONDC:RET10' },
      order,
      issueId: 'ISSUE-1',
      category: 'ITEM',
      description: 'Item damaged',
      now: '2026-08-19T04:00:00.000Z',
    });

    await ondc.issue({
      bppId: 'workbench.ondc.tech',
      bppUri: 'https://workbench.ondc.tech/seller',
      issueId: 'ISSUE-1',
      orderId: 'ORD123',
      igm2Session: session,
      wireStatus: 'OPEN',
      transactionId: 'txn-1',
    });

    const { issue } = sent().message;
    expect(issue.actions).toEqual(expect.any(Array));
    expect(issue.actors.map((a) => a.type)).toEqual(expect.arrayContaining(['CONSUMER', 'INTERFACING_NP']));
    expect(issue.refs.map((r) => r.ref_type)).toEqual(expect.arrayContaining(['ORDER', 'PROVIDER', 'FULFILLMENT', 'ITEM']));
    expect(issue.issue_actions).toBeUndefined();
    expect(issue.actions[0].descriptor.code).toBe('OPEN');
    expect(issue.status).toBe('OPEN');
    expect(issue.level).toBe('ISSUE');
    expect(issue.descriptor.code).toBe('ITM004');
    expect(issue.descriptor.additional_desc).toEqual({
      url: expect.any(String),
      content_type: 'text/plain',
    });
  });

  it('keeps IGM 1.0 issue_actions when igm2Session is omitted', async () => {
    await ondc.issue({
      bppId: 'seller.example',
      bppUri: 'https://seller.example/ondc',
      issueId: 'ISSUE-1',
      orderId: 'ORD123',
      category: 'ITEM',
      description: 'broken',
      complainantActions: [{ complainant_action: 'OPEN', short_desc: 'broken', updated_at: '2026-08-19T04:00:00.000Z' }],
    });

    expect(sent().message.issue.issue_actions).toBeDefined();
    expect(sent().message.issue.actions).toBeUndefined();
  });
});

describe('IGM 2.0 follow-up payloads', () => {
  const baseSession = () =>
    seedIgm2OpenSession({
      cfg: { bapId: 'peko.example', domain: 'ONDC:RET10' },
      order,
      issueId: 'ISSUE-1',
      category: 'ITEM',
      description: 'Item damaged',
      now: '2026-08-19T04:00:00.000Z',
    });

  it('escalate uses Workbench GREVIENCE spelling', () => {
    const escalated = appendBuyerAction(baseSession(), {
      bapId: 'peko.example',
      code: 'ESCALATED',
      shortDesc: 'Escalating',
      now: '2026-08-19T05:00:00.000Z',
      extra: { level: ISSUE_LEVEL.GRIEVANCE },
    });
    escalated.level = ISSUE_LEVEL.GRIEVANCE;
    const message = buildIgm2IssueMessage(escalated, {
      issueId: 'ISSUE-1',
      status: 'OPEN',
      now: '2026-08-19T05:00:00.000Z',
      withUpdateTarget: true,
    });
    expect(message.issue.level).toBe('GREVIENCE');
    expect(message.update_target).toEqual([{ path: 'issue.actions', action: 'APPENDED' }]);
    expect(message.issue.actions.map((a) => a.descriptor.code)).toContain('ESCALATED');
  });

  it('never omits level and maps spec GRIEVANCE onto Workbench GREVIENCE', () => {
    const missing = { ...baseSession() };
    delete missing.level;
    expect(buildIgm2IssueMessage(missing, { issueId: 'ISSUE-1', status: 'OPEN', now: '2026-08-19T04:00:00.000Z' }).issue.level).toBe('ISSUE');

    const specSpelling = { ...baseSession(), level: 'GRIEVANCE' };
    expect(buildIgm2IssueMessage(specSpelling, { issueId: 'ISSUE-1', status: 'OPEN', now: '2026-08-19T04:00:00.000Z' }).issue.level).toBe('GREVIENCE');

    const wrapped = { ...baseSession(), level: ['ISSUE'] };
    expect(buildIgm2IssueMessage(wrapped, { issueId: 'ISSUE-1', status: 'OPEN', now: '2026-08-19T04:00:00.000Z' }).issue.level).toBe('ISSUE');
  });

  it('accept prefers R2 replacement over R1 refund', () => {
    const chosen = pickIgm2Resolution(
      [
        { id: 'R_PARENT', descriptor: { code: 'PARENT' } },
        { id: 'R1', descriptor: { code: 'REFUND' } },
        { id: 'R2', descriptor: { code: 'REPLACEMENT' } },
      ],
      { preferReplacement: true }
    );
    expect(chosen.id).toBe('R2');
    expect(chosen.descriptor.code).toBe('REPLACEMENT');
  });
});
