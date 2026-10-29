const { deleteInvoiceCustomerV2 } = require('../../invoiceCustomerV2');
const InvoiceCustomerV2 = require('../../../entities/invoiceCustomerV2');

jest.mock('../../../entities/invoiceCustomerV2');

describe('deleteInvoiceCustomerV2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find the customer, destroy it, and return true', async () => {
    const mockCustomer = {
      id: 1,
      corporateUserId: 10,
      destroy: jest.fn().mockResolvedValue(),
    };

    InvoiceCustomerV2.findOne.mockResolvedValue(mockCustomer);

    const result = await deleteInvoiceCustomerV2(1, 10);

    expect(InvoiceCustomerV2.findOne).toHaveBeenCalledWith({ where: { id: 1, corporateUserId: 10 } });
    expect(mockCustomer.destroy).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('should return null when customer is not found', async () => {
    InvoiceCustomerV2.findOne.mockResolvedValue(null);

    const result = await deleteInvoiceCustomerV2(9999, 10);

    expect(InvoiceCustomerV2.findOne).toHaveBeenCalledWith({ where: { id: 9999, corporateUserId: 10 } });
    expect(result).toBeNull();
  });

  it('should throw an error if database query fails', async () => {
    const expectedError = new Error('Database error');

    InvoiceCustomerV2.findOne.mockRejectedValue(expectedError);

    await expect(deleteInvoiceCustomerV2(1, 10)).rejects.toThrow('Database error');
    expect(InvoiceCustomerV2.findOne).toHaveBeenCalledWith({ where: { id: 1, corporateUserId: 10 } });
  });
});
