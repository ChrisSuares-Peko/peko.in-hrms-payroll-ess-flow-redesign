const {createInvoiceCustomer} = require("../../invoiceCustomer");
const invoiceCustomer = require("../../../entities/invoiceCustomer");

jest.mock("../../../entities/invoiceCustomer",()=>({
    create: jest.fn(),
}))

describe('createInvoiceCustomer', () => {
  it('should create a new invoice customer', async () => {
    const mockData = {
      corporateUserId: 401,
  name: 'Varsha Venugopal',
  email: 'varshavenugopal647@gmail.com',
  phoneNumber: '9605542917',
  address: 'Kizhakkumpuram houseThekkiniyil',
  trnNo: '1234567890'
    };

    // Mock the create method
    invoiceCustomer.create.mockResolvedValue(mockData);

    const result = await createInvoiceCustomer(mockData);

    expect(invoiceCustomer.create).toHaveBeenCalledWith(mockData);
    expect(result).toEqual(mockData);
  });

  it('should return false if creation fails', async () => {
    const mockData = {
      customerName: 'Test Customer',
      email: 'test@example.com',
      phoneNumber: '9605542917',
      address: 'Kizhakkumpuram houseThekkiniyil',
      trnNo: '1234567890'
    };

    // Mock the create method to return null
    invoiceCustomer.create.mockResolvedValue(null);

    const result = await createInvoiceCustomer(mockData);

    expect(invoiceCustomer.create).toHaveBeenCalledWith(mockData);
    expect(result).toEqual(false);
  });
});

