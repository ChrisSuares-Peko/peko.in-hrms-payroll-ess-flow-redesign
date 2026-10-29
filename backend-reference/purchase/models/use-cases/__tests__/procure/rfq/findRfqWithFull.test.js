'use strict';

const RFQ = require('../../../../entities/RFQ');
const { findRfqWithFull } = require('../../../procure/rfq');

jest.mock('../../../../entities/RFQ',              () => ({ findOne: jest.fn() }));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({}));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/PurchaseRequest',  () => ({}));
jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));

describe('findRfqWithFull', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return RFQ with lineItems and vendorInvites when found', async () => {
    const mockRfq = { id: 1, lineItems: [], vendorInvites: [{ id: 10, vendor: {} }] };
    RFQ.findOne.mockResolvedValue(mockRfq);

    const result = await findRfqWithFull({ id: 1 });

    expect(RFQ.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } })
    );
    expect(result).toEqual(mockRfq);
  });

  it('should return null when RFQ not found', async () => {
    RFQ.findOne.mockResolvedValue(null);

    const result = await findRfqWithFull({ id: 99 });

    expect(result).toBeNull();
  });

  it('should throw when query rejects', async () => {
    RFQ.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findRfqWithFull({ id: 1 })).rejects.toThrow('DB error');
  });
});
