const {
  getPaymentsDashboardTopCustomers,
  getPaymentsDashboardDueThisWeek,
  getPaymentsDashboardRecentActivity,
} = require('../../invoicingV2');
const invoicingV2 = require('../../../entities/invoicingV2');
const manualPayment = require('../../../entities/manualPayment');

jest.mock('../../../entities/invoicingV2');
jest.mock('../../../entities/manualPayment');

describe('getPaymentsDashboardTopCustomers', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns top customers sorted by totalPaid', async () => {
    const mockCustomers = [
      { name: 'Alpha Corp', totalPaid: '50000' },
      { name: 'Beta Ltd', totalPaid: '30000' },
    ];
    invoicingV2.findAll.mockResolvedValue(mockCustomers);

    const result = await getPaymentsDashboardTopCustomers(10);

    expect(invoicingV2.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ corporateUserId: 10, status: 'PAID' }),
        raw: true,
      })
    );
    expect(result.topCustomers).toEqual(mockCustomers);
  });

  it('returns empty array when no paid invoices exist', async () => {
    invoicingV2.findAll.mockResolvedValue([]);

    const result = await getPaymentsDashboardTopCustomers(10);

    expect(result.topCustomers).toEqual([]);
  });

  it('throws if database query fails', async () => {
    invoicingV2.findAll.mockRejectedValue(new Error('Database error'));

    await expect(getPaymentsDashboardTopCustomers(10)).rejects.toThrow('Database error');
  });
});

describe('getPaymentsDashboardDueThisWeek', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns dueThisWeek rows and recordsTotal', async () => {
    const mockRows = [
      { id: 1, invoiceNumber: '001', name: 'Alpha Corp', dueDate: '2026-07-07', amountDue: 5000, status: 'PENDING' },
    ];
    invoicingV2.findAndCountAll.mockResolvedValue({ count: 1, rows: mockRows });

    const result = await getPaymentsDashboardDueThisWeek(10);

    expect(invoicingV2.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ corporateUserId: 10 }),
        raw: true,
      })
    );
    expect(result.dueThisWeek).toEqual(mockRows);
    expect(result.recordsTotal).toBe(1);
  });

  it('returns empty when no invoices due this week', async () => {
    invoicingV2.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const result = await getPaymentsDashboardDueThisWeek(10);

    expect(result.dueThisWeek).toEqual([]);
    expect(result.recordsTotal).toBe(0);
  });

  it('throws if database query fails', async () => {
    invoicingV2.findAndCountAll.mockRejectedValue(new Error('Database error'));

    await expect(getPaymentsDashboardDueThisWeek(10)).rejects.toThrow('Database error');
  });
});

describe('getPaymentsDashboardRecentActivity', () => {
  beforeEach(() => jest.clearAllMocks());

  it('merges payment and overdue events sorted newest first', async () => {
    const mockPayments = [
      {
        id: 10,
        amount: '2000',
        createdAt: new Date('2026-04-28T10:00:00Z'),
        invoicing: { name: 'Alpha Corp', invoiceNumber: 'INV-001' },
      },
    ];
    const mockOverdue = [
      {
        id: 5,
        invoiceNumber: 'INV-002',
        name: 'Beta Ltd',
        amountDue: '3000',
        updatedAt: new Date('2026-04-27T10:00:00Z'),
      },
    ];

    manualPayment.findAll.mockResolvedValue(mockPayments);
    invoicingV2.findAll.mockResolvedValue(mockOverdue);

    const result = await getPaymentsDashboardRecentActivity(10);

    expect(result).toHaveProperty('recentActivity');
    expect(result.recentActivity.length).toBeGreaterThanOrEqual(1);

    const types = result.recentActivity.map(e => e.type);
    expect(types).toContain('PAYMENT_RECEIVED');
    expect(types).toContain('INVOICE_OVERDUE');
  });

  it('returns empty recentActivity when no data exists', async () => {
    manualPayment.findAll.mockResolvedValue([]);
    invoicingV2.findAll.mockResolvedValue([]);

    const result = await getPaymentsDashboardRecentActivity(10);

    expect(result.recentActivity).toEqual([]);
  });

  it('throws if a database query fails', async () => {
    manualPayment.findAll.mockRejectedValue(new Error('Database error'));
    invoicingV2.findAll.mockResolvedValue([]);

    await expect(getPaymentsDashboardRecentActivity(10)).rejects.toThrow('Database error');
  });
});
