const { getQuotationDashboard } = require('../../invoicingV2');
const invoicingV2 = require('../../../entities/invoicingV2');

jest.mock('../../../entities/invoicingV2');

describe('getQuotationDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return correct quotation counts when data exists', async () => {
    invoicingV2.count
      .mockResolvedValueOnce(15)  // totalQuotations
      .mockResolvedValueOnce(10)  // accepted
      .mockResolvedValueOnce(5);  // pending

    const result = await getQuotationDashboard(10);

    expect(invoicingV2.count).toHaveBeenCalledTimes(3);
    expect(invoicingV2.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ corporateUserId: 10, documentType: 'QUOTATION' }),
      })
    );
    expect(result).toEqual({ totalQuotations: 15, accepted: 10, pending: 5 });
  });

  it('should return all zeros when no quotations exist', async () => {
    invoicingV2.count.mockResolvedValue(0);

    const result = await getQuotationDashboard(10);

    expect(result).toEqual({ totalQuotations: 0, accepted: 0, pending: 0 });
  });

  it('should return zeros when count returns null', async () => {
    invoicingV2.count.mockResolvedValue(null);

    const result = await getQuotationDashboard(10);

    expect(result).toEqual({ totalQuotations: 0, accepted: 0, pending: 0 });
  });

  it('should throw an error if database query fails', async () => {
    const expectedError = new Error('Database error');

    invoicingV2.count.mockRejectedValue(expectedError);

    await expect(getQuotationDashboard(10)).rejects.toThrow('Database error');
  });
});
