'use strict';

const RFQVendorInvite = require('../../../../entities/RFQVendorInvite');
const { findVendorInvite } = require('../../../procure/proposal');

jest.mock('../../../../entities/RFQ',              () => ({}));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({ findOne: jest.fn() }));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/Proposal',         () => ({}));
jest.mock('../../../../entities/ProposalLineItem', () => ({}));
jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));

describe('findVendorInvite', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return invite when found', async () => {
    const mockInvite = { id: 3, rfqId: 1, vendorId: 5, status: 'Invited' };
    RFQVendorInvite.findOne.mockResolvedValue(mockInvite);

    const result = await findVendorInvite({ rfqId: 1, vendorId: 5 });

    expect(RFQVendorInvite.findOne).toHaveBeenCalledWith({ where: { rfqId: 1, vendorId: 5 } });
    expect(result).toEqual(mockInvite);
  });

  it('should return null when invite not found', async () => {
    RFQVendorInvite.findOne.mockResolvedValue(null);

    const result = await findVendorInvite({ rfqId: 1, vendorId: 99 });

    expect(result).toBeNull();
  });

  it('should throw when query rejects', async () => {
    RFQVendorInvite.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findVendorInvite({ rfqId: 1, vendorId: 5 })).rejects.toThrow('DB error');
  });
});
