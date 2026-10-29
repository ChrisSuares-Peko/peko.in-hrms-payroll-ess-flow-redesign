const paymentLinks = require('../../../entities/paymentLink');
const unifiedTransactionContract = require('../../paymentCollectionTransaction');
const { getTransactionStatus } = require('../../../../services/paymentLinks');
const { customLog } = require('../../../../utils/loggerHelper');
const { findAllPaymentLinks } = require('../../paymentLink');

jest.mock('../../../entities/paymentLink', () => ({
  findAndCountAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
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

describe('findAllPaymentLinks', () => {
  it('returns count and rows without polling when no pending links', async () => {
    const rows = [makeMockLink({ status: 'SUCCESS' })];
    paymentLinks.findAndCountAll.mockResolvedValue({ count: 1, rows });

    const result = await findAllPaymentLinks({ corporateUser: 'user-1' });

    expect(result.count).toBe(1);
    expect(result.rows).toHaveLength(1);
    expect(getTransactionStatus).not.toHaveBeenCalled();
  });

  it('polls provider for PENDING links and updates their status', async () => {
    const pendingLink = makeMockLink({ status: 'PENDING' });
    paymentLinks.findAndCountAll.mockResolvedValue({ count: 1, rows: [pendingLink] });
    getTransactionStatus.mockResolvedValue({ data: { transaction_status: 'SUCCESS' } });
    paymentLinks.findOne.mockResolvedValue(makeMockLink({ status: 'PENDING' }));
    paymentLinks.update.mockResolvedValue([1]);

    const result = await findAllPaymentLinks({ corporateUser: 'user-1', limit: 10, page: 0 });

    expect(getTransactionStatus).toHaveBeenCalledWith('REF-001');
    expect(result.count).toBe(1);
  });

  it('applies status filter uppercased in where clause', async () => {
    paymentLinks.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllPaymentLinks({ corporateUser: 'user-1', status: 'success' });

    const where = paymentLinks.findAndCountAll.mock.calls[0][0].where;
    expect(where.status).toBe('SUCCESS');
  });

  it('applies accessKey filter when provided', async () => {
    paymentLinks.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllPaymentLinks({ corporateUser: 'user-1', accessKey: 'invoice' });

    const where = paymentLinks.findAndCountAll.mock.calls[0][0].where;
    expect(where.accessKey).toBe('invoice');
  });

  it('does not set accessKey in where clause when null', async () => {
    paymentLinks.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllPaymentLinks({ corporateUser: 'user-1', accessKey: null });

    const where = paymentLinks.findAndCountAll.mock.calls[0][0].where;
    expect(where).not.toHaveProperty('accessKey');
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
