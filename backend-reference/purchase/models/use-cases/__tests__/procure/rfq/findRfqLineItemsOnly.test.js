'use strict';

const RFQ = require('../../../../entities/RFQ');
const { findRfqLineItemsOnly } = require('../../../procure/rfq');

jest.mock('../../../../entities/RFQ',              () => ({ findOne: jest.fn() }));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({}));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/PurchaseRequest',  () => ({}));
jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));

describe('findRfqLineItemsOnly', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return RFQ with lineItems (no corporateUserId filter)', async () => {
    const mockRfq = { id: 1, lineItems: [{ id: 1, description: 'Laptop' }] };
    RFQ.findOne.mockResolvedValue(mockRfq);

    const result = await findRfqLineItemsOnly({ id: 1 });

    expect(RFQ.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } })
    );
    expect(result).toEqual(mockRfq);
  });

  it('should return null when RFQ not found', async () => {
    RFQ.findOne.mockResolvedValue(null);

    const result = await findRfqLineItemsOnly({ id: 99 });

    expect(result).toBeNull();
  });

  it('should throw when query rejects', async () => {
    RFQ.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findRfqLineItemsOnly({ id: 1 })).rejects.toThrow('DB error');
  });
});
