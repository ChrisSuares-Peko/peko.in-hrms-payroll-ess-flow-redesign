const { createInvoice } = require('../../invoicingV2');
const invoicingV2 = require('../../../entities/invoicingV2');

jest.mock('../../../entities/invoicingV2');

describe('createInvoice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new invoice and return the created data', async () => {
    const params = {
      corporateUserId: 1,
      documentType: 'INVOICE',
      invoiceNumber: 'INV-001',
      name: 'John Doe',
      email: 'john@example.com',
      phoneNumber: '9876543210',
      totalAmount: 5000,
      amountDue: 5000,
      status: 'PENDING',
    };

    const mockCreatedInvoice = {
      id: 1,
      ...params,
      createdAt: '2024-03-01T10:00:00.000Z',
      updatedAt: '2024-03-01T10:00:00.000Z',
    };

    invoicingV2.create.mockResolvedValue(mockCreatedInvoice);

    const result = await createInvoice(params);

    expect(invoicingV2.create).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockCreatedInvoice);
  });

  it('should throw an error if invoice creation fails', async () => {
    const params = {
      corporateUserId: 1,
      documentType: 'INVOICE',
      invoiceNumber: 'INV-001',
      name: 'John Doe',
      totalAmount: 5000,
    };

    const expectedError = new Error('Database error');

    invoicingV2.create.mockRejectedValue(expectedError);

    await expect(createInvoice(params)).rejects.toThrow('Database error');
    expect(invoicingV2.create).toHaveBeenCalledWith(params);
  });
});
