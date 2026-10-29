/**
 * paymentGateway sends each seller's /confirm from the payment callback and records
 * it (services/ondcConfirmDispatch.js). The models are an in-memory store with real
 * unique keys and compare-and-set updates, so a repeated callback is exercised
 * against the same guarantees the database gives.
 */

const mockDb = { checkouts: [], attempts: [], seq: 1 };
const mockMatches = (row, where = {}) => Object.entries(where).every(([key, value]) => row[key] === value);

jest.mock('../../models/entities/ondc_confirm_readwrite', () => {
  const { UniqueConstraintError } = require('sequelize');
  return {
    ondcCheckoutConfirms: {
      findOne: jest.fn(async ({ where }) => {
        const row = mockDb.checkouts.find((c) => c.paymentRef === where.paymentRef);
        return row ? { ...row } : null;
      }),
      create: jest.fn(async (values) => {
        if (mockDb.checkouts.some((c) => c.paymentRef === values.paymentRef)) {
          throw new UniqueConstraintError({ message: 'Duplicate entry' });
        }
        const row = { id: mockDb.seq++, ...values };
        mockDb.checkouts.push(row);
        return { get: () => ({ ...row }) };
      }),
    },
    ondcConfirmAttempts: {
      bulkCreate: jest.fn(async (rows) => {
        for (const row of rows) {
          const dup = mockDb.attempts.some(
            (a) => a.paymentRef === row.paymentRef && a.transactionId === row.transactionId
          );
          if (!dup) mockDb.attempts.push({ id: mockDb.seq++, ...row });
        }
        return rows;
      }),
      findAll: jest.fn(async ({ where }) =>
        mockDb.attempts.filter((a) => mockMatches(a, where)).map((a) => ({ ...a }))
      ),
      update: jest.fn(async (patch, { where }) => {
        const row = mockDb.attempts.find((a) => mockMatches(a, where));
        if (!row) return [0];
        Object.assign(row, patch);
        return [1];
      }),
    },
  };
});
jest.mock('../../models/use-cases/ondc_callback_log', () => ({
  findLatestOnInitByTransactionId: jest.fn(),
}));
jest.mock('../ondc', () => ({
  confirm: jest.fn(),
  toOndcNetworkId: (candidate) => {
    const raw = String(candidate || '').trim();
    return /^[0-9a-zA-Z/-_]{1,36}$/.test(raw) ? raw : null;
  },
}));
jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }));

const { findLatestOnInitByTransactionId } = require('../../models/use-cases/ondc_callback_log');
const ondc = require('../ondc');
const { dispatchCheckoutConfirms } = require('../ondcConfirmDispatch');

const PAYMENT_REF = '1785921646907';
const T1 = 'txn-seller-one';
const T2 = 'txn-seller-two';
const BPP_URI = 'https://bpp.example.com/ondc';
const GROUPS = [
  { transactionId: T1, amount: 100, vendorName: 'Seller One', providerId: 'P1' },
  { transactionId: T2, amount: 50, vendorName: 'Seller Two', providerId: 'P2' },
];
const USER = { id: 7, corporateId: 42, role: 'CORPORATE' };
const PG_RESPONSE = [{ payment_status: 'SUCCESS', payment_amount: 157.5 }];

const onInitFor = (transactionId, total) => ({
  bppId: 'bpp.example.com',
  bppUri: BPP_URI,
  domain: 'ONDC:RET10',
  payload: {
    context: { city: 'std:080', bpp_id: 'bpp.example.com', bpp_uri: BPP_URI, transaction_id: transactionId },
    message: { order: { provider: { id: `P-${transactionId}` }, quote: { price: { value: String(total) } } } },
  },
});
const nack = (message) =>
  Object.assign(new Error(`ONDC confirm refused: ${message}`), {
    name: 'OndcAckError',
    ondcCode: '40000',
    ondcMessage: message,
    ackStatus: 'NACK',
    httpStatus: 200,
  });
const attemptFor = (transactionId) => mockDb.attempts.find((a) => a.transactionId === transactionId);
const dispatch = () =>
  dispatchCheckoutConfirms({
    paymentRef: PAYMENT_REF,
    ondcGroups: GROUPS,
    user: USER,
    pgResponse: PG_RESPONSE,
    pgAmount: '157.50',
    logTraceId: 't',
  });

beforeEach(() => {
  jest.clearAllMocks();
  mockDb.checkouts = [];
  mockDb.attempts = [];
  mockDb.seq = 1;
  findLatestOnInitByTransactionId.mockImplementation(async (transactionId) =>
    ({ [T1]: onInitFor(T1, 100), [T2]: onInitFor(T2, 50) })[transactionId] || null
  );
  ondc.confirm.mockResolvedValue({ status: 200, data: { message: { ack: { status: 'ACK' } } } });
});

