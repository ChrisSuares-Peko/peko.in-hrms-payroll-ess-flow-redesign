'use strict';

const RFQ = require('../../../../entities/RFQ');
const { findRfqWithVendorInvites } = require('../../../procure/rfq');

jest.mock('../../../../entities/RFQ',              () => ({ findOne: jest.fn() }));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({}));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/PurchaseRequest',  () => ({}));
jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));

describe('findRfqWithVendorInvites', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return RFQ with vendorInvites', async () => {
    const mockRfq = { id: 1, corporateUserId: 10, vendorInvites: [{ id: 5, vendorId: 2 }] };
    RFQ.findOne.mockResolvedValue(mockRfq);

    const result = await findRfqWithVendorInvites({ id: 1, corporateUserId: 10 });

    expect(RFQ.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1, corporateUserId: 10 } })
    );
    expect(result).toEqual(mockRfq);
  });

  it('should return null when RFQ not found', async () => {
    RFQ.findOne.mockResolvedValue(null);

    const result = await findRfqWithVendorInvites({ id: 99, corporateUserId: 10 });

    expect(result).toBeNull();
  });

  it('should throw when query rejects', async () => {
    RFQ.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findRfqWithVendorInvites({ id: 1, corporateUserId: 10 })).rejects.toThrow('DB error');
  });
});
