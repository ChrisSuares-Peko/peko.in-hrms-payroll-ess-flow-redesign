'use strict';

const Proposal = require('../../../../entities/Proposal');
const { findProposalWithIncludes } = require('../../../procure/proposal');

jest.mock('../../../../entities/RFQ',              () => ({}));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({}));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/Proposal',         () => ({ findOne: jest.fn() }));
jest.mock('../../../../entities/ProposalLineItem', () => ({}));
jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));

describe('findProposalWithIncludes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return proposal with line items and vendor when found', async () => {
    const mockProposal = { id: 7, lineItems: [{ id: 1 }], vendor: { id: 5, businessName: 'Acme' } };
    Proposal.findOne.mockResolvedValue(mockProposal);

    const result = await findProposalWithIncludes({ proposalId: 7 });

    expect(Proposal.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 7 } })
    );
    expect(result).toEqual(mockProposal);
  });

  it('should return null when proposal not found', async () => {
    Proposal.findOne.mockResolvedValue(null);

    const result = await findProposalWithIncludes({ proposalId: 99 });

    expect(result).toBeNull();
  });

  it('should throw when query rejects', async () => {
    Proposal.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findProposalWithIncludes({ proposalId: 7 })).rejects.toThrow('DB error');
  });
});