describe('dispatchCheckoutConfirms', () => {
  it('records the checkout and one attempt per seller, and sends each seller /confirm', async () => {
    const result = await dispatch();

    expect(result).toMatchObject({ status: true, dispatched: 2, acked: 2 });
    expect(mockDb.checkouts).toHaveLength(1);
    expect(mockDb.checkouts[0]).toMatchObject({
      paymentRef: PAYMENT_REF,
      corporateUserId: 42,
      subCorporateUserId: null,
      groupCount: 2,
      capturedAmount: 157.5,
      status: 'IN_PROGRESS',
    });
    expect(ondc.confirm).toHaveBeenCalledTimes(2);
    for (const [args] of ondc.confirm.mock.calls) {
      const attempt = attemptFor(args.transactionId);
      expect(args.messageId).toBe(attempt.messageId);
      expect(args.initOrder.id).toBe(attempt.ondcOrderId);
      expect(args.paymentRef).toBe(PAYMENT_REF);
      expect(attempt).toMatchObject({ status: 'DISPATCHED', bppUri: BPP_URI });
      expect(attempt.deadlineAt.getTime() - attempt.dispatchedAt.getTime()).toBe(5 * 60 * 1000);
      // The seller's synchronous answer is kept on the attempt.
      expect(attempt.confirmResponse).toMatchObject({ httpStatus: 200, ackStatus: 'ACK' });
    }
    expect(attemptFor(T1).quoteAmount).toBe(100);
  });

  it('never sends a seller /confirm twice when the callback repeats', async () => {
    await Promise.all([dispatch(), dispatch()]);
    await dispatch();

    expect(mockDb.checkouts).toHaveLength(1);
    expect(mockDb.attempts).toHaveLength(2);
    expect(ondc.confirm).toHaveBeenCalledTimes(2);
  });

  it('records a NACK as FAILED with what the seller said', async () => {
    ondc.confirm.mockImplementation(async ({ transactionId }) => {
      if (transactionId === T1) throw nack('Quote expired');
      return { status: 200, data: { message: { ack: { status: 'ACK' } } } };
    });

    await dispatch();

    expect(attemptFor(T1)).toMatchObject({ status: 'FAILED', failureReason: 'sync_nack' });
    expect(attemptFor(T1).failureDetail).toContain('Quote expired');
    expect(attemptFor(T1).confirmResponse).toMatchObject({
      ackStatus: 'NACK',
      error: { code: '40000', message: 'Quote expired' },
    });
    expect(attemptFor(T2).status).toBe('DISPATCHED');
  });

  it('keeps waiting on a seller that did not answer, and records the error', async () => {
    ondc.confirm.mockRejectedValue(new Error('timeout of 10000ms exceeded'));

    await dispatch();

    expect(attemptFor(T1).status).toBe('DISPATCHED');
    expect(attemptFor(T1).confirmResponse.error.message).toContain('timeout');
  });

  it('does not send /confirm to a seller with no on_init', async () => {
    findLatestOnInitByTransactionId.mockImplementation(async (transactionId) =>
      transactionId === T1 ? onInitFor(T1, 100) : null
    );

    await dispatch();

    expect(ondc.confirm).toHaveBeenCalledTimes(1);
    expect(attemptFor(T2)).toMatchObject({ status: 'FAILED', failureReason: 'on_init_not_found', quoteAmount: 50 });
  });

  it("records a sub-user's checkout against their sub-corporate id", async () => {
    await dispatchCheckoutConfirms({
      paymentRef: PAYMENT_REF,
      ondcGroups: GROUPS,
      user: { id: 9, corporateId: 42, role: 'CORPORATE_SUB_USER', subCorporateId: 5 },
      pgResponse: PG_RESPONSE,
      logTraceId: 't',
    });

    expect(mockDb.checkouts[0]).toMatchObject({ corporateUserId: null, subCorporateUserId: 5 });
  });

  it('records a checkout with no seller groups so purchase refunds it', async () => {
    const result = await dispatchCheckoutConfirms({
      paymentRef: PAYMENT_REF,
      ondcGroups: [],
      user: USER,
      pgResponse: PG_RESPONSE,
    });

    expect(result).toMatchObject({ status: true, dispatched: 0 });
    expect(mockDb.checkouts[0]).toMatchObject({ groupCount: 0, capturedAmount: 157.5 });
    expect(ondc.confirm).not.toHaveBeenCalled();
  });

  it('never throws', async () => {
    findLatestOnInitByTransactionId.mockRejectedValue(new Error('db down'));

    await expect(dispatch()).resolves.toMatchObject({ status: false, reason: 'exception' });
  });
});
