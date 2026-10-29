jest.mock('../../utils/cashFreeGateway', () => ({
  refundOndcOrderPayment: jest.fn(),
}));
jest.mock('../../models/use-cases/ondc_order', () => ({
  findOndcOrderByIdAdmin: jest.fn(),
  incrementOndcOrderRefundedAmount: jest.fn(),
  claimOndcOrderPayout: jest.fn(),
}));
jest.mock('../../models/use-cases/ondc_order_refund', () => ({
  recordOndcOrderRefund: jest.fn(),
  sumOndcOrderRefunds: jest.fn(),
  sumOndcOrderVendorRefunds: jest.fn(),
}));
jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }));

const { refundOndcOrderPayment } = require('../../utils/cashFreeGateway');
const {
  findOndcOrderByIdAdmin,
  incrementOndcOrderRefundedAmount,
  claimOndcOrderPayout,
} = require('../../models/use-cases/ondc_order');
const {
  recordOndcOrderRefund,
  sumOndcOrderRefunds,
  sumOndcOrderVendorRefunds,
} = require('../../models/use-cases/ondc_order_refund');
const {
  refundOndcOrderAfterCancel,
  REASONS,
} = require('../ondcOrderRefund');

const baseRow = {
  id: 11,
  orderState: 'Cancelled',
  paymentRef: '1785921646907',
  amountPaid: 1100,
  refundedAmount: 0,
  transactionId: 'txn-1',
  orderId: 'O-1',
  providerId: 'P1',
  splitStatus: 'SPLIT',
  splitVendorId: 'ondc_vendor_1',
  splitAmount: 1000,
  payoutStatus: 'HELD',
};

beforeEach(() => {
  jest.clearAllMocks();
  sumOndcOrderRefunds.mockResolvedValue(0);
  sumOndcOrderVendorRefunds.mockResolvedValue(0);
  recordOndcOrderRefund.mockResolvedValue({
    duplicate: false,
    row: { id: 99, update: jest.fn().mockResolvedValue(undefined) },
  });
  refundOndcOrderPayment.mockResolvedValue({
    status: true,
    refundStatus: 'SUCCESS',
    splitsApplied: true,
    responseBody: {},
  });
  incrementOndcOrderRefundedAmount.mockResolvedValue([1]);
  claimOndcOrderPayout.mockResolvedValue(true);
});

describe('refundOndcOrderAfterCancel', () => {
  it('refunds full remaining with refund_splits when SPLIT', async () => {
    findOndcOrderByIdAdmin.mockResolvedValue(baseRow);

    const result = await refundOndcOrderAfterCancel({
      ondcOrderId: 11,
      logTraceId: 't1',
    });

    expect(result.status).toBe(true);
    expect(result.amount).toBe(1100);
    expect(refundOndcOrderPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentRef: '1785921646907',
        amount: 1100,
        refundSplits: [
          expect.objectContaining({
            vendor_id: 'ondc_vendor_1',
            amount: 1000,
          }),
        ],
      })
    );
    expect(claimOndcOrderPayout).toHaveBeenCalledWith({
      id: 11,
      fromStatus: 'HELD',
      toStatus: 'BLOCKED',
    });
  });

  it('refunds from merchant only when split was SKIPPED', async () => {
    findOndcOrderByIdAdmin.mockResolvedValue({
      ...baseRow,
      splitStatus: 'SKIPPED',
      splitVendorId: null,
      splitAmount: null,
    });

    const result = await refundOndcOrderAfterCancel({ ondcOrderId: 11 });

    expect(result.status).toBe(true);
    expect(refundOndcOrderPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1100,
        refundSplits: [],
      })
    );
  });

  it('is a no-op success when already fully refunded', async () => {
    findOndcOrderByIdAdmin.mockResolvedValue(baseRow);
    sumOndcOrderRefunds.mockResolvedValue(1100);

    const result = await refundOndcOrderAfterCancel({ ondcOrderId: 11 });

    expect(result.status).toBe(true);
    expect(result.alreadyRefunded).toBe(true);
    expect(refundOndcOrderPayment).not.toHaveBeenCalled();
  });

  it('fails closed when payout already RELEASED', async () => {
    findOndcOrderByIdAdmin.mockResolvedValue({
      ...baseRow,
      payoutStatus: 'RELEASED',
    });

    const result = await refundOndcOrderAfterCancel({ ondcOrderId: 11 });

    expect(result.status).toBe(false);
    expect(result.reason).toBe(REASONS.PAYOUT_RELEASED);
    expect(refundOndcOrderPayment).not.toHaveBeenCalled();
  });

  it('rejects when order is not Cancelled', async () => {
    findOndcOrderByIdAdmin.mockResolvedValue({
      ...baseRow,
      orderState: 'Created',
    });

    const result = await refundOndcOrderAfterCancel({ ondcOrderId: 11 });

    expect(result.status).toBe(false);
    expect(result.reason).toBe(REASONS.ORDER_NOT_CANCELLED);
  });
});
