const { findForJourney } = require('../../procure/purchaseOrder');
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

describe('findForJourney', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return the PO with purchaseRequest and proposal includes', async () => {
    const mockPO = {
      id: 1,
      purchaseRequest: { id: 2, refNumber: 'PR-001', rfqId: 3 },
      proposal: { id: 4, vendor: { businessName: 'Vendor X' } },
    };
    PurchaseOrder.findOne.mockResolvedValue(mockPO);

    const result = await findForJourney({ id: 1, corporateUserId: 1 });

    expect(PurchaseOrder.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1, corporateUserId: 1 },
        include: expect.any(Array),
      })
    );
    expect(result).toEqual(mockPO);
  });

  it('should return null when the order does not exist', async () => {
    PurchaseOrder.findOne.mockResolvedValue(null);

    const result = await findForJourney({ id: 999, corporateUserId: 1 });

    expect(result).toBeNull();
  });

  it('should throw if the query fails', async () => {
    PurchaseOrder.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findForJourney({ id: 1, corporateUserId: 1 })).rejects.toThrow('DB error');
  });
});
