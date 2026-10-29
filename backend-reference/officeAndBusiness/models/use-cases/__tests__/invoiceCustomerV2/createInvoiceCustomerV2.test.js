const { createInvoiceCustomerV2 } = require('../../invoiceCustomerV2');
const InvoiceCustomerV2 = require('../../../entities/invoiceCustomerV2');

jest.mock('../../../entities/invoiceCustomerV2');

describe('createInvoiceCustomerV2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new customer and return the created data', async () => {
    const data = {
      corporateUserId: 10,
      name: 'Alpha Corp',
      email: 'alpha@example.com',
      phoneNumber: '9876543210',
      gstin: 'GST123456',
    };

    const mockCreated = {
      id: 1,
      ...data,
      createdAt: '2024-03-01T10:00:00.000Z',
      updatedAt: '2024-03-01T10:00:00.000Z',
    };

    InvoiceCustomerV2.create.mockResolvedValue(mockCreated);

    const result = await createInvoiceCustomerV2(data);

    expect(InvoiceCustomerV2.create).toHaveBeenCalledWith(data);
    expect(result).toEqual(mockCreated);
  });

  it('should return false if create returns null', async () => {
    const data = { corporateUserId: 10, name: 'Test' };

    InvoiceCustomerV2.create.mockResolvedValue(null);

    const result = await createInvoiceCustomerV2(data);

    expect(InvoiceCustomerV2.create).toHaveBeenCalledWith(data);
    expect(result).toBe(false);
  });

  it('should throw an error if creation fails', async () => {
    const data = { corporateUserId: 10, name: 'Test' };

    const expectedError = new Error('Database error');

    InvoiceCustomerV2.create.mockRejectedValue(expectedError);

    await expect(createInvoiceCustomerV2(data)).rejects.toThrow('Database error');
    expect(InvoiceCustomerV2.create).toHaveBeenCalledWith(data);
  });
});
