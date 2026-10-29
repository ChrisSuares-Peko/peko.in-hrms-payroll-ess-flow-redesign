const { Op } = require('sequelize');
const { getAllInvoiceCustomersV2 } = require('../../invoiceCustomerV2');
const InvoiceCustomerV2 = require('../../../entities/invoiceCustomerV2');
const invoicingV2 = require('../../../entities/invoicingV2');
jest.mock('../../../entities/invoiceCustomerV2', () => ({
  findAndCountAll: jest.fn(),
  belongsTo: jest.fn(),
  hasMany: jest.fn(),
}));
jest.mock('../../../entities/invoicingV2');

describe('getAllInvoiceCustomersV2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all customers with search, status, date filters and attach transaction counts', async () => {
    const mockRows = [
      { id: 1, name: 'Alpha Corp', toJSON: () => ({ id: 1, name: 'Alpha Corp' }) },
      { id: 2, name: 'Beta Corp', toJSON: () => ({ id: 2, name: 'Beta Corp' }) },
    ];

    InvoiceCustomerV2.findAndCountAll.mockResolvedValue({ rows: mockRows, count: 2 });
    invoicingV2.count.mockResolvedValue(5);

    const params = {
      searchText: 'Corp',
      sort: 'ASC',
      sortField: 'name',
      limit: 10,
      offset: 0,
      corporateUserId: 10,
      status: 'ACTIVE',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    };

    const result = await getAllInvoiceCustomersV2(params);

    expect(InvoiceCustomerV2.findAndCountAll).toHaveBeenCalledWith({
      where: expect.objectContaining({
        corporateUserId: 10,
        status: 'ACTIVE',
        createdAt: expect.any(Object),
      }),
      order: [['name', 'ASC']],
      limit: 10,
      offset: 0,
      distinct: true,
    });
    expect(invoicingV2.count).toHaveBeenCalledTimes(4);
    expect(invoicingV2.count).toHaveBeenCalledWith({
      where: { customerId: 1, documentType: 'INVOICE', status: { [Op.ne]: 'CANCELLED' } },
    });
    expect(result.count).toBe(2);
    expect(result.rows[0]).toEqual({ id: 1, name: 'Alpha Corp', transactions: 5, invoiceCount: 5 });
    expect(result.rows[1]).toEqual({ id: 2, name: 'Beta Corp', transactions: 5, invoiceCount: 5 });
  });

  it('should return empty result when no customers found', async () => {
    InvoiceCustomerV2.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    const params = {
      searchText: 'NonExistent',
      sort: 'DESC',
      limit: 10,
      offset: 0,
      corporateUserId: 10,
    };

    const result = await getAllInvoiceCustomersV2(params);

    expect(InvoiceCustomerV2.findAndCountAll).toHaveBeenCalledWith(expect.any(Object));
    expect(result).toEqual({ count: 0, rows: [] });
  });

  it('should use default sort order and field when not provided', async () => {
    InvoiceCustomerV2.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    const params = {
      searchText: '',
      limit: 10,
      offset: 0,
      corporateUserId: 10,
    };

    await getAllInvoiceCustomersV2(params);

    expect(InvoiceCustomerV2.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        order: [['id', 'DESC']],
      })
    );
  });

  it('should handle exceptions thrown during execution', async () => {
    const errorMessage = 'Database error';
    InvoiceCustomerV2.findAndCountAll.mockRejectedValue(new Error(errorMessage));

    const params = {
      searchText: '',
      limit: 10,
      offset: 0,
      corporateUserId: 10,
    };

    await expect(getAllInvoiceCustomersV2(params)).rejects.toThrow(new Error(errorMessage));
  });
});
