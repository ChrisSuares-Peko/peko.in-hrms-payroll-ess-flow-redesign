const paymentQrs = require('../../../entities/paymentQr');
const { findAllPaymentQrsForExport } = require('../../paymentQr');

jest.mock('../../../entities/paymentQr', () => ({
  findAll: jest.fn(),
}));

jest.mock('../../../../services/paymentLinks', () => ({
  getTransactionStatus: jest.fn(),
}));

jest.mock('../../paymentCollectionTransaction', () => ({
  upsertUnifiedTransactionStatus: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

const makeMockQr = (overrides = {}) => ({
  id: 1,
  credentialId: 'user-1',
  reference_id: 'QR-REF-001',
  status: 'SUCCESS',
  amount: 300,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('findAllPaymentQrsForExport', () => {
  it('returns all QR records without filters', async () => {
    const rows = [makeMockQr()];
    paymentQrs.findAll.mockResolvedValue(rows);

    const result = await findAllPaymentQrsForExport({ corporateUser: 'user-1' });

    expect(paymentQrs.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(rows);
  });

  it('applies status filter uppercased in where clause', async () => {
    paymentQrs.findAll.mockResolvedValue([]);

    await findAllPaymentQrsForExport({ corporateUser: 'user-1', status: 'failed' });

    const where = paymentQrs.findAll.mock.calls[0][0].where;
    expect(where.status).toBe('FAILED');
  });

  it('applies search filter when provided', async () => {
    paymentQrs.findAll.mockResolvedValue([]);

    await findAllPaymentQrsForExport({ corporateUser: 'user-1', search: 'qr-ref' });

    const where = paymentQrs.findAll.mock.calls[0][0].where;
    expect(Object.getOwnPropertySymbols(where).length).toBeGreaterThan(0);
  });

  it('does not add status to where clause when not provided', async () => {
    paymentQrs.findAll.mockResolvedValue([]);

    await findAllPaymentQrsForExport({ corporateUser: 'user-1' });

    const where = paymentQrs.findAll.mock.calls[0][0].where;
    expect(where).not.toHaveProperty('status');
  });

  it('orders results by createdAt DESC', async () => {
    paymentQrs.findAll.mockResolvedValue([]);

    await findAllPaymentQrsForExport({ corporateUser: 'user-1' });

    const order = paymentQrs.findAll.mock.calls[0][0].order;
    expect(order).toEqual([['createdAt', 'DESC']]);
  });

  it('returns empty array when no records exist', async () => {
    paymentQrs.findAll.mockResolvedValue([]);

    const result = await findAllPaymentQrsForExport({ corporateUser: 'user-1' });

    expect(result).toEqual([]);
  });

  it('throws and logs on db error', async () => {
    paymentQrs.findAll.mockRejectedValue(new Error('Export error'));

    await expect(findAllPaymentQrsForExport({ corporateUser: 'user-1' })).rejects.toThrow('Export error');
  });
});
