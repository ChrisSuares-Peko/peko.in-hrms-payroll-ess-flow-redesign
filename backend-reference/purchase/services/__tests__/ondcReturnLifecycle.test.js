jest.mock('../../models/use-cases/ondc_order', () => ({
  findOndcOrderByTransactionId: jest.fn(),
  updateOndcOrderReturnLifecycle: jest.fn(),
}));
jest.mock('../ondcOrderRefund', () => ({
  refundOndcOrderAfterReturn: jest.fn(),
}));
jest.mock('../ondc', () => ({
  updateSettlementTrail: jest.fn(),
}));

const {
  findOndcOrderByTransactionId,
  updateOndcOrderReturnLifecycle,
} = require('../../models/use-cases/ondc_order');
const { refundOndcOrderAfterReturn } = require('../ondcOrderRefund');
const { updateSettlementTrail } = require('../ondc');
const {
  applyOndcReturnOnUpdate,
  extractQuoteTrailRefundAmount,
} = require('../ondcReturnLifecycle');

describe('extractQuoteTrailRefundAmount', () => {
  it('sums quote_trail values', () => {
    const amount = extractQuoteTrailRefundAmount({
      tags: [
        {
          code: 'quote_trail',
          list: [
            { code: 'type', value: 'item' },
            { code: 'value', value: '100.00' },
            { code: 'value', value: '30.50' },
          ],
        },
      ],
    });
    expect(amount).toBe(130.5);
  });
});

