'use strict';

const RFQVendorInvite = require('../../../../entities/RFQVendorInvite');
const { findInviteWithVendor } = require('../../../procure/rfq');

jest.mock('../../../../entities/RFQ',              () => ({}));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({ findOne: jest.fn() }));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/PurchaseRequest',  () => ({}));
jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));

describe('findInviteWithVendor', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return invite with vendor details when found', async () => {
    const mockInvite = {
      id: 10, rfqId: 1, vendorId: 5,
      vendor: { id: 5, businessName: 'Acme', email: 'acme@test.com' },
    };
    RFQVendorInvite.findOne.mockResolvedValue(mockInvite);

    const result = await findInviteWithVendor({ inviteId: 10 });

    expect(RFQVendorInvite.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 10 } })
    );
    expect(result).toEqual(mockInvite);
  });

  it('should return null when invite not found', async () => {
    RFQVendorInvite.findOne.mockResolvedValue(null);

    const result = await findInviteWithVendor({ inviteId: 99 });

    expect(result).toBeNull();
  });

  it('should throw when query rejects', async () => {
    RFQVendorInvite.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findInviteWithVendor({ inviteId: 10 })).rejects.toThrow('DB error');
  });
});
