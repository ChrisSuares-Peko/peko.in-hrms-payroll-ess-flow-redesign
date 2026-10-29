const { findByIdSimple } = require('../../procure/purchaseOrder');
const PurchaseOrder = require('../../../entities/PurchaseOrder');

jest.mock('../../../entities/PurchaseOrder', () => ({ findOne: jest.fn() }));
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

describe('findByIdSimple', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return the purchase order without includes', async () => {
    const mockPO = { id: 1, refNumber: 'PO-001', status: 'Draft' };
    PurchaseOrder.findOne.mockResolvedValue(mockPO);

    const result = await findByIdSimple({ id: 1, corporateUserId: 1 });

    expect(PurchaseOrder.findOne).toHaveBeenCalledWith({ where: { id: 1, corporateUserId: 1 } });
    expect(result).toEqual(mockPO);
  });

  it('should return null when the order does not exist', async () => {
    PurchaseOrder.findOne.mockResolvedValue(null);

    const result = await findByIdSimple({ id: 999, corporateUserId: 1 });

    expect(result).toBeNull();
  });

  it('should throw if the query fails', async () => {
    PurchaseOrder.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findByIdSimple({ id: 1, corporateUserId: 1 })).rejects.toThrow('DB error');
  });
});
