const { getRecentTransactions } = require('../../invoicingV2');
const invoicingV2 = require('../../../entities/invoicingV2');

jest.mock('../../../entities/invoicingV2');

describe('getRecentTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return mapped transactions with prefixed invoice numbers', async () => {
    const mockRows = [
      { id: 1, documentType: 'INVOICE', invoiceNumber: '001', prefix: 'INV-', name: 'Alpha Corp', totalAmount: '5000.00', createdAt: '2026-04-01', updatedAt: '2026-04-01' },
      { id: 2, documentType: 'QUOTATION', invoiceNumber: '002', prefix: '', name: 'Beta Ltd', totalAmount: '2000.50', createdAt: '2026-04-02', updatedAt: '2026-04-02' },
    ];

    invoicingV2.findAndCountAll.mockResolvedValue({ count: 2, rows: mockRows });

    const result = await getRecentTransactions(10, 1, 5);

    expect(invoicingV2.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ corporateUserId: 10 }),
        limit: 5,
        order: [['createdAt', 'DESC'], ['updatedAt', 'DESC']],
        raw: true,
      })
    );
    expect(result.count).toBe(2);
    expect(result.rows[0].invoiceNumber).toBe('INV-001');
    expect(result.rows[0].customerName).toBe('Alpha Corp');
    expect(result.rows[0].totalAmount).toBe(5000);
    expect(result.rows[1].invoiceNumber).toBe('002');
  });

  it('should default itemsPerPage to 5 when not provided', async () => {
    invoicingV2.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await getRecentTransactions(10);

    expect(invoicingV2.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 5 })
    );
  });

  it('should return empty rows when no transactions exist', async () => {
    invoicingV2.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const result = await getRecentTransactions(10);

    expect(result.count).toBe(0);
    expect(result.rows).toEqual([]);
  });

  it('should throw an error if database query fails', async () => {
    invoicingV2.findAndCountAll.mockRejectedValue(new Error('Database error'));

    await expect(getRecentTransactions(10)).rejects.toThrow('Database error');
  });
});
