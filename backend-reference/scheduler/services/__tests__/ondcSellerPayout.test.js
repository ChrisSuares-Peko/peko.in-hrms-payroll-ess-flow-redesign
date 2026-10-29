jest.mock('../../utils/easySplit', () => ({
  getEasySplitSettings: jest.fn(),
}));
jest.mock('../../utils/easySplitSettlement', () => ({
  setSettlementEligibility: jest.fn(),
}));
jest.mock('../../models/entities/ondc_order', () => ({
  findAll: jest.fn(),
  update: jest.fn(),
  sequelize: { query: jest.fn() },
}));
jest.mock('../../models/entities/order', () => ({
  findOne: jest.fn(),
}));
jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }));

const { Op } = require('sequelize');
const { getEasySplitSettings } = require('../../utils/easySplit');
const { setSettlementEligibility } = require('../../utils/easySplitSettlement');
const ondcOrders = require('../../models/entities/ondc_order');
const order = require('../../models/entities/order');
const {
  blockingReason,
  runSellerPayoutSweep,
  triggerOndcSellerPayoutSweep,
} = require('../ondcSellerPayout');

const NOW = new Date('2026-08-28T12:00:00Z');

const heldRow = (overrides = {}) => ({
  id: 11,
  transactionId: 'txn-1',
  orderId: 'ONDC-1',
  orderState: 'Completed',
  paymentRef: 'pay-1',
  splitVendorId: 'vendor_1',
  splitAmount: 120.5,
  payoutAttempts: 0,
  payoutDueAt: new Date('2026-08-27T12:00:00Z'),
  deliveredAt: new Date('2026-08-25T12:00:00Z'),
  returnWindow: 'P2D',
  returnedAt: null,
  cancelledAt: null,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  getEasySplitSettings.mockResolvedValue({ payoutHoldEnabled: true, payoutMaxAttempts: 5 });
  ondcOrders.sequelize.query.mockResolvedValue([]);
  ondcOrders.update.mockResolvedValue([1]);
  ondcOrders.findAll.mockResolvedValue([]);
  order.findOne.mockResolvedValue({
    paymentModeResponse: JSON.stringify({ order_id: 'cf_order_1' }),
  });
  setSettlementEligibility.mockResolvedValue({ status: true });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('blockingReason', () => {
  const none = new Set();

  it('blocks cancelled / returned order state, return, cancel, open issue, and missing vendor', () => {
    expect(blockingReason(heldRow({ orderState: 'Cancelled' }), none)).toBe('order_state_cancelled');
    expect(blockingReason(heldRow({ orderState: 'Returned' }), none)).toBe('order_state_returned');
    expect(blockingReason(heldRow({ returnedAt: NOW }), none)).toBe('returned');
    expect(blockingReason(heldRow({ cancelledAt: NOW }), none)).toBe('cancelled');
    expect(blockingReason(heldRow(), new Set([11]))).toBe('open_issue');
    expect(blockingReason(heldRow({ splitVendorId: null }), none)).toBe('no_split_vendor');
  });

  it('is null when the seller may be paid', () => {
    expect(blockingReason(heldRow(), none)).toBeNull();
  });
});

describe('runSellerPayoutSweep', () => {
  it('skips when payoutHoldEnabled is false', async () => {
    getEasySplitSettings.mockResolvedValue({ payoutHoldEnabled: false });

    const result = await runSellerPayoutSweep();

    expect(result).toEqual({ skipped: true, reason: 'hold_disabled' });
    expect(ondcOrders.findAll).not.toHaveBeenCalled();
    expect(setSettlementEligibility).not.toHaveBeenCalled();
  });

  it('selects HELD rows whose payoutDueAt is past, then RELEASE_FAILED retries', async () => {
    await runSellerPayoutSweep();

    expect(ondcOrders.findAll).toHaveBeenCalledTimes(2);
    expect(ondcOrders.findAll.mock.calls[0][0].where).toEqual({
      payoutStatus: 'HELD',
      payoutDueAt: { [Op.ne]: null, [Op.lte]: NOW },
    });
    expect(ondcOrders.findAll.mock.calls[1][0].where).toEqual({
      payoutStatus: 'RELEASE_FAILED',
      payoutAttempts: { [Op.lt]: 5 },
    });
  });

  it('claims the row then tells Cashfree to RELEASE', async () => {
    ondcOrders.findAll
      .mockResolvedValueOnce([heldRow()])
      .mockResolvedValueOnce([]);

    const result = await runSellerPayoutSweep();

    expect(ondcOrders.update).toHaveBeenCalledWith(
      { payoutStatus: 'RELEASING' },
      { where: { id: 11, payoutStatus: 'HELD' } }
    );
    expect(setSettlementEligibility).toHaveBeenCalledWith(
      expect.objectContaining({
        gatewayOrderId: 'cf_order_1',
        vendorId: 'vendor_1',
        action: 'RELEASE',
        ondcOrderId: 11,
        transactionId: 'txn-1',
        paymentRef: 'pay-1',
        amount: 120.5,
      })
    );
    expect(ondcOrders.update).toHaveBeenCalledWith(
      expect.objectContaining({
        payoutStatus: 'RELEASED',
        payoutError: null,
      }),
      { where: { id: 11 } }
    );
    expect(result.due).toEqual({
      candidates: 1, released: 1, blocked: 0, failed: 0, skipped: 0,
    });
  });

  it('blocks a cancelled order without calling Cashfree', async () => {
    ondcOrders.findAll
      .mockResolvedValueOnce([heldRow({ orderState: 'Cancelled' })])
      .mockResolvedValueOnce([]);

    const result = await runSellerPayoutSweep();

    expect(setSettlementEligibility).not.toHaveBeenCalled();
    expect(ondcOrders.update).toHaveBeenCalledWith(
      { payoutStatus: 'BLOCKED', payoutError: 'order_state_cancelled' },
      { where: { id: 11 } }
    );
    expect(result.due.blocked).toBe(1);
    expect(result.due.released).toBe(0);
  });

  it('does not pay when the issues query fails', async () => {
    ondcOrders.findAll
      .mockResolvedValueOnce([heldRow()])
      .mockResolvedValueOnce([]);
    ondcOrders.sequelize.query.mockRejectedValue(new Error('issues table down'));

    const result = await runSellerPayoutSweep();

    expect(setSettlementEligibility).not.toHaveBeenCalled();
    expect(result.due).toEqual({
      candidates: 1, released: 0, blocked: 0, failed: 0, skipped: 1, aborted: true,
    });
  });

  it('stamps RELEASE_FAILED when Cashfree rejects, so the retry pass can pick it up', async () => {
    ondcOrders.findAll
      .mockResolvedValueOnce([heldRow()])
      .mockResolvedValueOnce([]);
    setSettlementEligibility.mockResolvedValue({
      status: false,
      reason: 'request_failed',
      message: 'timeout',
    });

    const result = await runSellerPayoutSweep();

    expect(ondcOrders.update).toHaveBeenCalledWith(
      expect.objectContaining({
        payoutStatus: 'RELEASE_FAILED',
        payoutError: 'release_failed: request_failed — timeout',
      }),
      { where: { id: 11 } }
    );
    expect(result.due.failed).toBe(1);
  });

  it('skips a row another pass already claimed', async () => {
    ondcOrders.findAll
      .mockResolvedValueOnce([heldRow()])
      .mockResolvedValueOnce([]);
    ondcOrders.update
      .mockResolvedValueOnce([0]) // claim lost
      .mockResolvedValue([1]);

    const result = await runSellerPayoutSweep();

    expect(setSettlementEligibility).not.toHaveBeenCalled();
    expect(result.due.skipped).toBe(1);
  });
});

describe('triggerOndcSellerPayoutSweep', () => {
  it('returns status true and never throws', async () => {
    const result = await triggerOndcSellerPayoutSweep();
    expect(result.status).toBe(true);
    expect(result.data.due.candidates).toBe(0);
  });
});
