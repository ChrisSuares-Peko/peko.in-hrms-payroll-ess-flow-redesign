'use strict';

jest.mock('../../configs/database/index', () => ({
  query: jest.fn(),
  QueryTypes: { INSERT: 'INSERT', SELECT: 'SELECT' },
}));
jest.mock('../loggerHelper', () => ({ customLog: jest.fn() }));

const sequelize = require('../../configs/database/index');
const { customLog } = require('../loggerHelper');
const { isMswipePayment, requestMswipeManualRefund } = require('../mswipeManualRefund');

const mswipePayment = {
  gateway: 'mswipe_pg',
  order_id: '1790000000001',
  payment_amount: 500,
  payment_time: '2026-10-23 10:15:00',
  payment_group: 'credit_card',
  bank_reference: 'RRN123',
  gatewayDetails: { providerOrderId: 'IPG789', rrn: 'RRN123', mid: 'MID1', tid: 'TID1' },
};

const settingsRow = (emails) => [{ details: { emails } }];

const mockQueries = ({
  affectedRows = 1,
  opsEmails = ['refunds@peko.one'],
  fallbackEmails = ['support@peko.one'],
  existingStatus,
  orderContext = [{ orderId: 501 }],
  paymentGatewayOrders = [{ id: 77 }],
} = {}) => {
  sequelize.query.mockImplementation(async (sql, options) => {
    if (sql.startsWith('SELECT o.id AS orderId')) return orderContext;
    if (sql.startsWith('SELECT id FROM paymentGatewayOrders')) return paymentGatewayOrders;
    if (sql.startsWith('INSERT INTO manualRefunds')) return [0, affectedRows];
    if (sql.startsWith('SELECT status FROM manualRefunds')) return [{ status: existingStatus }];
    if (sql.startsWith('SELECT details FROM settings')) {
      return options.replacements.name === 'mswipeRefundOps' ? settingsRow(opsEmails) : settingsRow(fallbackEmails);
    }
    throw new Error(`unexpected query: ${sql}`);
  });
};

const request = (overrides = {}) => {
  const deps = {
    saveOrder: jest.fn(),
    sendMail: jest.fn(),
    notifyCustomer: jest.fn(),
  };
  const promise = requestMswipeManualRefund({
    corporateTxnId: 1790000000001,
    paymentBodyData: { ...mswipePayment },
    refundAmount: 450,
    credentialId: 7,
    customer: { name: 'Acme Ltd', email: 'acme@example.com' },
    serviceName: 'Hotels',
    ...deps,
    ...overrides,
  });
  return { promise, deps };
};

const upsertCall = () => sequelize.query.mock.calls.find(([sql]) => sql.startsWith('INSERT INTO manualRefunds'));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('isMswipePayment', () => {
  it('recognises a Mswipe payment stored as an object, an array or under pgResponse', () => {
    expect(isMswipePayment(mswipePayment)).toBe(true);
    expect(isMswipePayment([mswipePayment])).toBe(true);
    expect(isMswipePayment({ pgResponse: [mswipePayment] })).toBe(true);
  });

  it('does not treat other gateways as Mswipe', () => {
    expect(isMswipePayment({ order_id: 'cf_1', payment_amount: 100 })).toBe(false);
    expect(isMswipePayment({ gateway: 'AIRPAY' })).toBe(false);
    expect(isMswipePayment(undefined)).toBe(false);
  });
});

