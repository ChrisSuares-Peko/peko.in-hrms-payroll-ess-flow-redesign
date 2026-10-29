'use strict';

const RFQ = require('../../../../entities/RFQ');
const { findRfqByCorporate } = require('../../../procure/proposal');

jest.mock('../../../../entities/RFQ',              () => ({ findOne: jest.fn() }));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({}));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/Proposal',         () => ({}));
jest.mock('../../../../entities/ProposalLineItem', () => ({}));
jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));

describe('findRfqByCorporate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return RFQ when found', async () => {
    const mockRfq = { id: 1, corporateUserId: 10, title: 'Test RFQ' };
    RFQ.findOne.mockResolvedValue(mockRfq);

    const result = await findRfqByCorporate({ rfqId: 1, corporateUserId: 10 });

    expect(RFQ.findOne).toHaveBeenCalledWith({ where: { id: 1, corporateUserId: 10 } });
    expect(result).toEqual(mockRfq);
  });

  it('should return null when RFQ not found', async () => {
    RFQ.findOne.mockResolvedValue(null);

    const result = await findRfqByCorporate({ rfqId: 99, corporateUserId: 10 });

    expect(result).toBeNull();
  });

  it('should throw when query rejects', async () => {
    RFQ.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findRfqByCorporate({ rfqId: 1, corporateUserId: 10 })).rejects.toThrow('DB error');
  });
});
