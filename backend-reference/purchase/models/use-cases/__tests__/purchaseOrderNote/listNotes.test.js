const { listNotes } = require('../../procure/purchaseOrderNote');
const PurchaseOrderNote = require('../../../entities/PurchaseOrderNote');

jest.mock('../../../entities/PurchaseOrderNote', () => ({ create: jest.fn(), findAll: jest.fn() }));
jest.mock('../../../entities/PurchaseOrder', () => ({ findOne: jest.fn() }));
jest.mock('../../../../configs/database/index', () => ({
  define: jest.fn(),
  transaction: jest.fn((cb) => cb()),
}));

describe('listNotes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return notes for a purchase order ordered by createdAt DESC', async () => {
    const mockNotes = [
      { id: 2, purchaseOrderId: 1, note: 'Second note' },
      { id: 1, purchaseOrderId: 1, note: 'First note' },
    ];
    PurchaseOrderNote.findAll.mockResolvedValue(mockNotes);

    const result = await listNotes({ purchaseOrderId: 1 });

    expect(PurchaseOrderNote.findAll).toHaveBeenCalledWith({
      where: { purchaseOrderId: 1 },
      order: [['createdAt', 'DESC']],
    });
    expect(result).toEqual(mockNotes);
  });

  it('should return an empty array when no notes exist', async () => {
    PurchaseOrderNote.findAll.mockResolvedValue([]);

    const result = await listNotes({ purchaseOrderId: 999 });

    expect(result).toEqual([]);
  });

  it('should throw if the query fails', async () => {
    PurchaseOrderNote.findAll.mockRejectedValue(new Error('DB error'));

    await expect(listNotes({ purchaseOrderId: 1 })).rejects.toThrow('DB error');
  });
});
