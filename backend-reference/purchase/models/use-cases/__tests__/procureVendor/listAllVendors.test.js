const { listAllVendors } = require('../../procure/procureVendor');
const ProcureVendor = require('../../../entities/ProcureVendor');
const { Op } = require('sequelize');

jest.mock('../../../entities/ProcureVendor', () => ({ findAll: jest.fn() }));
jest.mock('../../../entities/PurchaseOrder', () => ({ count: jest.fn() }));
jest.mock('../../../../configs/database/index', () => ({
  define: jest.fn(),
  transaction: jest.fn((cb) => cb()),
}));

describe('listAllVendors', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return all vendors for a corporate user with no filters', async () => {
    const mockVendors = [{ id: 1, businessName: 'Vendor A' }];
    ProcureVendor.findAll.mockResolvedValue(mockVendors);

    const result = await listAllVendors({ corporateUserId: 1 });

    expect(ProcureVendor.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { corporateUserId: 1 },
        order: [['businessName', 'ASC']],
        raw: true,
      })
    );
    expect(result).toEqual(mockVendors);
  });

  it('should apply status and search filters when provided', async () => {
    ProcureVendor.findAll.mockResolvedValue([]);

    await listAllVendors({ corporateUserId: 1, status: 'Active', search: 'test' });

    const callArg = ProcureVendor.findAll.mock.calls[0][0];
    expect(callArg.where.status).toBe('Active');
    expect(callArg.where[Op.or]).toBeDefined();
  });

  it('should return empty array when no vendors exist', async () => {
    ProcureVendor.findAll.mockResolvedValue([]);

    const result = await listAllVendors({ corporateUserId: 999 });

    expect(result).toEqual([]);
  });

  it('should throw if the query fails', async () => {
    ProcureVendor.findAll.mockRejectedValue(new Error('DB error'));

    await expect(listAllVendors({ corporateUserId: 1 })).rejects.toThrow('DB error');
  });
});
