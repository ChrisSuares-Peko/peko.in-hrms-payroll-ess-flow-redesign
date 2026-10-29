const { updateStatus } = require('../../procure/purchaseOrder');

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

describe('updateStatus', () => {
  const mockPo = { id: 1, update: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('should call po.update with the new status and timestamp field', async () => {
    mockPo.update.mockResolvedValue({ ...mockPo, status: 'Sent' });

    await updateStatus({ po: mockPo, status: 'Sent', timestampField: 'sentAt' });

    expect(mockPo.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'Sent', sentAt: expect.any(Date) })
    );
  });

  it('should use the correct timestamp field for each transition', async () => {
    mockPo.update.mockResolvedValue({});

    await updateStatus({ po: mockPo, status: 'Completed', timestampField: 'completedAt' });

    expect(mockPo.update).toHaveBeenCalledWith(
      expect.objectContaining({ completedAt: expect.any(Date) })
    );
  });

  it('should throw if po.update fails', async () => {
    mockPo.update.mockRejectedValue(new Error('Update failed'));

    await expect(updateStatus({ po: mockPo, status: 'Sent', timestampField: 'sentAt' }))
      .rejects.toThrow('Update failed');
  });
});