describe('applyOndcReturnOnUpdate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseRow = {
    id: 42,
    transactionId: 'T1',
    bppId: 'bpp',
    bppUri: 'https://bpp.example.com',
    orderId: 'O1',
    returnRequestId: 'R1',
    returnRefundedAt: null,
    returnMeta: {},
    fulfillments: [],
  };

  it('does not refund on Return_Rejected', async () => {
    findOndcOrderByTransactionId.mockResolvedValue({ ...baseRow });
    updateOndcOrderReturnLifecycle.mockResolvedValue([1]);

    const result = await applyOndcReturnOnUpdate({
      transactionId: 'T1',
      order: {
        fulfillments: [
          {
            id: 'R1',
            type: 'Return',
            state: { descriptor: { code: 'Return_Rejected' } },
          },
        ],
      },
    });

    expect(refundOndcOrderAfterReturn).not.toHaveBeenCalled();
    expect(result.returnStatus).toBe('Return_Rejected');
  });

  it('refunds once on Liquidated and sends settlement trail', async () => {
    findOndcOrderByTransactionId
      .mockResolvedValueOnce({ ...baseRow })
      .mockResolvedValueOnce({ ...baseRow, returnStatus: 'Returned', returnRefundedAt: new Date() });
    updateOndcOrderReturnLifecycle.mockResolvedValue([1]);
    refundOndcOrderAfterReturn.mockResolvedValue({
      status: true,
      amount: 260,
      alreadyRefunded: false,
    });
    updateSettlementTrail.mockResolvedValue({ status: 200 });

    const result = await applyOndcReturnOnUpdate({
      transactionId: 'T1',
      order: {
        fulfillments: [
          {
            id: 'R1',
            type: 'Return',
            state: { descriptor: { code: 'Liquidated' } },
            tags: [
              {
                code: 'quote_trail',
                list: [{ code: 'value', value: '260.00' }],
              },
            ],
          },
        ],
      },
    });

    expect(refundOndcOrderAfterReturn).toHaveBeenCalledTimes(1);
    expect(refundOndcOrderAfterReturn).toHaveBeenCalledWith(
      expect.objectContaining({ ondcOrderId: 42, refundAmount: 260 })
    );
    expect(updateSettlementTrail).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'O1',
        settlementAmount: 260,
        fulfillmentId: 'R1',
      })
    );
    expect(result.refund.status).toBe(true);
  });

  it('skips refund when already returnRefundedAt', async () => {
    findOndcOrderByTransactionId.mockResolvedValue({
      ...baseRow,
      returnRefundedAt: new Date(),
    });
    updateOndcOrderReturnLifecycle.mockResolvedValue([1]);

    await applyOndcReturnOnUpdate({
      transactionId: 'T1',
      order: {
        fulfillments: [
          {
            id: 'R1',
            type: 'Return',
            state: { descriptor: { code: 'Return_Delivered' } },
          },
        ],
      },
    });

    expect(refundOndcOrderAfterReturn).not.toHaveBeenCalled();
  });

  it('skips refund and settlement when returnMeta.replace is true', async () => {
    findOndcOrderByTransactionId.mockResolvedValue({
      ...baseRow,
      returnMeta: { replace: true },
    });
    updateOndcOrderReturnLifecycle.mockResolvedValue([1]);

    const result = await applyOndcReturnOnUpdate({
      transactionId: 'T1',
      order: {
        fulfillments: [
          {
            id: 'RP1',
            type: 'Return',
            state: { descriptor: { code: 'Liquidated' } },
          },
        ],
      },
    });

    expect(refundOndcOrderAfterReturn).not.toHaveBeenCalled();
    expect(updateSettlementTrail).not.toHaveBeenCalled();
    expect(result.returnStatus).toBe('Liquidated');
    expect(result.refund).toBeNull();
    expect(updateOndcOrderReturnLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({
        returnStatus: 'Liquidated',
        returnMeta: expect.objectContaining({ replace: true }),
      })
    );
  });

  it('skips refund when the inbound Return fulfillment carries replace=yes', async () => {
    findOndcOrderByTransactionId.mockResolvedValue({ ...baseRow, returnMeta: {} });
    updateOndcOrderReturnLifecycle.mockResolvedValue([1]);

    await applyOndcReturnOnUpdate({
      transactionId: 'T1',
      order: {
        fulfillments: [
          {
            id: 'RP1',
            type: 'Return',
            state: { descriptor: { code: 'Return_Delivered' } },
            tags: [
              {
                code: 'return_request',
                list: [{ code: 'replace', value: 'yes' }],
              },
            ],
          },
        ],
      },
    });

    expect(refundOndcOrderAfterReturn).not.toHaveBeenCalled();
    expect(updateSettlementTrail).not.toHaveBeenCalled();
  });

  it('does not stamp Return_Initiated when there is no Return fulfillment and no in-flight return', async () => {
    findOndcOrderByTransactionId.mockResolvedValue({
      ...baseRow,
      returnRequestId: null,
      returnStatus: null,
    });

    const result = await applyOndcReturnOnUpdate({
      transactionId: 'T1',
      order: {
        fulfillments: [{ id: 'F1', type: 'Delivery', state: { descriptor: { code: 'Order-delivered' } } }],
      },
    });

    expect(updateOndcOrderReturnLifecycle).not.toHaveBeenCalled();
    expect(refundOndcOrderAfterReturn).not.toHaveBeenCalled();
    expect(result.returnStatus).toBeNull();
  });

  it('persists an unsolicited IGM replacement Return without a prior /update', async () => {
    findOndcOrderByTransactionId.mockResolvedValue({
      ...baseRow,
      returnRequestId: null,
      returnStatus: null,
      returnMeta: {},
    });
    updateOndcOrderReturnLifecycle.mockResolvedValue([1]);

    const result = await applyOndcReturnOnUpdate({
      transactionId: 'T1',
      order: {
        id: 'O1',
        state: 'Completed',
        fulfillments: [
          { id: 'F1', type: 'Delivery' },
          {
            id: 'R1',
            type: 'Return',
            state: { descriptor: { code: 'Return_Picked' } },
            tags: [
              {
                code: 'return_request',
                list: [{ code: 'replace', value: 'yes' }],
              },
            ],
          },
          { id: 'FR1', type: 'Delivery' },
        ],
      },
    });

    expect(updateOndcOrderReturnLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({
        returnStatus: 'Return_Picked',
        returnRequestId: 'R1',
        returnMeta: expect.objectContaining({ replace: true }),
        markReturned: false,
      })
    );
    expect(refundOndcOrderAfterReturn).not.toHaveBeenCalled();
    expect(result.returnStatus).toBe('Return_Picked');
  });
});
