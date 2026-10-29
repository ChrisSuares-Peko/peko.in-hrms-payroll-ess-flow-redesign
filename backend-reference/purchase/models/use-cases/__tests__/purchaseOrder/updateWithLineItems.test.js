const { updateWithLineItems } = require('../../procure/purchaseOrder');
const PurchaseOrderLineItem = require('../../../entities/PurchaseOrderLineItem');

jest.mock('../../../entities/PurchaseOrder', () => ({ findOne: jest.fn() }));
jest.mock('../../../entities/PurchaseOrderLineItem', () => ({ destroy: jest.fn(), bulkCreate: jest.fn() }));
jest.mock('../../../entities/ProcureVendor', () => ({}));
jest.mock('../../../entities/Proposal', () => ({}));
jest.mock('../../../entities/PurchaseRequest', () => ({ update: jest.fn() }));
jest.mock('../../../entities/RFQ', () => ({ findByPk: jest.fn() }));
jest.mock('../../../entities/corporateUser', () => ({ findOne: jest.fn() }));
jest.mock('../../../../configs/database/index', () => ({
  define: jest.fn(),
  transaction: jest.fn((cb) => cb()),
}));

describe('updateWithLineItems', () => {
  const mockPo = { id: 5, update: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('should update the PO and replace line items when lineItems are provided', async () => {
    const lineItems = [{ description: 'New item', qty: 1, unitPrice: 100, total: 100, sortOrder: 0 }];
    PurchaseOrderLineItem.destroy.mockResolvedValue(1);
    PurchaseOrderLineItem.bulkCreate.mockResolvedValue([]);
    mockPo.update.mockResolvedValue(mockPo);

    await updateWithLineItems({ po: mockPo, updates: { currency: 'USD' }, lineItems });

    expect(PurchaseOrderLineItem.destroy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { purchaseOrderId: 5 } })
    );
    expect(PurchaseOrderLineItem.bulkCreate).toHaveBeenCalledWith(
      [expect.objectContaining({ purchaseOrderId: 5 })],
      expect.anything()
    );
    expect(mockPo.update).toHaveBeenCalledWith({ currency: 'USD' }, expect.anything());
  });

  it('should update the PO without touching line items when lineItems is undefined', async () => {
    mockPo.update.mockResolvedValue(mockPo);

    await updateWithLineItems({ po: mockPo, updates: { deliveryAddress: 'New Address' }, lineItems: undefined });

    expect(PurchaseOrderLineItem.destroy).not.toHaveBeenCalled();
    expect(PurchaseOrderLineItem.bulkCreate).not.toHaveBeenCalled();
    expect(mockPo.update).toHaveBeenCalledWith({ deliveryAddress: 'New Address' }, expect.anything());
  });

  it('should throw if po.update fails', async () => {
    mockPo.update.mockRejectedValue(new Error('Update failed'));

    await expect(updateWithLineItems({ po: mockPo, updates: {}, lineItems: undefined }))
      .rejects.toThrow('Update failed');
  });
});
