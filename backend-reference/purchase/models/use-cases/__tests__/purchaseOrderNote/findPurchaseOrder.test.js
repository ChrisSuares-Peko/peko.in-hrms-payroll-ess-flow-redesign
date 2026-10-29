const { findPurchaseOrder } = require('../../procure/purchaseOrderNote');
const PurchaseOrder = require('../../../entities/PurchaseOrder');

jest.mock('../../../entities/PurchaseOrderNote', () => ({ create: jest.fn(), findAll: jest.fn() }));
jest.mock('../../../entities/PurchaseOrder', () => ({ findOne: jest.fn() }));
jest.mock('../../../../configs/database/index', () => ({
  define: jest.fn(),
  transaction: jest.fn((cb) => cb()),
}));

describe('findPurchaseOrder', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return the purchase order when found', async () => {
    const mockPo = { id: 1, corporateUserId: 2 };
    PurchaseOrder.findOne.mockResolvedValue(mockPo);

    const result = await findPurchaseOrder({ id: 1, corporateUserId: 2 });

    expect(PurchaseOrder.findOne).toHaveBeenCalledWith({ where: { id: 1, corporateUserId: 2 } });
    expect(result).toEqual(mockPo);
  });

  it('should return null when the purchase order does not exist', async () => {
    PurchaseOrder.findOne.mockResolvedValue(null);

    const result = await findPurchaseOrder({ id: 999, corporateUserId: 2 });

    expect(result).toBeNull();
  });

  it('should throw if the query fails', async () => {
    PurchaseOrder.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findPurchaseOrder({ id: 1, corporateUserId: 2 })).rejects.toThrow('DB error');
  });
});
