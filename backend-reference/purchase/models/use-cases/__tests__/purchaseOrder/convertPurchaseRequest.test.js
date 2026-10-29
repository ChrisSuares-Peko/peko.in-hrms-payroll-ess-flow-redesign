const { convertPurchaseRequest } = require('../../procure/purchaseOrder');
const PurchaseRequest = require('../../../entities/PurchaseRequest');

jest.mock('../../../entities/PurchaseOrder', () => ({ create: jest.fn() }));
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

describe('convertPurchaseRequest', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should update the purchase request status to Converted to PO', async () => {
    PurchaseRequest.update.mockResolvedValue([1]);

    const result = await convertPurchaseRequest(5, 1);

    expect(PurchaseRequest.update).toHaveBeenCalledWith(
      { status: 'Converted to PO' },
      { where: { id: 5, corporateUserId: 1 } }
    );
    expect(result).toEqual([1]);
  });

  it('should return [0] when no matching record exists', async () => {
    PurchaseRequest.update.mockResolvedValue([0]);

    const result = await convertPurchaseRequest(999, 1);

    expect(result).toEqual([0]);
  });

  it('should throw if the update fails', async () => {
    PurchaseRequest.update.mockRejectedValue(new Error('DB error'));

    await expect(convertPurchaseRequest(5, 1)).rejects.toThrow('DB error');
  });
});
