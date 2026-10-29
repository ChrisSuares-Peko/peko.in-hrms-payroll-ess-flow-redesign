const { bulkCreateVendors } = require('../../procure/procureVendor');
const ProcureVendor = require('../../../entities/ProcureVendor');

jest.mock('../../../entities/ProcureVendor', () => ({ bulkCreate: jest.fn() }));
jest.mock('../../../entities/PurchaseOrder', () => ({ count: jest.fn() }));
jest.mock('../../../../configs/database/index', () => ({
  define: jest.fn(),
  transaction: jest.fn((cb) => cb()),
}));

describe('bulkCreateVendors', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should bulk create vendors and return the created records', async () => {
    const vendors = [
      { corporateUserId: 1, businessName: 'Vendor A', contactPerson: 'Alice', email: 'a@a.com' },
      { corporateUserId: 1, businessName: 'Vendor B', contactPerson: 'Bob', email: 'b@b.com' },
    ];
    const created = vendors.map((v, i) => ({ id: i + 1, ...v }));
    ProcureVendor.bulkCreate.mockResolvedValue(created);

    const result = await bulkCreateVendors(vendors);

    expect(ProcureVendor.bulkCreate).toHaveBeenCalledWith(vendors, { validate: true });
    expect(result).toHaveLength(2);
  });

  it('should return an empty array when given no vendors', async () => {
    ProcureVendor.bulkCreate.mockResolvedValue([]);

    const result = await bulkCreateVendors([]);

    expect(result).toEqual([]);
  });

  it('should throw if bulkCreate fails', async () => {
    ProcureVendor.bulkCreate.mockRejectedValue(new Error('Validation error'));

    await expect(bulkCreateVendors([{ businessName: '' }])).rejects.toThrow('Validation error');
  });
});
