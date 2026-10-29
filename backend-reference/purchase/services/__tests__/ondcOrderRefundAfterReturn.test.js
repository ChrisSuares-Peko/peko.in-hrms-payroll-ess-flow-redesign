jest.mock('../../utils/cashFreeGateway', () => ({
  refundOndcOrderPayment: jest.fn(),
}));
jest.mock('../../models/use-cases/ondc_order', () => ({
  findOndcOrderByIdAdmin: jest.fn(),
  incrementOndcOrderRefundedAmount: jest.fn(),
  claimOndcOrderPayout: jest.fn(),
  updateOndcOrderReturnLifecycle: jest.fn(),
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
  updateOndcOrderReturnLifecycle,
} = require('../../models/use-cases/ondc_order');
const {
  recordOndcOrderRefund,
  sumOndcOrderRefunds,
  sumOndcOrderVendorRefunds,
} = require('../../models/use-cases/ondc_order_refund');
const { refundOndcOrderAfterReturn, REASONS } = require('../ondcOrderRefund');

const baseRow = {
  id: 11,
  orderState: 'Completed',
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
  returnRefundedAt: null,
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
  updateOndcOrderReturnLifecycle.mockResolvedValue([1]);
});

describe('refundOndcOrderAfterReturn', () => {
  it('returns alreadyRefunded when returnRefundedAt is set', async () => {
    findOndcOrderByIdAdmin.mockResolvedValue({
      ...baseRow,
      returnRefundedAt: new Date(),
    });
    const result = await refundOndcOrderAfterReturn({ ondcOrderId: 11 });
    expect(result.alreadyRefunded).toBe(true);
    expect(refundOndcOrderPayment).not.toHaveBeenCalled();
  });

  it('rejects when payout RELEASED', async () => {
    findOndcOrderByIdAdmin.mockResolvedValue({
      ...baseRow,
      payoutStatus: 'RELEASED',
    });
    const result = await refundOndcOrderAfterReturn({ ondcOrderId: 11 });
    expect(result.status).toBe(false);
    expect(result.reason).toBe(REASONS.PAYOUT_RELEASED);
  });

  it('refunds remaining amount and stamps returnRefundedAt', async () => {
    findOndcOrderByIdAdmin.mockResolvedValue(baseRow);

    const result = await refundOndcOrderAfterReturn({
      ondcOrderId: 11,
      reason: 'Return Liquidated',
    });

    expect(result.status).toBe(true);
    expect(result.amount).toBe(1100);
    expect(updateOndcOrderReturnLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 11,
        markReturned: true,
        returnRefundedAt: expect.any(Date),
      })
    );
  });
});