describe('requestMswipeManualRefund', () => {
  it('records the refund, marks the order pending, emails refund ops and tells the customer', async () => {
    mockQueries();
    const { promise, deps } = request();

    await expect(promise).resolves.toEqual({ status: true, refundStatus: 'PENDING', message: 'Refund initiated' });

    expect(upsertCall()[1].replacements).toEqual(expect.objectContaining({
      corporateTxnId: '1790000000001',
      pgProvider: 'mswipe_pg',
      refundAmount: 450,
      paidAmount: 500,
      credentialId: 7,
      serviceName: 'Hotels',
      gatewayOrderId: 'IPG789',
      gatewayReference: 'RRN123',
    }));

    const savedOrder = JSON.parse(deps.saveOrder.mock.calls[0][0].paymentModeResponse);
    expect(savedOrder.refundStatus).toBe('PENDING');
    expect(savedOrder.refundResults).toEqual([expect.objectContaining({
      refund_id: 'refund_1790000000001',
      refund_amount: 450,
      refund_status: 'PENDING',
      refund_mode: 'MANUAL',
    })]);
    expect(savedOrder.order_id).toBe('1790000000001');

    expect(deps.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: ['refunds@peko.one'],
      subject: 'Mswipe refund needed for transaction 1790000000001',
    }));
    const { html } = deps.sendMail.mock.calls[0][0];
    expect(html).toContain('IPG789');
    expect(html).toContain('MID1');
    expect(html).toContain('Acme Ltd');
    expect(deps.notifyCustomer).toHaveBeenCalledTimes(1);
  });

  it('links the refund to its order and to the Mswipe payment-gateway order', async () => {
    mockQueries();
    const { promise } = request();
    await promise;

    expect(upsertCall()[1].replacements).toEqual(expect.objectContaining({ orderId: 501, paymentGatewayOrderId: 77 }));
    const lookup = sequelize.query.mock.calls.find(([sql]) => sql.startsWith('SELECT id FROM paymentGatewayOrders'));
    expect(lookup[1].replacements).toEqual({ paymentRefId: '1790000000001' });
  });

  it('still records a refund that has no order row or payment-gateway order', async () => {
    mockQueries({ orderContext: [], paymentGatewayOrders: [] });
    const { promise } = request();

    await expect(promise).resolves.toEqual(expect.objectContaining({ status: true, refundStatus: 'PENDING' }));
    expect(upsertCall()[1].replacements).toEqual(expect.objectContaining({ orderId: null, paymentGatewayOrderId: null }));
  });

  it('fills in the customer and service from the order when the caller does not pass them', async () => {
    mockQueries({ orderContext: [{ orderId: 501, credentialId: 9, customerName: 'From Order', customerEmail: 'order@example.com', serviceName: 'Flights' }] });
    const { promise, deps } = request({ customer: undefined, serviceName: undefined, credentialId: undefined });
    await promise;

    expect(upsertCall()[1].replacements).toEqual(expect.objectContaining({ credentialId: 9, serviceName: 'Flights' }));
    expect(deps.sendMail.mock.calls[0][0].html).toContain('From Order');
    expect(deps.sendMail.mock.calls[0][0].html).toContain('order@example.com');
  });

  it('prefers what the caller passes over the order lookup', async () => {
    mockQueries({ orderContext: [{ orderId: 501, credentialId: 9, customerName: 'From Order', serviceName: 'Flights' }] });
    const { promise } = request();
    await promise;

    expect(upsertCall()[1].replacements).toEqual(expect.objectContaining({ credentialId: 7, serviceName: 'Hotels' }));
  });

  it('escapes customer details in the ops email', async () => {
    mockQueries();
    const { promise, deps } = request({ customer: { name: '<b>Acme & Co</b>' } });
    await promise;

    expect(deps.sendMail.mock.calls[0][0].html).toContain('&lt;b&gt;Acme &amp; Co&lt;/b&gt;');
  });

  it('falls back to the website list when no refund ops list is configured', async () => {
    mockQueries({ opsEmails: [] });
    const { promise, deps } = request();
    await promise;

    expect(deps.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: ['support@peko.one'] }));
    expect(customLog).toHaveBeenCalledWith(undefined, 'error', expect.objectContaining({ action: 'refund:mswipeRefundOpsListMissing' }), 'VENDOR');
  });

  it('skips the ops email but still requests the refund when no list is configured at all', async () => {
    mockQueries({ opsEmails: [], fallbackEmails: [] });
    const { promise, deps } = request();

    await expect(promise).resolves.toEqual(expect.objectContaining({ status: true, refundStatus: 'PENDING' }));
    expect(deps.sendMail).not.toHaveBeenCalled();
    expect(customLog).toHaveBeenCalledWith(undefined, 'error', expect.objectContaining({ action: 'refund:mswipeManualRefundMailSkipped' }), 'VENDOR');
  });

  it('does nothing more when the refund was already requested', async () => {
    mockQueries({ affectedRows: 0, existingStatus: 'IN_PROGRESS' });
    const { promise, deps } = request();

    await expect(promise).resolves.toEqual({ status: true, message: 'Refund already initiated', refundStatus: 'IN_PROGRESS' });
    expect(deps.saveOrder).not.toHaveBeenCalled();
    expect(deps.sendMail).not.toHaveBeenCalled();
    expect(deps.notifyCustomer).not.toHaveBeenCalled();
  });

  it('still answers "already initiated" when the status lookup fails', async () => {
    mockQueries({ affectedRows: 0 });
    const base = sequelize.query.getMockImplementation();
    sequelize.query.mockImplementation(async (sql, options) => {
      if (sql.startsWith('SELECT status FROM manualRefunds')) throw new Error('db down');
      return base(sql, options);
    });
    const { promise } = request();

    await expect(promise).resolves.toEqual({ status: true, message: 'Refund already initiated', refundStatus: undefined });
  });

  it('stores no paid amount when the payment record has none', async () => {
    mockQueries();
    const { promise } = request({ paymentBodyData: { gateway: 'mswipe_pg', order_id: '1790000000001' } });
    await promise;

    expect(upsertCall()[1].replacements.paidAmount).toBeNull();
  });

  it('requests the refund again after a rejection', async () => {
    mockQueries({ affectedRows: 2 });
    const { promise, deps } = request();

    await expect(promise).resolves.toEqual(expect.objectContaining({ status: true, refundStatus: 'PENDING' }));
    expect(deps.saveOrder).toHaveBeenCalledTimes(1);
    expect(deps.sendMail).toHaveBeenCalledTimes(1);
  });

  it('reports a failure and sends nothing when the refund cannot be recorded', async () => {
    sequelize.query.mockRejectedValue(new Error('db down'));
    const { promise, deps } = request();

    await expect(promise).resolves.toEqual({ status: false, message: 'Something went wrong' });
    expect(deps.saveOrder).not.toHaveBeenCalled();
    expect(deps.sendMail).not.toHaveBeenCalled();
    expect(customLog).toHaveBeenCalledWith(undefined, 'error', expect.objectContaining({ action: 'refund:mswipeManualRefundFailed' }), 'VENDOR');
  });

  it('refunds the paid amount when no amount is given', async () => {
    mockQueries();
    const { promise } = request({ refundAmount: undefined });
    await promise;

    expect(upsertCall()[1].replacements.refundAmount).toBe(500);
  });

  it('rejects an invalid refund amount without recording anything', async () => {
    mockQueries();
    const { promise } = request({ refundAmount: 0, paymentBodyData: { gateway: 'mswipe_pg' } });

    await expect(promise).resolves.toEqual({ status: false, message: 'Invalid refund amount' });
    expect(sequelize.query).not.toHaveBeenCalled();
  });

  it('keeps going when the customer email fails', async () => {
    mockQueries();
    const { promise } = request({ notifyCustomer: jest.fn().mockRejectedValue(new Error('smtp down')) });

    await expect(promise).resolves.toEqual(expect.objectContaining({ status: true }));
    expect(customLog).toHaveBeenCalledWith(undefined, 'error', expect.objectContaining({ action: 'refund:mswipeManualRefundCustomerMailFailed' }), 'VENDOR');
  });
});
