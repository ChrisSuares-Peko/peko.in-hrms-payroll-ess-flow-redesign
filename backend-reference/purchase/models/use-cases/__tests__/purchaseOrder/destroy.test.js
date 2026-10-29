const { destroy } = require('../../procure/purchaseOrder');

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

describe('destroy', () => {
  const mockPo = { id: 1, destroy: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('should call po.destroy to soft-delete the record', async () => {
    mockPo.destroy.mockResolvedValue(undefined);

    await destroy(mockPo);

    expect(mockPo.destroy).toHaveBeenCalledTimes(1);
  });

  it('should throw if po.destroy fails', async () => {
    mockPo.destroy.mockRejectedValue(new Error('Delete failed'));

    await expect(destroy(mockPo)).rejects.toThrow('Delete failed');
  });
});
