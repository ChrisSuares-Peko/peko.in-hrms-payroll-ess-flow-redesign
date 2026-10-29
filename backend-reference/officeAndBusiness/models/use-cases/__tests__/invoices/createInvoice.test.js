const { createInvoice } = require('../../invoices');
const Invoice = require('../../../entities/invoices');

jest.mock('../../../entities/invoices');

describe('createInvoice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new invoice and return the created invoice data as JSON strings', async () => {
    const params = {
      recipientDetails: {
        billerName: "Jhon",
        billerEmail: "JhonA@gmail.com",
        billerCompanyAddress: "Happy street, no87, dubai, united arab emirates",
        billerPhone: "98787989898",
        billerVAT: "FEREF3434343434IN",
        customerName: "Jhon",
        customerEmail: "customer@gmail.com",
        customerAddress: "address line",
        customerPhone: "9090909090"
      },
      invoiceDetails: {
        invoiceDate: "01/01/2024",
        invoiceNo: "776767676",
        dueDate: "31-01-2024",
        logo: "https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/profile%2Fimages%2F1707557420024.png?alt=media&token=27405ff8-50d3-426a-97ab-d6fe8088cee6"
      },
      productDetails: [{
        item: "Macbook Pro",
        quantity: 1,
        price: 10000,
        vat: 13,
        discount: 10,
        amount: 10000
      }],
      paymentDetails: {
        subTotal: 10000,
        total: 9460
      },
      comments: "NA",
      termsConditions: "Test Conditions",
      credentialId: "160"
    };

    const mockInvoiceData = {
      id: 462,
      recipientDetails: JSON.stringify(params.recipientDetails),
      invoiceDetails: JSON.stringify(params.invoiceDetails),
      productDetails: JSON.stringify(params.productDetails),
      paymentDetails: JSON.stringify(params.paymentDetails),
      comments: "NA",
      termsConditions: "Test Conditions",
      credentialId: "160",
      updatedAt: "2024-02-10T09:30:21.029Z",
      createdAt: "2024-02-10T09:30:21.029Z"
    };

    Invoice.create.mockResolvedValue(mockInvoiceData);

    const result = await createInvoice(params);

    expect(Invoice.create).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockInvoiceData);
  });

  it('should throw an error if invoice creation fails', async () => {
    const params = {
      recipientDetails: {
        billerName: "Jhon",
        billerEmail: "JhonA@gmail.com",
        billerCompanyAddress: "Happy street, no87, dubai, united arab emirates",
        billerPhone: "98787989898",
        billerVAT: "FEREF3434343434IN",
        customerName: "Jhon",
        customerEmail: "customer@gmail.com",
        customerAddress: "address line",
        customerPhone: "9090909090"
      },
      invoiceDetails: {
        invoiceDate: "01/01/2024",
        invoiceNo: "776767676",
        dueDate: "31-01-2024",
        logo: "https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/profile%2Fimages%2F1707557420024.png?alt=media&token=27405ff8-50d3-426a-97ab-d6fe8088cee6"
      },
      productDetails: [{
        item: "Macbook Pro",
        quantity: 1,
        price: 10000,
        vat: 13,
        discount: 10,
        amount: 10000
      }],
      paymentDetails: {
        subTotal: 10000,
        total: 9460
      },
      comments: "NA",
      termsConditions: "Test Conditions",
      credentialId: "160"
    };

    const expectedError = new Error('Database error');

    Invoice.create.mockRejectedValue(expectedError);

    await expect(createInvoice(params)).rejects.toThrow('Database error');
    expect(Invoice.create).toHaveBeenCalledWith(params);
  });
});
