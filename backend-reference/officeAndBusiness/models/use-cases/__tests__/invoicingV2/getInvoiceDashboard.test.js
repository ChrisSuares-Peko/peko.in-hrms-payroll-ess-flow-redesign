const { getInvoiceDashboard } = require('../../invoicingV2');
const invoicingV2 = require('../../../entities/invoicingV2');

jest.mock('../../../entities/invoicingV2');
jest.mock('../../../entities/manualPayment');

describe('getInvoiceDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return correct dashboard metrics when data exists', async () => {
    const corporateUserId = 10;

    invoicingV2.findAll
      .mockResolvedValueOnce([
        { id: 1, totalAmount: 60000, amountPaid: 20000, createdAt: '2020-01-15' },
      ])
      .mockResolvedValueOnce([
        { linkedInvoiceId: 1, totalAmount: 10000, createdAt: '2020-01-16' },
      ]);

    const result = await getInvoiceDashboard(corporateUserId);

    expect(result.totalInvoices).toBe(1);
    expect(result.totalSales).toBe(50000); // 60000 - 10000
    expect(result.totalReceived).toBe(20000);
    expect(result.outstandingAmount).toBe(30000); // (60000 - 10000) - 20000
  });

  it('should return all zeros when there are no invoices', async () => {
    invoicingV2.findAll.mockResolvedValueOnce([]);

    const result = await getInvoiceDashboard(10);

    expect(invoicingV2.findAll).toHaveBeenCalledTimes(1); // credit-note query skipped, no invoice ids
    expect(result).toEqual({
      totalInvoices: 0,
      totalSales: 0,
      totalReceived: 0,
      outstandingAmount: 0,
      salesVsLastMonthPercent: 0,
      receivedVsLastMonthPercent: 0,
    });
  });

  it('does not let a credit surplus on one invoice mask real debt owed on another', async () => {
    // Invoice A: fully credited after cash was already collected on it (a credit surplus).
    // Invoice B: genuinely unpaid, no credit note at all.
    // Pooling (old, buggy behaviour) would net these against each other and clamp to 0.
    invoicingV2.findAll
      .mockResolvedValueOnce([
        { id: 1, totalAmount: 5003.25, amountPaid: 3000, createdAt: '2020-01-01' }, // Invoice A
        { id: 2, totalAmount: 1000.65, amountPaid: 0, createdAt: '2020-01-01' },    // Invoice B
      ])
      .mockResolvedValueOnce([
        { linkedInvoiceId: 1, totalAmount: 5003.25, createdAt: '2020-01-02' }, // fully credits Invoice A
      ]);

    const result = await getInvoiceDashboard(10);

    // Invoice A: max(0, 5003.25 - 5003.25 - 3000) = 0
    // Invoice B: max(0, 1000.65 - 0 - 0) = 1000.65
    expect(result.outstandingAmount).toBeCloseTo(1000.65, 2);
  });

  it('should return salesVsLastMonthPercent as 100 when last month sales is 0 but current month has value', async () => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 15).toISOString();

    invoicingV2.findAll
      .mockResolvedValueOnce([
        { id: 1, totalAmount: 10000, amountPaid: 0, createdAt: thisMonth },
      ])
      .mockResolvedValueOnce([]);

    const result = await getInvoiceDashboard(10);

    expect(result.salesVsLastMonthPercent).toBe(100);
  });

  it('should throw an error if database query fails', async () => {
    const expectedError = new Error('Database error');
    invoicingV2.findAll.mockRejectedValue(expectedError);

    await expect(getInvoiceDashboard(10)).rejects.toThrow('Database error');
  });
});
