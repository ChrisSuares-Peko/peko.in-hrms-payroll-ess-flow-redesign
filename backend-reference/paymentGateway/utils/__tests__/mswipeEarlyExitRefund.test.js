'use strict';

jest.mock('../../models/entities/paymentGatewayOrders', () => ({ findOne: jest.fn(), update: jest.fn() }));
jest.mock('../emailer', () => ({ email: jest.fn() }));
jest.mock('../loggerHelper', () => ({ customLog: jest.fn() }));
jest.mock('../mswipeManualRefund', () => ({ requestMswipeManualRefund: jest.fn() }));

const paymentGatewayOrders = require('../../models/entities/paymentGatewayOrders');
const { requestMswipeManualRefund } = require('../mswipeManualRefund');
const { requestMswipeEarlyExitRefund } = require('../mswipeEarlyExitRefund');

const payment = [{ gateway: 'mswipe_pg', order_id: '1790000000001', payment_amount: 300 }];
const req = {
  body: { paymentGatewayResponse: payment },
  user: { id: 7, name: 'Acme Ltd', email: 'acme@example.com' },
};

const savedMarker = () => JSON.parse(paymentGatewayOrders.update.mock.calls[0][0].paymentResponse);

beforeEach(() => {
  jest.clearAllMocks();
  paymentGatewayOrders.findOne.mockResolvedValue({ paymentResponse: JSON.stringify(payment) });
  requestMswipeManualRefund.mockResolvedValue({ status: true, refundStatus: 'PENDING', message: 'Refund initiated' });
});

describe('requestMswipeEarlyExitRefund', () => {
  it('requests a manual refund for the signed-in customer and leaves the early-exit marker', async () => {
    const result = await requestMswipeEarlyExitRefund({
      req,
      corporateTxnId: '1790000000001',
      refundAmount: 300,
      reason: 'service unavailable',
      serviceType: 'Traffic Challan',
    });

    expect(result).toEqual({ status: true, refundStatus: 'PENDING', message: 'Refund initiated' });
    expect(requestMswipeManualRefund).toHaveBeenCalledWith(expect.objectContaining({
      corporateTxnId: '1790000000001',
      paymentBodyData: payment,
      refundAmount: 300,
      credentialId: 7,
      customer: { name: 'Acme Ltd', email: 'acme@example.com' },
      serviceName: 'Traffic Challan',
      reason: 'service unavailable',
    }));
    expect(paymentGatewayOrders.update.mock.calls[0][1]).toEqual({ where: { paymentRefId: '1790000000001' } });
    expect(savedMarker()).toEqual({
      mswipePaymentResponse: payment,
      earlyExitRefund: expect.objectContaining({ reason: 'service unavailable', refundStatus: 'INITIATED', refundAmount: 300 }),
    });
  });

  it('marks the early exit as failed when the refund could not be requested', async () => {
    requestMswipeManualRefund.mockResolvedValue({ status: false, message: 'Something went wrong' });

    await requestMswipeEarlyExitRefund({ req, corporateTxnId: '1790000000001', refundAmount: 300 });

    expect(savedMarker().earlyExitRefund.refundStatus).toBe('FAILED');
  });

  it('keeps an existing marker object and adds the refund to it', async () => {
    paymentGatewayOrders.findOne.mockResolvedValue({ paymentResponse: JSON.stringify({ mswipePaymentResponse: payment, note: 'kept' }) });

    await requestMswipeEarlyExitRefund({ req, corporateTxnId: '1790000000001', refundAmount: 300 });

    expect(savedMarker()).toEqual(expect.objectContaining({ note: 'kept', mswipePaymentResponse: payment }));
  });

  it('does not write a marker without a transaction id', async () => {
    await requestMswipeEarlyExitRefund({ req, refundAmount: 300 });

    expect(paymentGatewayOrders.update).not.toHaveBeenCalled();
  });
});
