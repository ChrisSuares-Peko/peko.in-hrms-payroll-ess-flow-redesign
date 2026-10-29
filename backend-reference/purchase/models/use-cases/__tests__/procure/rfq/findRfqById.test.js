'use strict';

const RFQ = require('../../../../entities/RFQ');
const { findRfqById } = require('../../../procure/rfq');

jest.mock('../../../../entities/RFQ',              () => ({ findOne: jest.fn() }));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({}));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/PurchaseRequest',  () => ({}));
jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));

describe('findRfqById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return RFQ when found', async () => {
    const mockRfq = { id: 1, corporateUserId: 10, status: 'Draft' };
    RFQ.findOne.mockResolvedValue(mockRfq);

    const result = await findRfqById({ id: 1, corporateUserId: 10 });

    expect(RFQ.findOne).toHaveBeenCalledWith({ where: { id: 1, corporateUserId: 10 } });
    expect(result).toEqual(mockRfq);
  });

  it('should return null when RFQ not found', async () => {
    RFQ.findOne.mockResolvedValue(null);

    const result = await findRfqById({ id: 99, corporateUserId: 10 });

    expect(result).toBeNull();
  });

  it('should throw when query rejects', async () => {
    RFQ.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findRfqById({ id: 1, corporateUserId: 10 })).rejects.toThrow('DB error');
  });
});
