const { destroyVendor } = require('../../procure/procureVendor');

jest.mock('../../../entities/ProcureVendor', () => ({ findOne: jest.fn() }));
jest.mock('../../../entities/PurchaseOrder', () => ({ count: jest.fn() }));
jest.mock('../../../../configs/database/index', () => ({
  define: jest.fn(),
  transaction: jest.fn((cb) => cb()),
}));

describe('destroyVendor', () => {
  const mockVendor = { id: 1, destroy: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('should call vendor.destroy()', async () => {
    mockVendor.destroy.mockResolvedValue(undefined);

    await destroyVendor(mockVendor);

    expect(mockVendor.destroy).toHaveBeenCalledTimes(1);
  });

  it('should throw if vendor.destroy fails', async () => {
    mockVendor.destroy.mockRejectedValue(new Error('Destroy failed'));

    await expect(destroyVendor(mockVendor)).rejects.toThrow('Destroy failed');
  });
});
