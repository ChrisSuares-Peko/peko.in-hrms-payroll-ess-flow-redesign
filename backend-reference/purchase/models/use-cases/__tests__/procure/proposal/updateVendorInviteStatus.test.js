'use strict';

const RFQVendorInvite = require('../../../../entities/RFQVendorInvite');
const { updateVendorInviteStatus } = require('../../../procure/proposal');

jest.mock('../../../../entities/RFQ',              () => ({}));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({ update: jest.fn() }));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/Proposal',         () => ({}));
jest.mock('../../../../entities/ProposalLineItem', () => ({}));
jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));

describe('updateVendorInviteStatus', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should update invite status to Declined', async () => {
    RFQVendorInvite.update.mockResolvedValue([1]);

    const result = await updateVendorInviteStatus({ rfqId: 1, vendorId: 5, status: 'Declined' });

    expect(RFQVendorInvite.update).toHaveBeenCalledWith(
      { status: 'Declined' },
      { where: { rfqId: 1, vendorId: 5 } }
    );
    expect(result).toEqual([1]);
  });

  it('should update invite status to Submitted', async () => {
    RFQVendorInvite.update.mockResolvedValue([1]);

    await updateVendorInviteStatus({ rfqId: 1, vendorId: 5, status: 'Submitted' });

    expect(RFQVendorInvite.update).toHaveBeenCalledWith(
      { status: 'Submitted' },
      { where: { rfqId: 1, vendorId: 5 } }
    );
  });

  it('should return [0] when no invite matches', async () => {
    RFQVendorInvite.update.mockResolvedValue([0]);

    const result = await updateVendorInviteStatus({ rfqId: 99, vendorId: 5, status: 'Declined' });

    expect(result).toEqual([0]);
  });

  it('should throw when query rejects', async () => {
    RFQVendorInvite.update.mockRejectedValue(new Error('DB error'));

    await expect(updateVendorInviteStatus({ rfqId: 1, vendorId: 5, status: 'Declined' }))
      .rejects.toThrow('DB error');
  });
});
