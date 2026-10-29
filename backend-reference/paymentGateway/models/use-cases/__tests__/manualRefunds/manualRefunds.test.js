'use strict';

jest.mock('../../../../configs/database/index', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}));
jest.mock('../../../entities/manualRefunds', () => ({ findByPk: jest.fn(), update: jest.fn() }));
jest.mock('../../../entities/order', () => ({ findOne: jest.fn(), update: jest.fn() }));
jest.mock('../../../entities/transaction', () => ({ update: jest.fn() }));
jest.mock('../../../entities/credential', () => ({ findByPk: jest.fn() }));
jest.mock('../../../../utils/loggerHelper', () => ({ customLog: jest.fn() }));

const sequelize = require('../../../../configs/database/index');
const ManualRefunds = require('../../../entities/manualRefunds');
const Order = require('../../../entities/order');
const Transaction = require('../../../entities/transaction');
const Credential = require('../../../entities/credential');
const { findAllManualRefunds, updateManualRefundStatus } = require('../../manualRefunds');

const pendingRecord = (overrides = {}) => ({
  id: 11,
  corporateTxnId: '1790000000001',
  orderId: 501,
  paymentGatewayOrderId: 77,
  pgProvider: 'mswipe_pg',
  status: 'PENDING',
  refundAmount: '450.00',
  credentialId: 7,
  refundReference: null,
  remarks: null,
  history: [{ status: 'PENDING', at: '2026-10-23T05:00:00.000Z' }],
  ...overrides,
});

const orderBody = {
  gateway: 'mswipe_pg',
  order_id: '1790000000001',
  payment_amount: 450,
  refundStatus: 'PENDING',
  refundResults: [{ gateway: 'mswipe_pg', refund_id: 'refund_1790000000001', refund_amount: 450, refund_status: 'PENDING', refund_mode: 'MANUAL' }],
};

let tx;

beforeEach(() => {
  jest.clearAllMocks();
  tx = { commit: jest.fn(), rollback: jest.fn(), LOCK: { UPDATE: 'UPDATE' } };
  sequelize.transaction.mockResolvedValue(tx);
  ManualRefunds.findByPk.mockResolvedValue(pendingRecord());
  ManualRefunds.update.mockResolvedValue([1]);
  Order.findOne.mockResolvedValue({ id: 501, status: 'SUCCESS', paymentModeResponse: JSON.stringify(orderBody) });
  Order.update.mockResolvedValue([1]);
  Transaction.update.mockResolvedValue([1]);
  Credential.findByPk.mockResolvedValue({ username: 'acme', name: 'Acme Ltd', email: 'acme@example.com', registeredBy: 1854 });
});

const savedOrder = () => {
  const [fields] = Order.update.mock.calls[0];
  return { fields, body: JSON.parse(fields.paymentModeResponse) };
};

