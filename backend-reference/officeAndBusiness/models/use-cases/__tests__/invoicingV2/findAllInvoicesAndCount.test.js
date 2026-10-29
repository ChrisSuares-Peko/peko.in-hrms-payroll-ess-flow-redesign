const { findAllInvoicesAndCount } = require('../../invoicingV2');
const invoicingV2 = require('../../../entities/invoicingV2');
const SubCorporateUser = require('../../../entities/subCorporateUsers');
const { Op } = require('sequelize');

jest.mock('../../../entities/subCorporateUsers');
jest.mock('../../../entities/invoicingV2', () => ({
  belongsTo: jest.fn(),
  findAndCountAll: jest.fn(),
}));

describe('findAllInvoicesAndCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all invoices with the correct query parameters', async () => {
    const mockResponseData = {
      rows: [
        {
          id: 1,
          invoiceNumber: 'INV-001',
          name: 'John Doe',
          email: 'john@example.com',
          totalAmount: 5000,
          status: 'PENDING',
          corporateUserId: 10,
          SubCorporateUser: { id: 1, name: 'Sub User' },
        },
      ],
      count: 1,
    };

    invoicingV2.findAndCountAll.mockResolvedValue(mockResponseData);

    const params = {
      from: '2024-01-01',
      to: '2024-12-31',
      limit: 10,
      offset: 0,
      searchText: 'John',
      sort: 'ASC',
      sortField: 'invoiceNumber',
      userId: 10,
      subCorporateUserId: 1,
      status: 'PENDING',
    };

    const result = await findAllInvoicesAndCount(params);

    expect(invoicingV2.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: [
          {
            model: SubCorporateUser,
            attributes: ['id', 'name'],
            required: false,
          },
        ],
        order: [['invoiceNumber', 'ASC']],
        limit: 10,
        offset: 0,
        raw: true,
        nest: true,
      })
    );

    // Verify key where clause fields
    const calledWith = invoicingV2.findAndCountAll.mock.calls[0][0];
    expect(calledWith.where.corporateUserId).toBe(10);
    expect(calledWith.where.status).toBe('PENDING');
    expect(calledWith.where.subCorporateUserId).toBe(1);
    expect(calledWith.where[Op.or]).toBeDefined();
    expect(calledWith.where.createdAt).toBeDefined();
    expect(result).toEqual(mockResponseData);
  });

  it('should fetch with minimal params using defaults', async () => {
    const mockResponseData = { rows: [], count: 0 };

    invoicingV2.findAndCountAll.mockResolvedValue(mockResponseData);

    const params = {
      limit: 10,
      offset: 0,
    };

    const result = await findAllInvoicesAndCount(params);

    const calledWith = invoicingV2.findAndCountAll.mock.calls[0][0];
    expect(calledWith.where.status).toEqual({ [Op.ne]: 'CANCELLED' });
    expect(calledWith.order).toEqual([['id', 'DESC']]);
    expect(result).toEqual(mockResponseData);
  });

  it('should handle cases where no invoices are found', async () => {
    invoicingV2.findAndCountAll.mockResolvedValue({
      rows: [],
      count: 0,
    });

    const params = {
      from: '2024-01-01',
      to: '2024-12-31',
      limit: 10,
      offset: 0,
      searchText: 'NonExistent',
      userId: 10,
    };

    const result = await findAllInvoicesAndCount(params);

    expect(invoicingV2.findAndCountAll).toHaveBeenCalledWith(expect.any(Object));
    expect(result).toEqual({ rows: [], count: 0 });
  });

  it('should handle exceptions thrown during execution', async () => {
    const errorMessage = 'Database error';
    invoicingV2.findAndCountAll.mockRejectedValue(new Error(errorMessage));

    const params = {
      from: '2024-01-01',
      to: '2024-12-31',
      limit: 10,
      offset: 0,
    };

    await expect(findAllInvoicesAndCount(params)).rejects.toThrow(new Error(errorMessage));
  });
});
