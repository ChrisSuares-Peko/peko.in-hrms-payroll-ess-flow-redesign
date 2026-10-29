const { updateInvoiceCustomer } = require("../../invoiceCustomer");
const invoiceCustomer = require("../../../entities/invoiceCustomer");

jest.mock('../../../entities/invoiceCustomer', () => ({
  update: jest.fn(),
  hasOne: jest.fn(),
}));

describe('updateInvoiceCustomer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update the invoice customer and return the response data', async () => {
    const data = { name: 'Updated Name', email: 'updated.email@example.com' };
    const params = { id: 1 };
    const mockResponseData = [1]; // Sequelize returns an array where the first element is the number of affected rows

    invoiceCustomer.update.mockResolvedValue(mockResponseData);

    const result = await updateInvoiceCustomer(data, params);

    expect(invoiceCustomer.update).toHaveBeenCalledWith(data, {
      where: { id: params.id },
    });
    expect(result).toBe(mockResponseData);
  });

  it('should return false if no rows are updated', async () => {
    const data = { name: 'Updated Name', email: 'updated.email@example.com' };
    const params = { id: 1 };
    const mockResponseData = false; // No rows were updated

    invoiceCustomer.update.mockResolvedValue(mockResponseData);

    const result = await updateInvoiceCustomer(data, params);

    expect(invoiceCustomer.update).toHaveBeenCalledWith(data, {
      where: { id: params.id },
    });
    expect(result).toBe(false);
  });

  it('should throw an error if the update method fails', async () => {
    const data = { name: 'Updated Name', email: 'updated.email@example.com' };
    const params = { id: 1 };
    const expectedError = new Error('Update failed');

    invoiceCustomer.update.mockRejectedValue(expectedError);

    await expect(updateInvoiceCustomer(data, params)).rejects.toThrow('Update failed');
    expect(invoiceCustomer.update).toHaveBeenCalledWith(data, {
      where: { id: params.id },
    });
  });
});
