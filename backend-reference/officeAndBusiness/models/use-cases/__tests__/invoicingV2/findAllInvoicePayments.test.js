const { findAllInvoicePayments } = require('../../invoicingV2');
const manualPayment = require('../../../entities/manualPayment');

jest.mock('../../../entities/manualPayment');

describe('findAllInvoicePayments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all payments for an invoice ordered by id DESC', async () => {
    const invoiceId = 1;

    const mockPayments = [
      { id: 3, invoiceId: 1, amount: 2000, paymentMethod: 'CASH', createdAt: '2024-03-03T10:00:00.000Z' },
      { id: 2, invoiceId: 1, amount: 1500, paymentMethod: 'BANK_TRANSFER', createdAt: '2024-03-02T10:00:00.000Z' },
      { id: 1, invoiceId: 1, amount: 1000, paymentMethod: 'CASH', createdAt: '2024-03-01T10:00:00.000Z' },
    ];

    manualPayment.findAll.mockResolvedValue(mockPayments);

    const result = await findAllInvoicePayments(invoiceId);

    expect(manualPayment.findAll).toHaveBeenCalledWith({
      where: { invoiceId: 1 },
      order: [['id', 'DESC']],
    });
    expect(result).toEqual(mockPayments);
  });

  it('should return empty array when no payments found', async () => {
    const invoiceId = 999;

    manualPayment.findAll.mockResolvedValue([]);

    const result = await findAllInvoicePayments(invoiceId);

    expect(manualPayment.findAll).toHaveBeenCalledWith({
      where: { invoiceId: 999 },
      order: [['id', 'DESC']],
    });
    expect(result).toEqual([]);
  });

  it('should throw an error if database query fails', async () => {
    const invoiceId = 1;

    const expectedError = new Error('Database error');

    manualPayment.findAll.mockRejectedValue(expectedError);

    await expect(findAllInvoicePayments(invoiceId)).rejects.toThrow('Database error');
    expect(manualPayment.findAll).toHaveBeenCalledWith({
      where: { invoiceId: 1 },
      order: [['id', 'DESC']],
    });
  });
});
