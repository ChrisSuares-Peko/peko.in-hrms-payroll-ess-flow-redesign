const { createWithLineItems } = require('../../procure/purchaseOrder');
const PurchaseOrder = require('../../../entities/PurchaseOrder');
const PurchaseOrderLineItem = require('../../../entities/PurchaseOrderLineItem');

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

describe('createWithLineItems', () => {
  beforeEach(() => jest.clearAllMocks());

  const params = {
    corporateUserId: 1, refNumber: 'PO-001', vendorId: 2,
    proposalId: null, purchaseRequestId: null,
    currency: 'INR', deliveryAddress: '123 St', deliveryDate: '2025-01-01',
    paymentTerms: 'Net 30', notesToVendor: null, internalNotes: null,
    subtotal: 1000, taxAmount: 0, totalAmount: 1000,
    lineItems: [{ description: 'Item A', qty: 2, unitPrice: 500, total: 1000, sortOrder: 0 }],
  };

  it('should create a purchase order and bulk-create line items', async () => {
    const mockOrder = { id: 10, ...params };
    PurchaseOrder.create.mockResolvedValue(mockOrder);
    PurchaseOrderLineItem.bulkCreate.mockResolvedValue([]);

    const result = await createWithLineItems(params);

    expect(PurchaseOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({ corporateUserId: 1, refNumber: 'PO-001', vendorId: 2 }),
      expect.anything()
    );
    expect(PurchaseOrderLineItem.bulkCreate).toHaveBeenCalledWith(
      [expect.objectContaining({ purchaseOrderId: 10 })],
      expect.anything()
    );
    expect(result).toEqual(mockOrder);
  });

  it('should set proposalId and purchaseRequestId to null when not provided', async () => {
    PurchaseOrder.create.mockResolvedValue({ id: 11 });
    PurchaseOrderLineItem.bulkCreate.mockResolvedValue([]);

    await createWithLineItems({ ...params, proposalId: undefined, purchaseRequestId: undefined });

    expect(PurchaseOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({ proposalId: null, purchaseRequestId: null }),
      expect.anything()
    );
  });

  it('should throw if PurchaseOrder.create fails', async () => {
    PurchaseOrder.create.mockRejectedValue(new Error('DB error'));

    await expect(createWithLineItems(params)).rejects.toThrow('DB error');
    expect(PurchaseOrderLineItem.bulkCreate).not.toHaveBeenCalled();
  });
});
