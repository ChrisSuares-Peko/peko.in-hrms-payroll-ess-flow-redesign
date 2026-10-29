'use strict';

const RFQVendorInvite = require('../../../../entities/RFQVendorInvite');
const { findInvitesWithVendors } = require('../../../procure/rfq');

jest.mock('../../../../entities/RFQ',              () => ({}));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({ findAll: jest.fn() }));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/PurchaseRequest',  () => ({}));
jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));

describe('findInvitesWithVendors', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return all invites with vendor details for an RFQ', async () => {
    const mockInvites = [
      { id: 1, vendorId: 5, vendor: { businessName: 'Acme', email: 'acme@test.com' } },
      { id: 2, vendorId: 6, vendor: { businessName: 'Beta', email: 'beta@test.com' } },
    ];
    RFQVendorInvite.findAll.mockResolvedValue(mockInvites);

    const result = await findInvitesWithVendors({ rfqId: 1 });

    expect(RFQVendorInvite.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { rfqId: 1 } })
    );
    expect(result).toEqual(mockInvites);
  });

  it('should return empty array when no invites found', async () => {
    RFQVendorInvite.findAll.mockResolvedValue([]);

    const result = await findInvitesWithVendors({ rfqId: 99 });

    expect(result).toEqual([]);
  });

  it('should throw when query rejects', async () => {
    RFQVendorInvite.findAll.mockRejectedValue(new Error('DB error'));

    await expect(findInvitesWithVendors({ rfqId: 1 })).rejects.toThrow('DB error');
  });
});
