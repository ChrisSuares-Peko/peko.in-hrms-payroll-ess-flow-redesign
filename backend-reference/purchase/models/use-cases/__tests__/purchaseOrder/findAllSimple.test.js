const { findAllSimple } = require('../../procure/purchaseOrder');
const PurchaseOrder = require('../../../entities/PurchaseOrder');

jest.mock('../../../entities/PurchaseOrder', () => ({ findAll: jest.fn() }));
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

describe('findAllSimple', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return a list of purchase orders with minimal fields', async () => {
    const mockRows = [
      { id: 1, refNumber: 'PO-001', status: 'Draft', totalAmount: 1000, currency: 'INR' },
      { id: 2, refNumber: 'PO-002', status: 'Sent',  totalAmount: 2000, currency: 'INR' },
    ];
    PurchaseOrder.findAll.mockResolvedValue(mockRows);

    const result = await findAllSimple(1);

    expect(PurchaseOrder.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { corporateUserId: 1 },
        attributes: expect.arrayContaining(['id', 'refNumber', 'status', 'totalAmount', 'currency']),
      })
    );
    expect(result).toEqual(mockRows);
  });

  it('should return an empty array when no orders exist', async () => {
    PurchaseOrder.findAll.mockResolvedValue([]);

    const result = await findAllSimple(1);

    expect(result).toEqual([]);
  });

  it('should throw if the query fails', async () => {
    PurchaseOrder.findAll.mockRejectedValue(new Error('DB error'));

    await expect(findAllSimple(1)).rejects.toThrow('DB error');
  });
});
