const { findAll } = require('../../procure/purchaseOrder');
const PurchaseOrder = require('../../../entities/PurchaseOrder');

jest.mock('../../../entities/PurchaseOrder', () => ({ findAndCountAll: jest.fn() }));
jest.mock('../../../entities/PurchaseOrderLineItem', () => ({ bulkCreate: jest.fn() }));
jest.mock('../../../entities/ProcureVendor', () => ({}));
jest.mock('../../../entities/Proposal', () => ({}));
jest.mock('../../../entities/PurchaseRequest', () => ({ update: jest.fn() }));
jest.mock('../../../entities/RFQ', () => ({ findByPk: jest.fn() }));
jest.mock('../../../entities/corporateUser', () => ({ findOne: jest.fn() }));
jest.mock('../../../../configs/database/index', () => ({
  define: jest.fn(),
  transaction: jest.fn((cb) => cb()),
}));

describe('findAll', () => {
  const baseParams = {
    corporateUserId: 1,
    status: undefined,
    vendorId: undefined,
    searchText: undefined,
    safeSortBy: 'createdAt',
    safeSortOrder: 'DESC',
    limit: 20,
    offset: 0,
  };

  beforeEach(() => jest.clearAllMocks());

  it('should return rows and count for a basic query', async () => {
    const mockResult = { rows: [{ id: 1 }], count: 1 };
    PurchaseOrder.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findAll(baseParams);

    expect(PurchaseOrder.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { corporateUserId: 1 },
        limit: 20,
        offset: 0,
        distinct: true,
      })
    );
    expect(result).toEqual(mockResult);
  });

  it('should apply status and vendorId filters when provided', async () => {
    PurchaseOrder.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await findAll({ ...baseParams, status: 'Draft', vendorId: 5 });

    expect(PurchaseOrder.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { corporateUserId: 1, status: 'Draft', vendorId: 5 } })
    );
  });

  it('should apply searchText as a LIKE filter on refNumber', async () => {
    PurchaseOrder.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await findAll({ ...baseParams, searchText: 'PO-00' });

    const call = PurchaseOrder.findAndCountAll.mock.calls[0][0];
    expect(call.where.refNumber).toBeDefined();
  });

  it('should return empty rows when no records match', async () => {
    PurchaseOrder.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    const result = await findAll(baseParams);

    expect(result).toEqual({ rows: [], count: 0 });
  });

  it('should throw if the query fails', async () => {
    PurchaseOrder.findAndCountAll.mockRejectedValue(new Error('DB error'));

    await expect(findAll(baseParams)).rejects.toThrow('DB error');
  });
});
