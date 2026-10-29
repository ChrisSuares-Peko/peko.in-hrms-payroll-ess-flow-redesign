const paymentQrs = require('../../../entities/paymentQr');
const unifiedTransactionContract = require('../../paymentCollectionTransaction');
const { getTransactionStatus } = require('../../../../services/paymentLinks');
const { customLog } = require('../../../../utils/loggerHelper');
const { findAllPaymentQrs } = require('../../paymentQr');

jest.mock('../../../entities/paymentQr', () => ({
  findAndCountAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
}));

jest.mock('../../paymentCollectionTransaction', () => ({
  upsertUnifiedTransactionStatus: jest.fn(),
}));

jest.mock('../../../../services/paymentLinks', () => ({
  getTransactionStatus: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

const makeMockQr = (overrides = {}) => ({
  id: 1,
  credentialId: 'user-1',
  reference_id: 'QR-REF-001',
  decentro_txn_id: 'QR-DTX-001',
  status: 'PENDING',
  amount: 300,
  purpose_message: 'QR payment',
  dynamic_qr_image: 'https://qr.example.com/img.png',
  expireDate: null,
  createdAt: new Date('2024-01-01'),
  successOrFailDate: null,
  settledDate: null,
  toJSON: jest.fn(function () { return { ...this }; }),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  unifiedTransactionContract.upsertUnifiedTransactionStatus.mockResolvedValue({});
});

describe('findAllPaymentQrs', () => {
  it('returns count and rows without polling when no pending QRs', async () => {
    const rows = [makeMockQr({ status: 'SUCCESS' })];
    paymentQrs.findAndCountAll.mockResolvedValue({ count: 1, rows });

    const result = await findAllPaymentQrs({ corporateUser: 'user-1' });

    expect(result.count).toBe(1);
    expect(result.rows).toHaveLength(1);
    expect(getTransactionStatus).not.toHaveBeenCalled();
  });

  it('polls provider for PENDING QRs and updates their status in rows', async () => {
    const pendingQr = makeMockQr({ status: 'PENDING' });
    paymentQrs.findAndCountAll.mockResolvedValue({ count: 1, rows: [pendingQr] });
    getTransactionStatus.mockResolvedValue({ data: { transaction_status: 'SUCCESS' } });
    paymentQrs.findOne.mockResolvedValue(makeMockQr({ status: 'PENDING' }));
    paymentQrs.update.mockResolvedValue([1]);

    const result = await findAllPaymentQrs({ corporateUser: 'user-1' });

    expect(getTransactionStatus).toHaveBeenCalledWith('QR-REF-001');
    expect(result.rows[0].status).toBe('SUCCESS');
  });

  it('skips update when provider returns no transaction status', async () => {
    const pendingQr = makeMockQr({ status: 'PENDING' });
    paymentQrs.findAndCountAll.mockResolvedValue({ count: 1, rows: [pendingQr] });
    getTransactionStatus.mockResolvedValue({ data: { transaction_status: null } });

    await findAllPaymentQrs({ corporateUser: 'user-1' });

    expect(paymentQrs.update).not.toHaveBeenCalled();
  });

  it('skips rows with no reference_id from pending poll', async () => {
    const qrWithoutRef = makeMockQr({ status: 'PENDING', reference_id: null });
    paymentQrs.findAndCountAll.mockResolvedValue({ count: 1, rows: [qrWithoutRef] });

    await findAllPaymentQrs({ corporateUser: 'user-1' });

    expect(getTransactionStatus).not.toHaveBeenCalled();
  });

  it('applies status filter uppercased in where clause', async () => {
    paymentQrs.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllPaymentQrs({ corporateUser: 'user-1', status: 'success' });

    const where = paymentQrs.findAndCountAll.mock.calls[0][0].where;
    expect(where.status).toBe('SUCCESS');
  });

  it('applies search filter across reference_id, decentro_txn_id, purpose_message, transactionId', async () => {
    paymentQrs.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllPaymentQrs({ corporateUser: 'user-1', search: 'qr-ref' });

    const where = paymentQrs.findAndCountAll.mock.calls[0][0].where;
    expect(Object.getOwnPropertySymbols(where).length).toBeGreaterThan(0);
  });

  it('uses default pagination (limit=10, offset=0) when not provided', async () => {
    paymentQrs.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllPaymentQrs({ corporateUser: 'user-1' });

    const opts = paymentQrs.findAndCountAll.mock.calls[0][0];
    expect(opts.limit).toBe(10);
    expect(opts.offset).toBe(0);
  });

  it('continues silently if getTransactionStatus throws for a pending QR', async () => {
    const pendingQr = makeMockQr({ status: 'PENDING' });
    paymentQrs.findAndCountAll.mockResolvedValue({ count: 1, rows: [pendingQr] });
    getTransactionStatus.mockRejectedValue(new Error('Provider down'));

    const result = await findAllPaymentQrs({ corporateUser: 'user-1' });

    expect(result.rows).toHaveLength(1);
    expect(customLog).toHaveBeenCalled();
  });

  it('throws and logs on db error', async () => {
    paymentQrs.findAndCountAll.mockRejectedValue(new Error('Query failed'));

    await expect(findAllPaymentQrs({ corporateUser: 'user-1' })).rejects.toThrow('Query failed');
    expect(customLog).toHaveBeenCalled();
  });
});
