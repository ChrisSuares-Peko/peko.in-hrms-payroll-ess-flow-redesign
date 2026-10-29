'use strict';

const RFQVendorInvite = require('../../../../entities/RFQVendorInvite');
const { findExistingInvite } = require('../../../procure/rfq');

jest.mock('../../../../entities/RFQ',              () => ({}));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({ findOne: jest.fn() }));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/PurchaseRequest',  () => ({}));
jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));

describe('findExistingInvite', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return invite when found', async () => {
    const mockInvite = { id: 3, rfqId: 1, vendorId: 5 };
    RFQVendorInvite.findOne.mockResolvedValue(mockInvite);

    const result = await findExistingInvite({ rfqId: 1, vendorId: 5 });

    expect(RFQVendorInvite.findOne).toHaveBeenCalledWith({ where: { rfqId: 1, vendorId: 5 } });
    expect(result).toEqual(mockInvite);
  });

  it('should return null when invite does not exist', async () => {
    RFQVendorInvite.findOne.mockResolvedValue(null);

    const result = await findExistingInvite({ rfqId: 1, vendorId: 99 });

    expect(result).toBeNull();
  });

  it('should throw when query rejects', async () => {
    RFQVendorInvite.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findExistingInvite({ rfqId: 1, vendorId: 5 })).rejects.toThrow('DB error');
  });
});
