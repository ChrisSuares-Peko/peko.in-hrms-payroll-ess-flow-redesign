const { addNote } = require('../../procure/purchaseOrderNote');
const PurchaseOrderNote = require('../../../entities/PurchaseOrderNote');

jest.mock('../../../entities/PurchaseOrderNote', () => ({ create: jest.fn(), findAll: jest.fn() }));
jest.mock('../../../entities/PurchaseOrder', () => ({ findOne: jest.fn() }));
jest.mock('../../../../configs/database/index', () => ({
  define: jest.fn(),
  transaction: jest.fn((cb) => cb()),
}));

describe('addNote', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should create and return a note with the provided fields', async () => {
    const input = { purchaseOrderId: 1, corporateUserId: 2, note: 'Please deliver by Friday' };
    const mockNote = { id: 10, ...input };
    PurchaseOrderNote.create.mockResolvedValue(mockNote);

    const result = await addNote(input);

    expect(PurchaseOrderNote.create).toHaveBeenCalledWith(input);
    expect(result).toEqual(mockNote);
  });

  it('should throw if the create fails', async () => {
    PurchaseOrderNote.create.mockRejectedValue(new Error('DB error'));

    await expect(addNote({ purchaseOrderId: 1, corporateUserId: 2, note: 'x' }))
      .rejects.toThrow('DB error');
  });
});
