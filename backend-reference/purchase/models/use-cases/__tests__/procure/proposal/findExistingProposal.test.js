'use strict';

const Proposal = require('../../../../entities/Proposal');
const { findExistingProposal } = require('../../../procure/proposal');

jest.mock('../../../../entities/RFQ',              () => ({}));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({}));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/Proposal',         () => ({ findOne: jest.fn() }));
jest.mock('../../../../entities/ProposalLineItem', () => ({}));
jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));

describe('findExistingProposal', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return proposal when found', async () => {
    const mockProposal = { id: 7, rfqId: 1, vendorId: 5, status: 'Submitted' };
    Proposal.findOne.mockResolvedValue(mockProposal);

    const result = await findExistingProposal({ rfqId: 1, vendorId: 5 });

    expect(Proposal.findOne).toHaveBeenCalledWith({ where: { rfqId: 1, vendorId: 5 } });
    expect(result).toEqual(mockProposal);
  });

  it('should return null when no existing proposal', async () => {
    Proposal.findOne.mockResolvedValue(null);

    const result = await findExistingProposal({ rfqId: 1, vendorId: 5 });

    expect(result).toBeNull();
  });

  it('should throw when query rejects', async () => {
    Proposal.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findExistingProposal({ rfqId: 1, vendorId: 5 })).rejects.toThrow('DB error');
  });
});
