const { fetchAllCustomersForInvoice } = require('../../invoicingV2');
const InvoiceCustomerV2 = require('../../../entities/invoiceCustomerV2');

jest.mock('../../../entities/invoiceCustomerV2');

describe('fetchAllCustomersForInvoice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return customers ordered by name ASC', async () => {
    const corporateUserId = 10;

    const mockCustomers = [
      { id: 1, name: 'Alpha Corp', gstin: 'GST111', primaryAddress: 'Addr 1', primaryCity: 'Mumbai', primaryState: 'MH', primaryPincode: '400001', primaryCountry: 'India', email: 'alpha@example.com', phoneNumber: '9000000001' },
      { id: 2, name: 'Beta Corp', gstin: 'GST222', primaryAddress: 'Addr 2', primaryCity: 'Delhi', primaryState: 'DL', primaryPincode: '110001', primaryCountry: 'India', email: 'beta@example.com', phoneNumber: '9000000002' },
    ];

    InvoiceCustomerV2.findAll.mockResolvedValue(mockCustomers);

    const result = await fetchAllCustomersForInvoice(corporateUserId);

    expect(InvoiceCustomerV2.findAll).toHaveBeenCalledWith({
      where: { corporateUserId: 10 },
      attributes: ['id', 'name', 'gstin', 'primaryAddress', 'primaryCity', 'primaryState', 'primaryPincode', 'primaryCountry', 'email', 'phoneNumber'],
      order: [['name', 'ASC']],
    });
    expect(result).toEqual(mockCustomers);
  });

  it('should return empty array when no customers found', async () => {
    const corporateUserId = 10;

    InvoiceCustomerV2.findAll.mockResolvedValue([]);

    const result = await fetchAllCustomersForInvoice(corporateUserId);

    expect(InvoiceCustomerV2.findAll).toHaveBeenCalledWith({
      where: { corporateUserId: 10 },
      attributes: ['id', 'name', 'gstin', 'primaryAddress', 'primaryCity', 'primaryState', 'primaryPincode', 'primaryCountry', 'email', 'phoneNumber'],
      order: [['name', 'ASC']],
    });
    expect(result).toEqual([]);
  });

  it('should throw an error if database query fails', async () => {
    const corporateUserId = 10;

    const expectedError = new Error('Database error');

    InvoiceCustomerV2.findAll.mockRejectedValue(expectedError);

    await expect(fetchAllCustomersForInvoice(corporateUserId)).rejects.toThrow('Database error');
    expect(InvoiceCustomerV2.findAll).toHaveBeenCalledWith({
      where: { corporateUserId: 10 },
      attributes: ['id', 'name', 'gstin', 'primaryAddress', 'primaryCity', 'primaryState', 'primaryPincode', 'primaryCountry', 'email', 'phoneNumber'],
      order: [['name', 'ASC']],
    });
  });
});
