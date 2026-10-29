'use strict';

const RFQVendorInvite = require('../../../../entities/RFQVendorInvite');
const { findPendingInvites } = require('../../../procure/rfq');

jest.mock('../../../../entities/RFQ',              () => ({}));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({ findAll: jest.fn() }));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/PurchaseRequest',  () => ({}));
jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));

describe('findPendingInvites', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return invites with status Invited', async () => {
    const mockInvites = [
      { id: 1, status: 'Invited', vendor: { email: 'vendor@test.com' } },
    ];
    RFQVendorInvite.findAll.mockResolvedValue(mockInvites);

    const result = await findPendingInvites({ rfqId: 1 });

    expect(RFQVendorInvite.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { rfqId: 1, status: 'Invited' } })
    );
    expect(result).toEqual(mockInvites);
  });

  it('should return empty array when all vendors have submitted', async () => {
    RFQVendorInvite.findAll.mockResolvedValue([]);

    const result = await findPendingInvites({ rfqId: 1 });

    expect(result).toEqual([]);
  });

  it('should throw when query rejects', async () => {
    RFQVendorInvite.findAll.mockRejectedValue(new Error('DB error'));

    await expect(findPendingInvites({ rfqId: 1 })).rejects.toThrow('DB error');
  });
});
