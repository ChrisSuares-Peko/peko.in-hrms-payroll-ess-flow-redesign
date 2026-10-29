jest.mock('../../models/entities/corporateUser', () => ({ findOne: jest.fn() }));
jest.mock('../../utils/emailer', () => ({
  email: jest.fn((to, subject, body, cb) => {
    if (cb) cb();
  }),
}));
jest.mock('../../utils/partnerLogos', () => ({
  partnerLogos: jest.fn().mockResolvedValue({ logo: 'https://cdn.peko/logo.png', baseUrl: 'https://in.peko.one' }),
}));
jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }));

const corporateUserEntity = require('../../models/entities/corporateUser');
const emailer = require('../../utils/emailer');
const { sendOndcReturnInitiatedEmail } = require('../ondcRefundCancelNotify');

const ROW = {
  id: 7,
  orderId: 'ONDC-123',
  transactionId: 'txn-1',
  corporateUserId: 42,
};

const ARGS = {
  row: ROW,
  returnRequestId: 'Rabc123',
  items: ['20 Litre Water Can × 1', '10 Litre Water Can × 2'],
  reason: 'Item damaged',
};

/** [to, subject, body] of the most recent send. */
const lastMail = () => emailer.email.mock.calls.at(-1);

beforeEach(() => {
  jest.clearAllMocks();
  corporateUserEntity.findOne.mockResolvedValue({
    id: 42,
    email: 'buyer@acme.example',
    contactPersonName: 'Faris',
  });
});

describe('sendOndcReturnInitiatedEmail', () => {
  it('mails the order\'s corporate account', async () => {
    await sendOndcReturnInitiatedEmail(ARGS);

    expect(corporateUserEntity.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 42 } })
    );
    const [to, subject] = lastMail();
    expect(to).toBe('buyer@acme.example');
    expect(subject).toBe('Your return request has been raised');
  });

  it('puts the order, request id, items and reason in the body', async () => {
    await sendOndcReturnInitiatedEmail(ARGS);

    const [, , body] = lastMail();
    expect(body).toContain('ONDC-123');
    expect(body).toContain('Rabc123');
    expect(body).toContain('20 Litre Water Can × 1');
    expect(body).toContain('10 Litre Water Can × 2');
    expect(body).toContain('Item damaged');
    expect(body).toContain('Faris');
  });

  // The refund is a separate flow with its own email — quoting a figure here would be
  // a second source of truth.
  it('promises no refund amount', async () => {
    await sendOndcReturnInitiatedEmail(ARGS);

    const [, , body] = lastMail();
    expect(body).not.toMatch(/₹|Refund amount/i);
  });

  it('falls back to the transactionId when the order has no BPP order id', async () => {
    await sendOndcReturnInitiatedEmail({ ...ARGS, row: { ...ROW, orderId: null } });

    expect(lastMail()[2]).toContain('txn-1');
  });

  it('greets generically when the corporate has no contact name', async () => {
    corporateUserEntity.findOne.mockResolvedValue({ id: 42, email: 'buyer@acme.example' });

    await sendOndcReturnInitiatedEmail(ARGS);

    expect(lastMail()[2]).toContain('Hi there');
  });

  it('sends nothing when no corporate email resolves', async () => {
    corporateUserEntity.findOne.mockResolvedValue({ id: 42, email: null });

    await expect(sendOndcReturnInitiatedEmail(ARGS)).resolves.toBeUndefined();
    expect(emailer.email).not.toHaveBeenCalled();
  });

  // The caller has already committed the return and computed its 200 — a mail failure
  // must never turn that into an error response.
  it('swallows a lookup failure instead of throwing at the caller', async () => {
    corporateUserEntity.findOne.mockRejectedValue(new Error('db down'));

    await expect(sendOndcReturnInitiatedEmail(ARGS)).resolves.toBeUndefined();
    expect(emailer.email).not.toHaveBeenCalled();
  });

  it('swallows an emailer failure', async () => {
    emailer.email.mockImplementation(() => {
      throw new Error('smtp down');
    });

    await expect(sendOndcReturnInitiatedEmail(ARGS)).resolves.toBeUndefined();
  });
});
