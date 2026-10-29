const paymentQrs = require('../../../entities/paymentQr');
const unifiedTransactionContract = require('../../paymentCollectionTransaction');
const { getTransactionStatus } = require('../../../../services/paymentLinks');
const { customLog } = require('../../../../utils/loggerHelper');

const {
  addPaymentQr,
  findAllPaymentQrs,
  findAllPaymentQrsForExport,
  findPaymentQrById,
  findPaymentQrByIdentifiers,
  getPaymentQrsCount,
  getActivePaymentQrsCount,
  getTotalAmountFromPaymentQr,
  updatePaymentQrStatus,
} = require('../../paymentQr');

jest.mock('../../../entities/paymentQr', () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
  findAndCountAll: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
  sequelize: {
    fn: jest.fn(() => 'SUM(amount)'),
    col: jest.fn(() => 'amount'),
  },
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

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// addPaymentQr
// ─────────────────────────────────────────────────────────────────────────────

describe('addPaymentQr', () => {
  const params = {
    corporateUser: 'user-1',
    amount: 300,
    purpose_message: 'QR payment',
    reference_id: 'QR-REF-001',
    decentro_txn_id: 'QR-DTX-001',
    status: 'pending',
    dynamic_qr_image: 'https://qr.example.com/img.png',
    expireDate: '2025-06-01',
  };

  it('creates a QR and returns it', async () => {
    const mockQr = { id: 1, ...params };
    paymentQrs.create.mockResolvedValue(mockQr);

    const result = await addPaymentQr(params);

    expect(paymentQrs.create).toHaveBeenCalledTimes(1);
    const createArg = paymentQrs.create.mock.calls[0][0];
    expect(createArg.credentialId).toBe('user-1');
    expect(createArg.status).toBe('PENDING'); // normalized to uppercase
    expect(result).toEqual(mockQr);
  });

  it('sets expireDate to null when not provided', async () => {
    paymentQrs.create.mockResolvedValue({ id: 2 });

    await addPaymentQr({ ...params, expireDate: null });

    const createArg = paymentQrs.create.mock.calls[0][0];
    expect(createArg.expireDate).toBeNull();
  });

  it('throws on db error', async () => {
    paymentQrs.create.mockRejectedValue(new Error('Create failed'));

    await expect(addPaymentQr(params)).rejects.toThrow('Create failed');
    expect(customLog).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// findAllPaymentQrs
// ─────────────────────────────────────────────────────────────────────────────

describe('findAllPaymentQrs', () => {
  it('returns count and rows when no pending QRs', async () => {
    const rows = [makeMockQr({ status: 'SUCCESS' })];
    paymentQrs.findAndCountAll.mockResolvedValue({ count: 1, rows });

    const result = await findAllPaymentQrs({ corporateUser: 'user-1' });

    expect(result.count).toBe(1);
    expect(result.rows).toHaveLength(1);
    expect(getTransactionStatus).not.toHaveBeenCalled();
  });

  it('polls provider for PENDING QRs and updates status', async () => {
    const pendingQr = makeMockQr({ status: 'PENDING' });
    paymentQrs.findAndCountAll.mockResolvedValue({ count: 1, rows: [pendingQr] });
    getTransactionStatus.mockResolvedValue({ data: { transaction_status: 'SUCCESS' } });
    paymentQrs.findOne.mockResolvedValue(makeMockQr({ status: 'PENDING' }));
    paymentQrs.update.mockResolvedValue([1]);

    const result = await findAllPaymentQrs({ corporateUser: 'user-1' });

    expect(getTransactionStatus).toHaveBeenCalledWith('QR-REF-001');
    expect(result.rows[0].status).toBe('SUCCESS');
  });

  it('skips status update when provider returns no status', async () => {
    const pendingQr = makeMockQr({ status: 'PENDING' });
    paymentQrs.findAndCountAll.mockResolvedValue({ count: 1, rows: [pendingQr] });
    getTransactionStatus.mockResolvedValue({ data: { transaction_status: null } });

    await findAllPaymentQrs({ corporateUser: 'user-1' });

    expect(paymentQrs.update).not.toHaveBeenCalled();
  });

  it('applies status filter in where clause', async () => {
    paymentQrs.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllPaymentQrs({ corporateUser: 'user-1', status: 'success' });

    const where = paymentQrs.findAndCountAll.mock.calls[0][0].where;
    expect(where.status).toBe('SUCCESS');
  });

  it('continues silently if getTransactionStatus fails', async () => {
    const pendingQr = makeMockQr({ status: 'PENDING' });
    paymentQrs.findAndCountAll.mockResolvedValue({ count: 1, rows: [pendingQr] });
    getTransactionStatus.mockRejectedValue(new Error('Provider down'));

    const result = await findAllPaymentQrs({ corporateUser: 'user-1' });

    expect(result.rows).toHaveLength(1);
    expect(customLog).toHaveBeenCalled();
  });

  it('throws on db error', async () => {
    paymentQrs.findAndCountAll.mockRejectedValue(new Error('Query failed'));

    await expect(findAllPaymentQrs({ corporateUser: 'user-1' })).rejects.toThrow('Query failed');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// findAllPaymentQrsForExport
// ─────────────────────────────────────────────────────────────────────────────

describe('findAllPaymentQrsForExport', () => {
  it('returns all QRs without filters', async () => {
    const rows = [makeMockQr()];
    paymentQrs.findAll.mockResolvedValue(rows);

    const result = await findAllPaymentQrsForExport({ corporateUser: 'user-1' });

    expect(result).toEqual(rows);
  });

  it('applies status filter', async () => {
    paymentQrs.findAll.mockResolvedValue([]);

    await findAllPaymentQrsForExport({ corporateUser: 'user-1', status: 'failed' });

    const where = paymentQrs.findAll.mock.calls[0][0].where;
    expect(where.status).toBe('FAILED');
  });

  it('throws on db error', async () => {
    paymentQrs.findAll.mockRejectedValue(new Error('Export error'));

    await expect(findAllPaymentQrsForExport({ corporateUser: 'user-1' })).rejects.toThrow('Export error');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// findPaymentQrById
// ─────────────────────────────────────────────────────────────────────────────

describe('findPaymentQrById', () => {
  it('returns the QR when found', async () => {
    const qr = makeMockQr();
    paymentQrs.findOne.mockResolvedValue(qr);

    const result = await findPaymentQrById({ id: 1, corporateUser: 'user-1' });

    expect(paymentQrs.findOne).toHaveBeenCalledWith({ where: { id: 1, credentialId: 'user-1' } });
    expect(result).toEqual(qr);
  });

  it('returns null when not found', async () => {
    paymentQrs.findOne.mockResolvedValue(null);

    const result = await findPaymentQrById({ id: 999, corporateUser: 'user-1' });

    expect(result).toBeNull();
  });

  it('throws on db error', async () => {
    paymentQrs.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findPaymentQrById({ id: 1, corporateUser: 'user-1' })).rejects.toThrow('DB error');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// findPaymentQrByIdentifiers
// ─────────────────────────────────────────────────────────────────────────────

describe('findPaymentQrByIdentifiers', () => {
  it('finds by reference_id when provided', async () => {
    const qr = makeMockQr();
    paymentQrs.findOne.mockResolvedValue(qr);

    const result = await findPaymentQrByIdentifiers({ reference_id: 'QR-REF-001' });

    expect(paymentQrs.findOne).toHaveBeenCalledWith({ where: { reference_id: 'QR-REF-001' } });
    expect(result).toEqual(qr);
  });

  it('finds by decentro_txn_id when reference_id is null', async () => {
    const qr = makeMockQr();
    paymentQrs.findOne.mockResolvedValue(qr);

    const result = await findPaymentQrByIdentifiers({ decentro_txn_id: 'QR-DTX-001' });

    expect(paymentQrs.findOne).toHaveBeenCalledWith({ where: { decentro_txn_id: 'QR-DTX-001' } });
    expect(result).toEqual(qr);
  });

  it('returns null when both identifiers are absent', async () => {
    const result = await findPaymentQrByIdentifiers({});

    expect(paymentQrs.findOne).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('throws on db error', async () => {
    paymentQrs.findOne.mockRejectedValue(new Error('Lookup failed'));

    await expect(findPaymentQrByIdentifiers({ reference_id: 'QR-REF-001' })).rejects.toThrow('Lookup failed');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getPaymentQrsCount
// ─────────────────────────────────────────────────────────────────────────────

describe('getPaymentQrsCount', () => {
  it('returns count of PENDING QRs', async () => {
    paymentQrs.count.mockResolvedValue(4);

    const result = await getPaymentQrsCount({ corporateUser: 'user-1' });

    expect(paymentQrs.count).toHaveBeenCalledWith({
      where: { credentialId: 'user-1', status: 'PENDING' },
    });
    expect(result).toBe(4);
  });

  it('throws on db error', async () => {
    paymentQrs.count.mockRejectedValue(new Error('Count failed'));

    await expect(getPaymentQrsCount({ corporateUser: 'user-1' })).rejects.toThrow('Count failed');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getActivePaymentQrsCount
// ─────────────────────────────────────────────────────────────────────────────

describe('getActivePaymentQrsCount', () => {
  it('returns count of active (PENDING + not expired) QRs', async () => {
    paymentQrs.count.mockResolvedValue(2);

    const result = await getActivePaymentQrsCount({ corporateUser: 'user-1' });

    expect(result).toBe(2);
    const where = paymentQrs.count.mock.calls[0][0].where;
    expect(where.credentialId).toBe('user-1');
    expect(where.status).toBe('PENDING');
  });

  it('throws on db error', async () => {
    paymentQrs.count.mockRejectedValue(new Error('Count error'));

    await expect(getActivePaymentQrsCount({ corporateUser: 'user-1' })).rejects.toThrow('Count error');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getTotalAmountFromPaymentQr
// ─────────────────────────────────────────────────────────────────────────────

describe('getTotalAmountFromPaymentQr', () => {
  it('returns aggregated total for SUCCESS QRs', async () => {
    paymentQrs.findAll.mockResolvedValue([{ totalAmount: '900' }]);

    const result = await getTotalAmountFromPaymentQr({ corporateUser: 'user-1' });

    expect(result).toBe(900);
    const where = paymentQrs.findAll.mock.calls[0][0].where;
    expect(where.status).toBe('SUCCESS');
  });

  it('returns 0 when totalAmount is null or missing', async () => {
    paymentQrs.findAll.mockResolvedValue([{ totalAmount: null }]);

    const result = await getTotalAmountFromPaymentQr({ corporateUser: 'user-1' });

    expect(result).toBe(0);
  });

  it('applies date range filters', async () => {
    paymentQrs.findAll.mockResolvedValue([{ totalAmount: '100' }]);

    await getTotalAmountFromPaymentQr({
      corporateUser: 'user-1',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    });

    const where = paymentQrs.findAll.mock.calls[0][0].where;
    expect(where.createdAt).toBeDefined();
  });

  it('throws on db error', async () => {
    paymentQrs.findAll.mockRejectedValue(new Error('Sum failed'));

    await expect(getTotalAmountFromPaymentQr({ corporateUser: 'user-1' })).rejects.toThrow('Sum failed');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// updatePaymentQrStatus
// ─────────────────────────────────────────────────────────────────────────────

describe('updatePaymentQrStatus', () => {
  it('throws when reference_id is missing', async () => {
    await expect(
      updatePaymentQrStatus({ reference_id: '', status: 'SUCCESS' })
    ).rejects.toThrow('reference_id is required');
  });

  it('throws when status is missing', async () => {
    await expect(
      updatePaymentQrStatus({ reference_id: 'QR-REF-001', status: '' })
    ).rejects.toThrow('status is required');
  });

  it('throws when no QR found', async () => {
    paymentQrs.findOne.mockResolvedValue(null);

    await expect(
      updatePaymentQrStatus({ reference_id: 'QR-NONE', status: 'SUCCESS' })
    ).rejects.toThrow('No payment QR found');
  });

  it('updates status to SUCCESS and sets successOrFailDate', async () => {
    const qr = makeMockQr({ status: 'PENDING', successOrFailDate: null });
    paymentQrs.findOne.mockResolvedValue(qr);
    paymentQrs.update.mockResolvedValue([1]);

    const result = await updatePaymentQrStatus({
      reference_id: 'QR-REF-001',
      status: 'SUCCESS',
      skipUnifiedSync: true,
    });

    expect(result.updated).toBe(true);
    expect(result.status).toBe('SUCCESS');
    expect(result.statusChanged).toBe(true);

    const updateArg = paymentQrs.update.mock.calls[0][0];
    expect(updateArg.successOrFailDate).toBeDefined();
  });

  it('updates to SETTLED and sets settledDate', async () => {
    const qr = makeMockQr({ status: 'SUCCESS', successOrFailDate: new Date(), settledDate: null });
    paymentQrs.findOne.mockResolvedValue(qr);
    paymentQrs.update.mockResolvedValue([1]);

    const result = await updatePaymentQrStatus({
      reference_id: 'QR-REF-001',
      status: 'SETTLED',
      skipUnifiedSync: true,
    });

    expect(result.status).toBe('SETTLED');
    const updateArg = paymentQrs.update.mock.calls[0][0];
    expect(updateArg.settledDate).toBeDefined();
  });

  it('skips unified sync when skipUnifiedSync is true', async () => {
    const qr = makeMockQr();
    paymentQrs.findOne.mockResolvedValue(qr);
    paymentQrs.update.mockResolvedValue([1]);

    await updatePaymentQrStatus({ reference_id: 'QR-REF-001', status: 'SUCCESS', skipUnifiedSync: true });

    expect(unifiedTransactionContract.upsertUnifiedTransactionStatus).not.toHaveBeenCalled();
  });

  it('calls upsertUnifiedTransactionStatus when skipUnifiedSync is false', async () => {
    const qr = makeMockQr();
    paymentQrs.findOne.mockResolvedValue(qr);
    paymentQrs.update.mockResolvedValue([1]);

    await updatePaymentQrStatus({ reference_id: 'QR-REF-001', status: 'SUCCESS' });

    expect(unifiedTransactionContract.upsertUnifiedTransactionStatus).toHaveBeenCalledTimes(1);
    const syncArg = unifiedTransactionContract.upsertUnifiedTransactionStatus.mock.calls[0][0];
    expect(syncArg.source).toBe('payment_qr');
  });

  it('does not throw if unifiedSync fails — logs error instead', async () => {
    const qr = makeMockQr();
    paymentQrs.findOne.mockResolvedValue(qr);
    paymentQrs.update.mockResolvedValue([1]);
    unifiedTransactionContract.upsertUnifiedTransactionStatus.mockRejectedValue(new Error('Sync error'));

    const result = await updatePaymentQrStatus({ reference_id: 'QR-REF-001', status: 'SUCCESS' });

    expect(result.updated).toBe(true);
    expect(customLog).toHaveBeenCalled();
  });

  it('throws when updatedCount is 0', async () => {
    paymentQrs.findOne.mockResolvedValue(makeMockQr());
    paymentQrs.update.mockResolvedValue([0]);

    await expect(
      updatePaymentQrStatus({ reference_id: 'QR-REF-001', status: 'SUCCESS', skipUnifiedSync: true })
    ).rejects.toThrow('No payment QR found');
  });

  it('returns statusChanged as false when status is unchanged', async () => {
    const qr = makeMockQr({ status: 'SUCCESS' });
    paymentQrs.findOne.mockResolvedValue(qr);
    paymentQrs.update.mockResolvedValue([1]);

    const result = await updatePaymentQrStatus({
      reference_id: 'QR-REF-001',
      status: 'SUCCESS',
      skipUnifiedSync: true,
    });

    expect(result.statusChanged).toBe(false);
  });
});
