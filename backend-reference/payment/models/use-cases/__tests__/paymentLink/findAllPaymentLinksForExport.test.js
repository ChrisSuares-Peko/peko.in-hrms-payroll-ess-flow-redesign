const paymentLinks = require('../../../entities/paymentLink');
const { customLog } = require('../../../../utils/loggerHelper');
const { findAllPaymentLinksForExport } = require('../../paymentLink');

jest.mock('../../../entities/paymentLink', () => ({
  findAll: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

const makeMockLink = (overrides = {}) => ({
  id: 1,
  credentialId: 'user-1',
  reference_id: 'REF-001',
  status: 'SUCCESS',
  amount: 500,
  customerName: 'Alice',
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('findAllPaymentLinksForExport', () => {
  it('returns all links without filters', async () => {
    const rows = [makeMockLink()];
    paymentLinks.findAll.mockResolvedValue(rows);

    const result = await findAllPaymentLinksForExport({ corporateUser: 'user-1' });

    expect(paymentLinks.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(rows);
  });

  it('applies status filter uppercased in where clause', async () => {
    paymentLinks.findAll.mockResolvedValue([]);

    await findAllPaymentLinksForExport({ corporateUser: 'user-1', status: 'success' });

    const where = paymentLinks.findAll.mock.calls[0][0].where;
    expect(where.status).toBe('SUCCESS');
  });

  it('applies search filter across multiple fields', async () => {
    paymentLinks.findAll.mockResolvedValue([]);

    await findAllPaymentLinksForExport({ corporateUser: 'user-1', search: 'ref' });

    const where = paymentLinks.findAll.mock.calls[0][0].where;
    expect(Object.getOwnPropertySymbols(where).length).toBeGreaterThan(0);
  });

  it('applies accessKey filter when provided', async () => {
    paymentLinks.findAll.mockResolvedValue([]);

    await findAllPaymentLinksForExport({ corporateUser: 'user-1', accessKey: 'invoice' });

    const where = paymentLinks.findAll.mock.calls[0][0].where;
    expect(where.accessKey).toBe('invoice');
  });

  it('does not set accessKey when null', async () => {
    paymentLinks.findAll.mockResolvedValue([]);

    await findAllPaymentLinksForExport({ corporateUser: 'user-1', accessKey: null });

    const where = paymentLinks.findAll.mock.calls[0][0].where;
    expect(where).not.toHaveProperty('accessKey');
  });

  it('returns empty array when no records found', async () => {
    paymentLinks.findAll.mockResolvedValue([]);

    const result = await findAllPaymentLinksForExport({ corporateUser: 'user-1' });

    expect(result).toEqual([]);
  });

  it('throws and logs on db error', async () => {
    paymentLinks.findAll.mockRejectedValue(new Error('Export failed'));

    await expect(findAllPaymentLinksForExport({ corporateUser: 'user-1' })).rejects.toThrow('Export failed');
    expect(customLog).toHaveBeenCalled();
  });
});
