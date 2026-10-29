const { getPaymentsDashboardOverview } = require('../../invoicingV2');
const invoicingV2 = require('../../../entities/invoicingV2');

jest.mock('../../../entities/invoicingV2');

describe('getPaymentsDashboardOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return correct overview metrics when data exists', async () => {
    invoicingV2.sum
      .mockResolvedValueOnce(80000)   // totalReceived (PAID this month)
      .mockResolvedValueOnce(40000)   // lastMonthReceived
      .mockResolvedValueOnce(20000)   // outstanding (amountDue PENDING this month)
      .mockResolvedValueOnce(5000)    // overdue (amountDue OVERDUE this month)
      .mockResolvedValueOnce(100000)  // thisMonthInvoiced
      .mockResolvedValueOnce(80000);  // lastMonthInvoiced

    invoicingV2.count
      .mockResolvedValueOnce(3)  // outstandingCount
      .mockResolvedValueOnce(1); // overdueCount

    const result = await getPaymentsDashboardOverview(10);

    expect(result.totalReceived).toBe(80000);
    expect(result.outstanding).toBe(20000);
    expect(result.outstandingCount).toBe(3);
    expect(result.overdue).toBe(5000);
    expect(result.overdueCount).toBe(1);
    expect(result.thisMonth).toBe(100000);
    expect(result.vsLastMonthReceived).toBe(100); // (80k-40k)/40k * 100
    expect(result.vsLastMonthThisMonth).toBe(25); // (100k-80k)/80k * 100
    expect(result.collectionHealth).toBeDefined();
    expect(result.collectionHealth.collectedPercent).toBe(80); // 80k/100k
  });

  it('should return null for vsLastMonth fields when last month data is zero', async () => {
    invoicingV2.sum
      .mockResolvedValueOnce(10000)  // totalReceived
      .mockResolvedValueOnce(0)      // lastMonthReceived
      .mockResolvedValueOnce(0)      // outstanding
      .mockResolvedValueOnce(0)      // overdue
      .mockResolvedValueOnce(10000)  // thisMonthInvoiced
      .mockResolvedValueOnce(0);     // lastMonthInvoiced

    invoicingV2.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    const result = await getPaymentsDashboardOverview(10);

    expect(result.vsLastMonthReceived).toBeNull();
    expect(result.vsLastMonthThisMonth).toBeNull();
  });

  it('should return all zeros and null percents when no data exists', async () => {
    invoicingV2.sum.mockResolvedValue(null);
    invoicingV2.count.mockResolvedValue(0);

    const result = await getPaymentsDashboardOverview(10);

    expect(result.totalReceived).toBe(0);
    expect(result.outstanding).toBe(0);
    expect(result.outstandingCount).toBe(0);
    expect(result.overdue).toBe(0);
    expect(result.overdueCount).toBe(0);
    expect(result.thisMonth).toBe(0);
    expect(result.vsLastMonthReceived).toBeNull();
    expect(result.vsLastMonthThisMonth).toBeNull();
    expect(result.collectionHealth).toEqual({
      collectedPercent: 0,
      outstandingPercent: 0,
      overduePercent: 0,
    });
  });

  it('should throw an error if database query fails', async () => {
    invoicingV2.sum.mockRejectedValue(new Error('Database error'));

    await expect(getPaymentsDashboardOverview(10)).rejects.toThrow('Database error');
  });
});
