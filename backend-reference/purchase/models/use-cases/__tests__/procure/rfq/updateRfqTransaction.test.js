'use strict';

const sequelize   = require('../../../../../configs/database/index');
const RFQLineItem = require('../../../../entities/RFQLineItem');
const { updateRfqTransaction } = require('../../../procure/rfq');

jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));
jest.mock('../../../../entities/RFQ',              () => ({}));
jest.mock('../../../../entities/RFQLineItem',      () => ({
  findAll: jest.fn(),
  destroy:  jest.fn(),
  update:   jest.fn(),
  create:   jest.fn(),
}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({}));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/PurchaseRequest',  () => ({}));

describe('updateRfqTransaction', () => {
  const mockRfq = { update: jest.fn().mockResolvedValue({}) };

  beforeEach(() => {
    jest.clearAllMocks();
    sequelize.transaction.mockImplementation((fn) => fn({}));
    RFQLineItem.findAll.mockResolvedValue([]);
    RFQLineItem.destroy.mockResolvedValue(0);
    RFQLineItem.update.mockResolvedValue([1]);
    RFQLineItem.create.mockResolvedValue({ id: 99 });
    mockRfq.update.mockResolvedValue({});
  });

  it('should apply header updates when provided', async () => {
    const headerUpdates = { title: 'Updated Title', buyerNotes: 'New notes' };

    await updateRfqTransaction({ rfq: mockRfq, headerUpdates, lineItems: undefined, rfqId: 'rfq-1' });

    expect(mockRfq.update).toHaveBeenCalledWith(headerUpdates, expect.anything());
  });

  it('should skip header update when headerUpdates is empty', async () => {
    await updateRfqTransaction({ rfq: mockRfq, headerUpdates: {}, lineItems: undefined, rfqId: 'rfq-1' });

    expect(mockRfq.update).not.toHaveBeenCalled();
  });

  it('should delete removed line items and create new ones', async () => {
    RFQLineItem.findAll
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
      .mockResolvedValueOnce([{ total: 500 }]);

    const lineItems = [
      { id: 1, description: 'Laptop', qty: 2, estUnitCost: 1000 },
      { description: 'Mouse', qty: 5, estUnitCost: 100 },
    ];

    await updateRfqTransaction({ rfq: mockRfq, headerUpdates: {}, lineItems, rfqId: 'rfq-1' });

    expect(RFQLineItem.destroy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: [2] } })
    );
    expect(RFQLineItem.update).toHaveBeenCalledTimes(1);
    expect(RFQLineItem.create).toHaveBeenCalledTimes(1);
  });

  it('should update estimatedTotal after line item sync', async () => {
    RFQLineItem.findAll
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ total: 1000 }, { total: 500 }]);

    await updateRfqTransaction({
      rfq: mockRfq, headerUpdates: {}, rfqId: 'rfq-1',
      lineItems: [{ description: 'Item', qty: 1, estUnitCost: 1500 }],
    });

    expect(mockRfq.update).toHaveBeenCalledWith(
      { estimatedTotal: 1500 },
      expect.anything()
    );
  });

  it('should skip line item sync when lineItems is undefined', async () => {
    await updateRfqTransaction({ rfq: mockRfq, headerUpdates: {}, lineItems: undefined, rfqId: 'rfq-1' });

    expect(RFQLineItem.findAll).not.toHaveBeenCalled();
  });

  it('should throw when transaction fails', async () => {
    sequelize.transaction.mockRejectedValue(new Error('Transaction error'));

    await expect(updateRfqTransaction({ rfq: mockRfq, headerUpdates: {}, lineItems: undefined, rfqId: 'rfq-1' }))
      .rejects.toThrow('Transaction error');
  });
});
