'use strict';

const RFQ = require('../../../../entities/RFQ');
const { findRfqByIdWithFull } = require('../../../procure/rfq');

jest.mock('../../../../entities/RFQ',              () => ({ findOne: jest.fn() }));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({}));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/PurchaseRequest',  () => ({}));
jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));

describe('findRfqByIdWithFull', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return RFQ with full includes scoped to corporateUserId', async () => {
    const mockRfq = { id: 1, corporateUserId: 10, lineItems: [], vendorInvites: [] };
    RFQ.findOne.mockResolvedValue(mockRfq);

    const result = await findRfqByIdWithFull({ id: 1, corporateUserId: 10 });

    expect(RFQ.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1, corporateUserId: 10 } })
    );
    expect(result).toEqual(mockRfq);
  });

  it('should return null when RFQ not found for corporateUserId', async () => {
    RFQ.findOne.mockResolvedValue(null);

    const result = await findRfqByIdWithFull({ id: 1, corporateUserId: 99 });

    expect(result).toBeNull();
  });

  it('should throw when query rejects', async () => {
    RFQ.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findRfqByIdWithFull({ id: 1, corporateUserId: 10 })).rejects.toThrow('DB error');
  });
});
