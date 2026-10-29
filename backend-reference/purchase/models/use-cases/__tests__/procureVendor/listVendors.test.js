const { listVendors } = require('../../procure/procureVendor');
const ProcureVendor = require('../../../entities/ProcureVendor');
const { Op } = require('sequelize');

jest.mock('../../../entities/ProcureVendor', () => ({ findAndCountAll: jest.fn() }));
jest.mock('../../../entities/PurchaseOrder', () => ({ count: jest.fn() }));
jest.mock('../../../../configs/database/index', () => ({
  define: jest.fn(),
  transaction: jest.fn((cb) => cb()),
}));

describe('listVendors', () => {
  const baseParams = {
    corporateUserId: 1,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    page: 1,
    limit: 20,
  };

  beforeEach(() => jest.clearAllMocks());

  it('should return paginated vendors with count', async () => {
    const mockRows = [{ id: 1, businessName: 'Vendor A' }];
    ProcureVendor.findAndCountAll.mockResolvedValue({ rows: mockRows, count: [{}] });

    const result = await listVendors(baseParams);

    expect(ProcureVendor.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { corporateUserId: 1 },
        limit: 20,
        offset: 0,
        subQuery: false,
      })
    );
    expect(result).toEqual({ rows: mockRows, count: 1 });
  });

  it('should apply status filter when provided', async () => {
    ProcureVendor.findAndCountAll.mockResolvedValue({ rows: [], count: [] });

    await listVendors({ ...baseParams, status: 'Active' });

    expect(ProcureVendor.findAndCountAll.mock.calls[0][0].where.status).toBe('Active');
  });

  it('should apply search filter across multiple fields', async () => {
    ProcureVendor.findAndCountAll.mockResolvedValue({ rows: [], count: [] });

    await listVendors({ ...baseParams, search: 'acme' });

    const callArg = ProcureVendor.findAndCountAll.mock.calls[0][0];
    expect(callArg.where[Op.or]).toBeDefined();
  });

  it('should return empty rows when no vendors match', async () => {
    ProcureVendor.findAndCountAll.mockResolvedValue({ rows: [], count: [] });

    const result = await listVendors(baseParams);

    expect(result).toEqual({ rows: [], count: 0 });
  });

  it('should throw if the query fails', async () => {
    ProcureVendor.findAndCountAll.mockRejectedValue(new Error('DB error'));

    await expect(listVendors(baseParams)).rejects.toThrow('DB error');
  });
});