describe('updateManualRefundStatus', () => {
  it('moves a pending refund to in progress and records it on the order', async () => {
    const result = await updateManualRefundStatus({ id: 11, status: 'IN_PROGRESS', remarks: 'Mailed Mswipe', adminId: 3 });

    expect(ManualRefunds.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'IN_PROGRESS', remarks: 'Mailed Mswipe', updatedBy: 3 }),
      { where: { id: 11, status: 'PENDING' }, transaction: tx }
    );
    const [updatedFields] = ManualRefunds.update.mock.calls[0];
    expect(updatedFields.history).toHaveLength(2);
    expect(updatedFields.history[1]).toEqual(expect.objectContaining({ status: 'IN_PROGRESS', by: 3, remarks: 'Mailed Mswipe' }));

    const { fields, body } = savedOrder();
    expect(fields.status).toBeUndefined();
    expect(body.refundStatus).toBe('IN_PROGRESS');
    expect(body.refundResults).toEqual([expect.objectContaining({ refund_id: 'refund_1790000000001', refund_status: 'IN_PROGRESS' })]);
    expect(Transaction.update).not.toHaveBeenCalled();
    expect(tx.commit).toHaveBeenCalled();
    expect(result).toEqual({
      status: true,
      message: 'Refund status updated successfully.',
      data: expect.objectContaining({ corporateTxnId: '1790000000001', status: 'IN_PROGRESS', refundAmount: 450, customer: expect.objectContaining({ username: 'acme' }) }),
    });
  });

  it('finds and updates the order through the refund relation', async () => {
    await updateManualRefundStatus({ id: 11, status: 'IN_PROGRESS', adminId: 3 });

    expect(Order.findOne).toHaveBeenCalledWith({ where: { id: 501 }, transaction: tx, lock: 'UPDATE' });
    expect(Order.update.mock.calls[0][1]).toEqual({ where: { id: 501 }, transaction: tx });
  });

  it('falls back to the transaction id when the refund was recorded without an order link', async () => {
    ManualRefunds.findByPk.mockResolvedValue(pendingRecord({ orderId: null }));

    await updateManualRefundStatus({ id: 11, status: 'IN_PROGRESS', adminId: 3 });

    expect(Order.findOne).toHaveBeenCalledWith({ where: { corporateTxnId: '1790000000001' }, transaction: tx, lock: 'UPDATE' });
  });

  it('marks the order refunded exactly like a successful gateway refund', async () => {
    await updateManualRefundStatus({ id: 11, status: 'SUCCESS', refundReference: 'MSW-REF-1', adminId: 3 });

    const { fields, body } = savedOrder();
    expect(fields.status).toBe('REFUNDED');
    expect(body.refundStatus).toBe('SUCCESS');
    expect(body.refundResults).toEqual([expect.objectContaining({ refund_status: 'SUCCESS', refund_arn: 'MSW-REF-1', refund_amount: 450 })]);
    expect(Transaction.update).toHaveBeenCalledWith({ refundedAmount: 450 }, { where: { corporateTxnId: '1790000000001' }, transaction: tx });
  });

  it('rejects a refund and marks the order refund as failed so it can be raised again', async () => {
    await updateManualRefundStatus({ id: 11, status: 'FAILED', remarks: 'Mswipe declined', adminId: 3 });

    const { fields, body } = savedOrder();
    expect(fields.status).toBeUndefined();
    expect(body.refundStatus).toBe('FAILED');
    expect(Transaction.update).not.toHaveBeenCalled();
  });

  it('asks for the Mswipe reference before marking a refund refunded', async () => {
    const result = await updateManualRefundStatus({ id: 11, status: 'SUCCESS', adminId: 3 });

    expect(result).toEqual({ status: false, message: 'Please enter the Mswipe refund reference' });
    expect(sequelize.transaction).not.toHaveBeenCalled();
  });

  it('asks for a reason before rejecting a refund', async () => {
    const result = await updateManualRefundStatus({ id: 11, status: 'FAILED', adminId: 3 });

    expect(result).toEqual({ status: false, message: 'Please enter the reason for rejecting the refund' });
    expect(sequelize.transaction).not.toHaveBeenCalled();
  });

  it('does not reopen a refund that is already closed', async () => {
    ManualRefunds.findByPk.mockResolvedValue(pendingRecord({ status: 'SUCCESS' }));

    const result = await updateManualRefundStatus({ id: 11, status: 'IN_PROGRESS', adminId: 3 });

    expect(result).toEqual({ status: false, message: 'This refund is already refunded and cannot be marked as in progress.' });
    expect(sequelize.transaction).not.toHaveBeenCalled();
  });

  it('reports a conflict when someone else changed the refund first', async () => {
    ManualRefunds.update.mockResolvedValue([0]);

    const result = await updateManualRefundStatus({ id: 11, status: 'IN_PROGRESS', adminId: 3 });

    expect(result).toEqual(expect.objectContaining({ status: false, conflict: true }));
    expect(tx.rollback).toHaveBeenCalled();
    expect(Order.update).not.toHaveBeenCalled();
  });

  it('reports a missing refund, including one from another gateway', async () => {
    ManualRefunds.findByPk.mockResolvedValueOnce(null).mockResolvedValueOnce(pendingRecord({ pgProvider: 'cashfree_pg' }));

    await expect(updateManualRefundStatus({ id: 99, status: 'IN_PROGRESS' })).resolves.toEqual(expect.objectContaining({ notFound: true }));
    await expect(updateManualRefundStatus({ id: 11, status: 'IN_PROGRESS' })).resolves.toEqual(expect.objectContaining({ notFound: true }));
  });

  it('updates the refund alone when the payment never created an order', async () => {
    Order.findOne.mockResolvedValue(null);

    const result = await updateManualRefundStatus({ id: 11, status: 'SUCCESS', refundReference: 'MSW-REF-1', adminId: 3 });

    expect(result.status).toBe(true);
    expect(Order.update).not.toHaveBeenCalled();
    expect(tx.commit).toHaveBeenCalled();
  });

  it('rolls back and returns a generic message when the database fails', async () => {
    Order.update.mockRejectedValue(new Error('deadlock'));

    const result = await updateManualRefundStatus({ id: 11, status: 'IN_PROGRESS', adminId: 3 });

    expect(result).toEqual({ status: false, message: 'Something went wrong while updating the refund.' });
    expect(tx.rollback).toHaveBeenCalled();
    expect(tx.commit).not.toHaveBeenCalled();
  });
});

describe('findAllManualRefunds', () => {
  const listRow = {
    id: 11,
    corporateTxnId: '1790000000001',
    status: 'PENDING',
    refundAmount: '450.00',
    paidAmount: '500.00',
    paymentDetails: '{"mid":"MID1"}',
    history: '[{"status":"PENDING"}]',
    customerName: 'Acme Ltd',
  };

  beforeEach(() => {
    sequelize.query.mockResolvedValueOnce([listRow]).mockResolvedValueOnce([{ count: 1 }]);
  });

  it('lists Mswipe refunds with their status name and the statuses they can move to', async () => {
    const result = await findAllManualRefunds({ page: 1, itemsPerPage: 10 });

    expect(result.recordsTotal).toBe(1);
    expect(result.rows[0]).toEqual(expect.objectContaining({
      refundAmount: 450,
      paidAmount: 500,
      paymentDetails: { mid: 'MID1' },
      history: [{ status: 'PENDING' }],
      statusName: 'Pending',
      nextStatuses: [
        { status: 'IN_PROGRESS', name: 'In progress' },
        { status: 'SUCCESS', name: 'Refunded' },
        { status: 'FAILED', name: 'Rejected' },
      ],
    }));
    expect(result.statuses.map(({ status }) => status)).toEqual(['PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED']);
    const [, options] = sequelize.query.mock.calls[0];
    expect(options.replacements).toEqual(expect.objectContaining({ pgProvider: 'mswipe_pg', limit: 10, offset: 0 }));
  });

  it('filters default-partner customers by a missing partner', async () => {
    await findAllManualRefunds({ partnerId: 'default' });

    for (const [sql] of sequelize.query.mock.calls) {
      expect(sql).toContain('AND c.registeredBy IS NULL');
    }
  });

  it('filters a partner by id', async () => {
    await findAllManualRefunds({ partnerId: 1854, status: 'IN_PROGRESS', page: 2, itemsPerPage: 20 });

    const [sql, options] = sequelize.query.mock.calls[0];
    expect(sql).toContain('AND c.registeredBy = :partnerId');
    expect(options.replacements).toEqual(expect.objectContaining({ partnerId: 1854, status: 'IN_PROGRESS', limit: 20, offset: 20 }));
  });
});
