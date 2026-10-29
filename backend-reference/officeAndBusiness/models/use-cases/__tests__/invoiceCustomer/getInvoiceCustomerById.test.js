const { getInvoiceCustomerById } = require("../../invoiceCustomer");
const invoiceCustomer = require("../../../entities/invoiceCustomer");

jest.mock('../../../entities/invoiceCustomer', () => ({
  findAndCountAll: jest.fn(),
  hasOne: jest.fn(),
}));

describe('getInvoiceCustomerById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return invoice customers with search and date filters', async () => {
    const params = {
      from: '2023-01-01',
      to: '2023-12-31',
      searchText: 'John',
      sort: 'ASC',
      limit: 10,
      offset: 0,
      corporateId: 123,
      customerAttribute: ['id', 'name', 'email'],
      sortField: 'name'
    };
    const expectedData = {
      count: 1,
      rows: [{ id: 1, name: 'John Doe', email: 'john.doe@example.com' }]
    };

    invoiceCustomer.findAndCountAll.mockResolvedValue(expectedData);

    const result = await getInvoiceCustomerById(params);

    expect(invoiceCustomer.findAndCountAll).toHaveBeenCalledWith({
      where: expect.any(Object),
      order: [['name', 'ASC']],
      limit: 10,
      offset: 0,
      attributes: ['id', 'name', 'email'],
      raw: true,
      nest: true
    });
    expect(result).toEqual(expectedData);
  });

  it('should return an error if findAndCountAll method throws an error', async () => {
    const params = {
      from: '2023-01-01',
      to: '2023-12-31',
      searchText: 'John',
      sort: 'ASC',
      limit: 10,
      offset: 0,
      corporateId: 123,
      customerAttribute: ['id', 'name', 'email'],
      sortField: 'name'
    };
    const expectedError = new Error('Database error');

    invoiceCustomer.findAndCountAll.mockRejectedValue(expectedError);

    await expect(getInvoiceCustomerById(params)).rejects.toThrow('Database error');
  });
});
