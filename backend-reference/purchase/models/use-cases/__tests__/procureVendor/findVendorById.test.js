const { findVendorById } = require('../../procure/procureVendor');
const ProcureVendor = require('../../../entities/ProcureVendor');

jest.mock('../../../entities/ProcureVendor', () => ({ findOne: jest.fn() }));
jest.mock('../../../entities/PurchaseOrder', () => ({ count: jest.fn() }));
jest.mock('../../../../configs/database/index', () => ({
  define: jest.fn(),
  transaction: jest.fn((cb) => cb()),
}));

describe('findVendorById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return the vendor when found', async () => {
    const mockVendor = { id: 1, businessName: 'Acme Corp', corporateUserId: 1 };
    ProcureVendor.findOne.mockResolvedValue(mockVendor);

    const result = await findVendorById({ id: 1, corporateUserId: 1 });

    expect(ProcureVendor.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1, corporateUserId: 1 } })
    );
    expect(result).toEqual(mockVendor);
  });

  it('should return null when the vendor does not exist', async () => {
    ProcureVendor.findOne.mockResolvedValue(null);

    const result = await findVendorById({ id: 999, corporateUserId: 1 });

    expect(result).toBeNull();
  });

  it('should throw if the query fails', async () => {
    ProcureVendor.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findVendorById({ id: 1, corporateUserId: 1 })).rejects.toThrow('DB error');
  });
});
