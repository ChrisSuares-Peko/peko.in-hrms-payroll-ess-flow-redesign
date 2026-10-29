'use strict';

const Proposal = require('../../../../entities/Proposal');
const { findProposalById } = require('../../../procure/proposal');

jest.mock('../../../../entities/RFQ',              () => ({}));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({}));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/Proposal',         () => ({ findOne: jest.fn() }));
jest.mock('../../../../entities/ProposalLineItem', () => ({}));
jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));

describe('findProposalById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return proposal with includes when found', async () => {
    const mockProposal = { id: 7, rfqId: 1, lineItems: [], vendor: { id: 5 } };
    Proposal.findOne.mockResolvedValue(mockProposal);

    const result = await findProposalById({ proposalId: 7, rfqId: 1 });

    expect(Proposal.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 7, rfqId: 1 } })
    );
    expect(result).toEqual(mockProposal);
  });

  it('should return null when proposal not found', async () => {
    Proposal.findOne.mockResolvedValue(null);

    const result = await findProposalById({ proposalId: 99, rfqId: 1 });

    expect(result).toBeNull();
  });

  it('should throw when query rejects', async () => {
    Proposal.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findProposalById({ proposalId: 7, rfqId: 1 })).rejects.toThrow('DB error');
  });
});
