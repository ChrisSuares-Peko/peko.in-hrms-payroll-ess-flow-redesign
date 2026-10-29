const { deleteInvoiceCustomer } = require("../../invoiceCustomer");
const invoiceCustomer = require("../../../entities/invoiceCustomer");

jest.mock('../../../entities/invoiceCustomer', () => ({
  findOne: jest.fn(),
  hasOne: jest.fn(),
}));

describe('deleteInvoiceCustomer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete the invoice customer if it exists', async () => {
    const params = { id: 1 };
    const mockInvoiceCustomer = {
      id: 1,
      destroy: jest.fn().mockResolvedValue(true),
    };

    invoiceCustomer.findOne.mockResolvedValue(mockInvoiceCustomer);

    const result = await deleteInvoiceCustomer(params);

    expect(invoiceCustomer.findOne).toHaveBeenCalledWith({ where: { id: params.id } });
    expect(mockInvoiceCustomer.destroy).toHaveBeenCalledWith({ where: { id: params.id } });
    expect(result).toBe(true);
  });

  it('should throw an error if the invoice customer is not found', async () => {
    const params = { id: 1 };

    invoiceCustomer.findOne.mockResolvedValue(null);

    await expect(deleteInvoiceCustomer(params)).rejects.toThrow('Invoice customer not found');
    expect(invoiceCustomer.findOne).toHaveBeenCalledWith({ where: { id: params.id } });
  });

  it('should throw an error if destroy method fails', async () => {
    const params = { id: 1 };
    const mockInvoiceCustomer = {
      id: 1,
      destroy: jest.fn().mockRejectedValue(new Error('Delete failed')),
    };

    invoiceCustomer.findOne.mockResolvedValue(mockInvoiceCustomer);

    await expect(deleteInvoiceCustomer(params)).rejects.toThrow('Delete failed');
    expect(mockInvoiceCustomer.destroy).toHaveBeenCalledWith({ where: { id: params.id } });
  });
});
