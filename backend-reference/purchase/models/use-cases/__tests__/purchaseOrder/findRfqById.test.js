const { findRfqById } = require('../../procure/purchaseOrder');
const RFQ = require('../../../entities/RFQ');

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

describe('findRfqById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return the RFQ with journey-relevant attributes', async () => {
    const mockRfq = { id: 3, refNumber: 'RFQ-001', title: 'Office Supplies', status: 'Sent' };
    RFQ.findByPk.mockResolvedValue(mockRfq);

    const result = await findRfqById(3);

    expect(RFQ.findByPk).toHaveBeenCalledWith(
      3,
      expect.objectContaining({
        attributes: expect.arrayContaining(['id', 'refNumber', 'title', 'status']),
      })
    );
    expect(result).toEqual(mockRfq);
  });

  it('should return null when the RFQ does not exist', async () => {
    RFQ.findByPk.mockResolvedValue(null);

    const result = await findRfqById(999);

    expect(result).toBeNull();
  });

  it('should throw if the query fails', async () => {
    RFQ.findByPk.mockRejectedValue(new Error('DB error'));

    await expect(findRfqById(3)).rejects.toThrow('DB error');
  });
});
