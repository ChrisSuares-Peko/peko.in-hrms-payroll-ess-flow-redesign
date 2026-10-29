const { findByPkFull } = require('../../procure/purchaseOrder');
const PurchaseOrder = require('../../../entities/PurchaseOrder');

jest.mock('../../../entities/PurchaseOrder', () => ({ create: jest.fn(), findByPk: jest.fn() }));
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

describe('findByPkFull', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return a purchase order with full includes', async () => {
    const mockPO = { id: 1, refNumber: 'PO-001', vendor: {}, lineItems: [] };
    PurchaseOrder.findByPk.mockResolvedValue(mockPO);

    const result = await findByPkFull(1);

    expect(PurchaseOrder.findByPk).toHaveBeenCalledWith(1, expect.objectContaining({ include: expect.any(Array) }));
    expect(result).toEqual(mockPO);
  });

  it('should return null when the purchase order does not exist', async () => {
    PurchaseOrder.findByPk.mockResolvedValue(null);

    const result = await findByPkFull(999);

    expect(result).toBeNull();
  });

  it('should throw if the query fails', async () => {
    PurchaseOrder.findByPk.mockRejectedValue(new Error('DB error'));

    await expect(findByPkFull(1)).rejects.toThrow('DB error');
  });
});
