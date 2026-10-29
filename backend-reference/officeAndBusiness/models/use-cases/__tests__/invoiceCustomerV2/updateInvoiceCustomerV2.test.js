const { updateInvoiceCustomerV2 } = require('../../invoiceCustomerV2');
const InvoiceCustomerV2 = require('../../../entities/invoiceCustomerV2');

jest.mock('../../../entities/invoiceCustomerV2');

describe('updateInvoiceCustomerV2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find the customer and update it', async () => {
    const mockCustomer = {
      id: 1,
      corporateUserId: 10,
      name: 'Alpha Corp',
      update: jest.fn().mockResolvedValue({ id: 1, corporateUserId: 10, name: 'Alpha Corp Updated' }),
    };

    InvoiceCustomerV2.findOne.mockResolvedValue(mockCustomer);

    const result = await updateInvoiceCustomerV2(1, 10, { name: 'Alpha Corp Updated' });

    expect(InvoiceCustomerV2.findOne).toHaveBeenCalledWith({ where: { id: 1, corporateUserId: 10 } });
    expect(mockCustomer.update).toHaveBeenCalledWith({ name: 'Alpha Corp Updated' });
    expect(result).toEqual({ id: 1, corporateUserId: 10, name: 'Alpha Corp Updated' });
  });

  it('should return null when customer is not found', async () => {
    InvoiceCustomerV2.findOne.mockResolvedValue(null);

    const result = await updateInvoiceCustomerV2(9999, 10, { name: 'Test' });

    expect(InvoiceCustomerV2.findOne).toHaveBeenCalledWith({ where: { id: 9999, corporateUserId: 10 } });
    expect(result).toBeNull();
  });

  it('should throw an error if database query fails', async () => {
    const expectedError = new Error('Database error');

    InvoiceCustomerV2.findOne.mockRejectedValue(expectedError);

    await expect(updateInvoiceCustomerV2(1, 10, { name: 'Test' })).rejects.toThrow('Database error');
    expect(InvoiceCustomerV2.findOne).toHaveBeenCalledWith({ where: { id: 1, corporateUserId: 10 } });
  });
});
