const { countPurchaseOrders } = require('../../procure/procureVendor');
const PurchaseOrder = require('../../../entities/PurchaseOrder');

jest.mock('../../../entities/ProcureVendor', () => ({ findOne: jest.fn() }));
jest.mock('../../../entities/PurchaseOrder', () => ({ count: jest.fn() }));
jest.mock('../../../../configs/database/index', () => ({
  define: jest.fn(),
  transaction: jest.fn((cb) => cb()),
}));

describe('countPurchaseOrders', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return the count of purchase orders for a vendor', async () => {
    PurchaseOrder.count.mockResolvedValue(5);

    const result = await countPurchaseOrders(1);

    expect(PurchaseOrder.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { vendorId: 1 } })
    );
    expect(result).toBe(5);
  });

  it('should return 0 when vendor has no purchase orders', async () => {
    PurchaseOrder.count.mockResolvedValue(0);

    const result = await countPurchaseOrders(999);

    expect(result).toBe(0);
  });

  it('should throw if the query fails', async () => {
    PurchaseOrder.count.mockRejectedValue(new Error('DB error'));

    await expect(countPurchaseOrders(1)).rejects.toThrow('DB error');
  });
});
