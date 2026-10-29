const { getSalesOrderDashboard } = require('../../invoicingV2');
const invoicingV2 = require('../../../entities/invoicingV2');

jest.mock('../../../entities/invoicingV2');

describe('getSalesOrderDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return correct sales order counts when data exists', async () => {
    invoicingV2.count
      .mockResolvedValueOnce(20)  // totalOrders
      .mockResolvedValueOnce(8)   // pending
      .mockResolvedValueOnce(12); // completed

    const result = await getSalesOrderDashboard(10);

    expect(invoicingV2.count).toHaveBeenCalledTimes(3);
    expect(invoicingV2.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ corporateUserId: 10, documentType: 'SALES_ORDER' }),
      })
    );
    expect(result).toEqual({ totalOrders: 20, pending: 8, completed: 12 });
  });

  it('should return all zeros when no sales orders exist', async () => {
    invoicingV2.count.mockResolvedValue(0);

    const result = await getSalesOrderDashboard(10);

    expect(result).toEqual({ totalOrders: 0, pending: 0, completed: 0 });
  });

  it('should return zeros when count returns null', async () => {
    invoicingV2.count.mockResolvedValue(null);

    const result = await getSalesOrderDashboard(10);

    expect(result).toEqual({ totalOrders: 0, pending: 0, completed: 0 });
  });

  it('should throw an error if database query fails', async () => {
    const expectedError = new Error('Database error');

    invoicingV2.count.mockRejectedValue(expectedError);

    await expect(getSalesOrderDashboard(10)).rejects.toThrow('Database error');
  });
});
