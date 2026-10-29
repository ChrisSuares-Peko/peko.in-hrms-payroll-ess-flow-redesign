const { findOneInvoice } = require('../../invoices');
const Invoice = require('../../../entities/invoices');

jest.mock('../../../entities/invoices');

describe('findOneInvoice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the invoice data when the invoice exists', async () => {
    const params = {
      id: 461
    };

    const mockInvoiceData = {
      id: 461,
      recipientDetails: "{\"customerAddress\":\"Payoll Payment Services LLC\",\"billTo\":\"Payoll Payment Services LLC\",\"customerEmail\":\"jithin@peko.one\",\"customerName\":\"jithin\"}",
      invoiceDetails: "{\"invoiceNo\":\"IN-12345\",\"paymentTerms\":\"Test Invoice\",\"dueDate\":\"2023-05-31\",\"poNo\":\"123456\"}",
      productDetails: "[{\"item\":\"Macbook Pro\",\"quantity\":1,\"price\":10000,\"amount\":10000}]",
      paymentDetails: "{\"subTotal\":10000,\"total\":9460}",
      comments: "NA",
      termsConditions: "Test Conditions",
      paymentMode: "cash",
      createdAt: "2024-02-10T09:05:11.000Z",
      updatedAt: "2024-02-10T09:05:11.000Z",
      credentialId: 160
    };

    // Mocking the findOne method to return the mock invoice data
    Invoice.findOne.mockResolvedValue(mockInvoiceData);

    const result = await findOneInvoice(params);

    expect(Invoice.findOne).toHaveBeenCalledWith({
      where: {
        id: params.id
      },
      raw: true,
      nest: true,
    });
    expect(result).toEqual(mockInvoiceData);
  });

  it('should return null if the invoice does not exist', async () => {
    const params = {
      id: 9999 // Non-existent invoice ID
    };

    // Mocking the findOne method to return null when the invoice is not found
    Invoice.findOne.mockResolvedValue(null);

    const result = await findOneInvoice(params);

    expect(Invoice.findOne).toHaveBeenCalledWith({
      where: {
        id: params.id
      },
      raw: true,
      nest: true,
    });
    expect(result).toBeNull();
  });

  it('should throw an error if the database query fails', async () => {
    const params = {
      id: 461
    };

    const expectedError = new Error('Database error');

    // Mocking the findOne method to throw an error
    Invoice.findOne.mockRejectedValue(expectedError);

    await expect(findOneInvoice(params)).rejects.toThrow('Database error');
    expect(Invoice.findOne).toHaveBeenCalledWith({
      where: {
        id: params.id
      },
      raw: true,
      nest: true,
    });
  });
  it('should scope by credentialId when provided (owner check)', async () => {
    Invoice.findOne.mockResolvedValue({ id: 461 });
    await findOneInvoice({ id: 461, credentialId: 160 });
    expect(Invoice.findOne).toHaveBeenCalledWith({
      where: { id: 461, credentialId: 160 },
      raw: true,
      nest: true,
    });
  });
});
