const paymentLinks = require('../../../entities/paymentLink');
const invoicingV2 = require('../../../entities/invoicingV2');
const unifiedTransactionContract = require('../../paymentCollectionTransaction');
const { getTransactionStatus } = require('../../../../services/paymentLinks');
const { customLog } = require('../../../../utils/loggerHelper');

const {
  storePaymentLink,
  getPaymentLinksCount,
  findAllPaymentLinks,
  findAllPaymentLinksForExport,
  getTotalAmountFromPaymentLink,
  updatePaymentLinkStatus,
  findPaymentLinkById,
  findPaymentLinkByIdentifiers,
  getActivePaymentLinksCount,
} = require('../../paymentLink');

jest.mock('../../../entities/paymentLink', () => ({
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

jest.mock('../../../entities/invoicingV2', () => ({
  update: jest.fn(),
  findAll: jest.fn(),
}));

jest.mock('../../paymentCollectionTransaction', () => ({
  upsertUnifiedTransactionStatus: jest.fn(),
  createPendingUnifiedTransaction: jest.fn(),
  appendTimelineEvent: jest.fn(),
  normalizeUnifiedStatus: jest.fn(),
}));

jest.mock('../../../../services/paymentLinks', () => ({
  getTransactionStatus: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

jest.mock('../../../../utils/formatter', () => ({
  formattedDateTime: jest.fn(d => String(d)),
  capitalizeFirstLetter: jest.fn(s => s),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const makeMockLink = (overrides = {}) => ({
  id: 1,
  credentialId: 'user-1',
  reference_id: 'REF-001',
  decentro_txn_id: 'DTX-001',
  status: 'PENDING',
  amount: 500,
  paymentLink: 'https://pay.example.com/REF-001',
  customerName: 'Alice',
  customerPhone: '9999999999',
  purpose_message: 'Test payment',
  invoiceId: null,
  accessKey: 'payment_link',
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
// storePaymentLink
// ─────────────────────────────────────────────────────────────────────────────

describe('storePaymentLink', () => {
  const params = {
    amount: 100,
    paymentLink: 'https://pay.example.com/REF',
    status: 'PENDING',
    reference_id: 'REF-001',
    decentro_txn_id: 'DTX-001',
    expireDate: '2025-01-01',
    corporateUser: 'user-1',
    customerPhone: '9999999999',
    customerName: 'Alice',
    purpose_message: 'Demo',
    invoiceId: null,
    accessKey: 'payment_link',
  };

  it('creates and returns the new payment link', async () => {
    const mockRecord = { id: 1, ...params, credentialId: 'user-1' };
    paymentLinks.create.mockResolvedValue(mockRecord);

    const result = await storePaymentLink(params);

    expect(paymentLinks.create).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockRecord);
  });

  it('throws when db create fails', async () => {
    paymentLinks.create.mockRejectedValue(new Error('DB error'));

    await expect(storePaymentLink(params)).rejects.toThrow('DB error');
    expect(customLog).toHaveBeenCalled();
  });

  it('sets expireDate to null when not provided', async () => {
    paymentLinks.create.mockResolvedValue({ id: 2 });
    await storePaymentLink({ ...params, expireDate: null });

    const createArg = paymentLinks.create.mock.calls[0][0];
    expect(createArg.expireDate).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getPaymentLinksCount
// ─────────────────────────────────────────────────────────────────────────────

describe('getPaymentLinksCount', () => {
  it('returns count of PENDING links for the user', async () => {
    paymentLinks.count.mockResolvedValue(5);

    const result = await getPaymentLinksCount({ corporateUser: 'user-1' });

    expect(paymentLinks.count).toHaveBeenCalledWith({
      where: { credentialId: 'user-1', status: 'PENDING' },
    });
    expect(result).toBe(5);
  });

  it('throws on db error', async () => {
    paymentLinks.count.mockRejectedValue(new Error('Count failed'));

    await expect(getPaymentLinksCount({ corporateUser: 'user-1' })).rejects.toThrow('Count failed');
    expect(customLog).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// findAllPaymentLinks
// ─────────────────────────────────────────────────────────────────────────────

describe('findAllPaymentLinks', () => {
  it('returns count and rows when no pending links', async () => {
    const rows = [makeMockLink({ status: 'SUCCESS' })];
    paymentLinks.findAndCountAll.mockResolvedValue({ count: 1, rows });

    const result = await findAllPaymentLinks({ corporateUser: 'user-1' });

    expect(result.count).toBe(1);
    expect(result.rows).toHaveLength(1);
    expect(getTransactionStatus).not.toHaveBeenCalled();
  });

  it('polls provider for PENDING links and updates status', async () => {
    const pendingLink = makeMockLink({ status: 'PENDING' });
    paymentLinks.findAndCountAll.mockResolvedValue({ count: 1, rows: [pendingLink] });

    getTransactionStatus.mockResolvedValue({ data: { transaction_status: 'SUCCESS' } });
    // updatePaymentLinkStatus internally calls findOne + update
    paymentLinks.findOne.mockResolvedValue(makeMockLink({ status: 'PENDING' }));
    paymentLinks.update.mockResolvedValue([1]);

    const result = await findAllPaymentLinks({ corporateUser: 'user-1', limit: 10, page: 0 });

    expect(getTransactionStatus).toHaveBeenCalledWith('REF-001');
    expect(result.count).toBe(1);
  });

  it('applies status filter to where clause', async () => {
    paymentLinks.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllPaymentLinks({ corporateUser: 'user-1', status: 'success' });

    const whereClause = paymentLinks.findAndCountAll.mock.calls[0][0].where;
    expect(whereClause.status).toBe('SUCCESS');
  });

  it('applies search filter', async () => {
    paymentLinks.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllPaymentLinks({ corporateUser: 'user-1', search: 'alice' });

    const whereClause = paymentLinks.findAndCountAll.mock.calls[0][0].where;
    expect(Object.getOwnPropertySymbols(whereClause).length).toBeGreaterThan(0);
  });

  it('applies accessKey filter when provided', async () => {
    paymentLinks.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllPaymentLinks({ corporateUser: 'user-1', accessKey: 'invoice' });

    const whereClause = paymentLinks.findAndCountAll.mock.calls[0][0].where;
    expect(whereClause.accessKey).toBe('invoice');
  });

  it('does not set accessKey in where when null', async () => {
    paymentLinks.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllPaymentLinks({ corporateUser: 'user-1', accessKey: null });

    const whereClause = paymentLinks.findAndCountAll.mock.calls[0][0].where;
    expect(whereClause).not.toHaveProperty('accessKey');
  });

  it('continues silently if getTransactionStatus fails for a pending link', async () => {
    const pendingLink = makeMockLink({ status: 'PENDING' });
    paymentLinks.findAndCountAll.mockResolvedValue({ count: 1, rows: [pendingLink] });
    getTransactionStatus.mockRejectedValue(new Error('Provider down'));

    const result = await findAllPaymentLinks({ corporateUser: 'user-1' });

    expect(result.rows).toHaveLength(1);
    expect(customLog).toHaveBeenCalled();
  });

  it('throws on db error', async () => {
    paymentLinks.findAndCountAll.mockRejectedValue(new Error('Query failed'));

    await expect(findAllPaymentLinks({ corporateUser: 'user-1' })).rejects.toThrow('Query failed');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// findAllPaymentLinksForExport
// ─────────────────────────────────────────────────────────────────────────────

describe('findAllPaymentLinksForExport', () => {
  it('returns all links for export without filters', async () => {
    const rows = [makeMockLink()];
    paymentLinks.findAll.mockResolvedValue(rows);

    const result = await findAllPaymentLinksForExport({ corporateUser: 'user-1' });

    expect(paymentLinks.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(rows);
  });

  it('applies status and search filters', async () => {
    paymentLinks.findAll.mockResolvedValue([]);

    await findAllPaymentLinksForExport({ corporateUser: 'user-1', status: 'success', search: 'ref' });

    const where = paymentLinks.findAll.mock.calls[0][0].where;
    expect(where.status).toBe('SUCCESS');
  });

  it('applies accessKey filter', async () => {
    paymentLinks.findAll.mockResolvedValue([]);

    await findAllPaymentLinksForExport({ corporateUser: 'user-1', accessKey: 'invoice' });

    const where = paymentLinks.findAll.mock.calls[0][0].where;
    expect(where.accessKey).toBe('invoice');
  });

  it('throws on db error', async () => {
    paymentLinks.findAll.mockRejectedValue(new Error('Export failed'));

    await expect(findAllPaymentLinksForExport({ corporateUser: 'user-1' })).rejects.toThrow('Export failed');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getTotalAmountFromPaymentLink
// ─────────────────────────────────────────────────────────────────────────────

describe('getTotalAmountFromPaymentLink', () => {
  it('returns total sum for SUCCESS links', async () => {
    paymentLinks.findAll.mockResolvedValue([{ totalAmount: '1500' }]);

    const result = await getTotalAmountFromPaymentLink({ corporateUser: 'user-1' });

    expect(result).toBe(1500);
    const where = paymentLinks.findAll.mock.calls[0][0].where;
    expect(where.status).toBe('SUCCESS');
  });

  it('returns 0 when totalAmount is null', async () => {
    paymentLinks.findAll.mockResolvedValue([{ totalAmount: null }]);

    const result = await getTotalAmountFromPaymentLink({ corporateUser: 'user-1' });

    expect(result).toBe(0);
  });

  it('applies startDate and endDate filters', async () => {
    paymentLinks.findAll.mockResolvedValue([{ totalAmount: '200' }]);

    await getTotalAmountFromPaymentLink({
      corporateUser: 'user-1',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    });

    const where = paymentLinks.findAll.mock.calls[0][0].where;
    expect(where.createdAt).toBeDefined();
  });

  it('throws on db error', async () => {
    paymentLinks.findAll.mockRejectedValue(new Error('Sum failed'));

    await expect(getTotalAmountFromPaymentLink({ corporateUser: 'user-1' })).rejects.toThrow('Sum failed');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// updatePaymentLinkStatus
// ─────────────────────────────────────────────────────────────────────────────

describe('updatePaymentLinkStatus', () => {
  it('throws when reference_id is missing', async () => {
    await expect(
      updatePaymentLinkStatus({ reference_id: '', status: 'SUCCESS' })
    ).rejects.toThrow('reference_id is required');
  });

  it('throws when status is missing', async () => {
    await expect(
      updatePaymentLinkStatus({ reference_id: 'REF-001', status: '' })
    ).rejects.toThrow('status is required');
  });

  it('throws when no payment link found', async () => {
    paymentLinks.findOne.mockResolvedValue(null);

    await expect(
      updatePaymentLinkStatus({ reference_id: 'REF-NONE', status: 'SUCCESS' })
    ).rejects.toThrow('No payment link found');
  });

  it('updates status to SUCCESS and sets successOrFailDate', async () => {
    const link = makeMockLink({ status: 'PENDING', successOrFailDate: null });
    paymentLinks.findOne.mockResolvedValue(link);
    paymentLinks.update.mockResolvedValue([1]);

    const result = await updatePaymentLinkStatus({
      reference_id: 'REF-001',
      status: 'SUCCESS',
      skipUnifiedSync: true,
    });

    expect(result.updated).toBe(true);
    expect(result.status).toBe('SUCCESS');
    expect(result.statusChanged).toBe(true);

    const updateArg = paymentLinks.update.mock.calls[0][0];
    expect(updateArg.successOrFailDate).toBeDefined();
  });

  it('updates status to FAILED and sets successOrFailDate', async () => {
    const link = makeMockLink({ status: 'PENDING', successOrFailDate: null });
    paymentLinks.findOne.mockResolvedValue(link);
    paymentLinks.update.mockResolvedValue([1]);

    const result = await updatePaymentLinkStatus({
      reference_id: 'REF-001',
      status: 'FAILED',
      skipUnifiedSync: true,
    });

    expect(result.status).toBe('FAILED');
    const updateArg = paymentLinks.update.mock.calls[0][0];
    expect(updateArg.successOrFailDate).toBeDefined();
  });

  it('updates SETTLED status and sets settledDate', async () => {
    const link = makeMockLink({ status: 'SUCCESS', successOrFailDate: new Date(), settledDate: null });
    paymentLinks.findOne.mockResolvedValue(link);
    paymentLinks.update.mockResolvedValue([1]);

    const result = await updatePaymentLinkStatus({
      reference_id: 'REF-001',
      status: 'SETTLED',
      skipUnifiedSync: true,
    });

    expect(result.status).toBe('SETTLED');
    const updateArg = paymentLinks.update.mock.calls[0][0];
    expect(updateArg.settledDate).toBeDefined();
  });

  it('calls invoicingV2.update when accessKey is invoice and status is SUCCESS', async () => {
    const link = makeMockLink({ status: 'PENDING', accessKey: 'invoice', invoiceId: 42 });
    paymentLinks.findOne.mockResolvedValue(link);
    paymentLinks.update.mockResolvedValue([1]);
    invoicingV2.update.mockResolvedValue([1]);

    await updatePaymentLinkStatus({
      reference_id: 'REF-001',
      status: 'SUCCESS',
      skipUnifiedSync: true,
    });

    expect(invoicingV2.update).toHaveBeenCalledWith(
      { status: 'PAID' },
      { where: { id: 42 } }
    );
  });

  it('skips unified sync when skipUnifiedSync is true', async () => {
    const link = makeMockLink();
    paymentLinks.findOne.mockResolvedValue(link);
    paymentLinks.update.mockResolvedValue([1]);

    await updatePaymentLinkStatus({ reference_id: 'REF-001', status: 'SUCCESS', skipUnifiedSync: true });

    expect(unifiedTransactionContract.upsertUnifiedTransactionStatus).not.toHaveBeenCalled();
  });

  it('calls upsertUnifiedTransactionStatus when skipUnifiedSync is false', async () => {
    const link = makeMockLink();
    paymentLinks.findOne.mockResolvedValue(link);
    paymentLinks.update.mockResolvedValue([1]);

    await updatePaymentLinkStatus({ reference_id: 'REF-001', status: 'SUCCESS', skipUnifiedSync: false });

    expect(unifiedTransactionContract.upsertUnifiedTransactionStatus).toHaveBeenCalledTimes(1);
  });

  it('does not throw if unifiedSync fails — logs error instead', async () => {
    const link = makeMockLink();
    paymentLinks.findOne.mockResolvedValue(link);
    paymentLinks.update.mockResolvedValue([1]);
    unifiedTransactionContract.upsertUnifiedTransactionStatus.mockRejectedValue(new Error('Sync failed'));

    const result = await updatePaymentLinkStatus({ reference_id: 'REF-001', status: 'SUCCESS' });

    expect(result.updated).toBe(true);
    expect(customLog).toHaveBeenCalled();
  });

  it('throws when updatedCount is 0', async () => {
    paymentLinks.findOne.mockResolvedValue(makeMockLink());
    paymentLinks.update.mockResolvedValue([0]);

    await expect(
      updatePaymentLinkStatus({ reference_id: 'REF-001', status: 'SUCCESS', skipUnifiedSync: true })
    ).rejects.toThrow('No payment link found');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// findPaymentLinkById
// ─────────────────────────────────────────────────────────────────────────────

describe('findPaymentLinkById', () => {
  it('returns the link when found', async () => {
    const link = makeMockLink();
    paymentLinks.findOne.mockResolvedValue(link);

    const result = await findPaymentLinkById({ id: 1, corporateUser: 'user-1' });

    expect(paymentLinks.findOne).toHaveBeenCalledWith({
      where: { id: 1, credentialId: 'user-1' },
    });
    expect(result).toEqual(link);
  });

  it('returns null when not found', async () => {
    paymentLinks.findOne.mockResolvedValue(null);

    const result = await findPaymentLinkById({ id: 999, corporateUser: 'user-1' });

    expect(result).toBeNull();
  });

  it('throws on db error', async () => {
    paymentLinks.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findPaymentLinkById({ id: 1, corporateUser: 'user-1' })).rejects.toThrow('DB error');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// findPaymentLinkByIdentifiers
// ─────────────────────────────────────────────────────────────────────────────

describe('findPaymentLinkByIdentifiers', () => {
  it('finds by reference_id when provided', async () => {
    const link = makeMockLink();
    paymentLinks.findOne.mockResolvedValue(link);

    const result = await findPaymentLinkByIdentifiers({ reference_id: 'REF-001' });

    expect(paymentLinks.findOne).toHaveBeenCalledWith({ where: { reference_id: 'REF-001' } });
    expect(result).toEqual(link);
  });

  it('finds by decentro_txn_id when reference_id is null', async () => {
    const link = makeMockLink();
    paymentLinks.findOne.mockResolvedValue(link);

    const result = await findPaymentLinkByIdentifiers({ decentro_txn_id: 'DTX-001' });

    expect(paymentLinks.findOne).toHaveBeenCalledWith({ where: { decentro_txn_id: 'DTX-001' } });
    expect(result).toEqual(link);
  });

  it('returns null when both identifiers are null', async () => {
    const result = await findPaymentLinkByIdentifiers({});

    expect(paymentLinks.findOne).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('throws on db error', async () => {
    paymentLinks.findOne.mockRejectedValue(new Error('Lookup failed'));

    await expect(findPaymentLinkByIdentifiers({ reference_id: 'REF-001' })).rejects.toThrow('Lookup failed');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getActivePaymentLinksCount
// ─────────────────────────────────────────────────────────────────────────────

describe('getActivePaymentLinksCount', () => {
  it('returns count of active (PENDING + not expired) links', async () => {
    paymentLinks.count.mockResolvedValue(3);

    const result = await getActivePaymentLinksCount({ corporateUser: 'user-1' });

    expect(result).toBe(3);
    const where = paymentLinks.count.mock.calls[0][0].where;
    expect(where.credentialId).toBe('user-1');
    expect(where.status).toBe('PENDING');
  });

  it('throws on db error', async () => {
    paymentLinks.count.mockRejectedValue(new Error('Count error'));

    await expect(getActivePaymentLinksCount({ corporateUser: 'user-1' })).rejects.toThrow('Count error');
  });
});
