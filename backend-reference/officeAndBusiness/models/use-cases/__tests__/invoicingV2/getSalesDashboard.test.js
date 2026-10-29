const { getSalesDashboard } = require('../../invoicingV2');
const invoicingV2 = require('../../../entities/invoicingV2');
const InvoiceCustomerV2 = require('../../../entities/invoiceCustomerV2');
const agreement = require('../../../entities/agreement');

jest.mock('../../../entities/invoicingV2');
jest.mock('../../../entities/invoiceCustomerV2');
jest.mock('../../../entities/agreement');

describe('getSalesDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return correct dashboard counts when data exists', async () => {
    InvoiceCustomerV2.count.mockResolvedValue(50);
    invoicingV2.count
      .mockResolvedValueOnce(100)  // invoicesCount
      .mockResolvedValueOnce(30)   // salesOrdersCount
      .mockResolvedValueOnce(20);  // quotationsCount
    agreement.count.mockResolvedValue(5);
    invoicingV2.sum.mockResolvedValue(500000);

    const result = await getSalesDashboard(10);

    expect(InvoiceCustomerV2.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { corporateUserId: 10, status: 'ACTIVE' } })
    );
    expect(result).toEqual({
      customersCount: 50,
      quotationsCount: 20,
      agreementsCount: 5,
      salesOrdersCount: 30,
      totalPaymentsAmount: 500000,
      invoicesCount: 100,
    });
  });

  it('should return all zeros when no data exists', async () => {
    InvoiceCustomerV2.count.mockResolvedValue(0);
    invoicingV2.count.mockResolvedValue(0);
    agreement.count.mockResolvedValue(0);
    invoicingV2.sum.mockResolvedValue(null);

    const result = await getSalesDashboard(10);

    expect(result).toEqual({
      customersCount: 0,
      quotationsCount: 0,
      agreementsCount: 0,
      salesOrdersCount: 0,
      totalPaymentsAmount: 0,
      invoicesCount: 0,
    });
  });

  it('should throw an error if database query fails', async () => {
    InvoiceCustomerV2.count.mockRejectedValue(new Error('Database error'));

    await expect(getSalesDashboard(10)).rejects.toThrow('Database error');
  });
});
