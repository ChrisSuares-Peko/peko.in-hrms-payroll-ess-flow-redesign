'use strict';

const Proposal = require('../../../../entities/Proposal');
const { findProposalsByRfq } = require('../../../procure/proposal');

jest.mock('../../../../entities/RFQ',              () => ({}));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({}));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/Proposal',         () => ({ findAll: jest.fn() }));
jest.mock('../../../../entities/ProposalLineItem', () => ({}));
jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));

describe('findProposalsByRfq', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return all proposals for an RFQ', async () => {
    const mockProposals = [
      { id: 1, rfqId: 5, vendor: { businessName: 'Vendor A' }, lineItems: [] },
      { id: 2, rfqId: 5, vendor: { businessName: 'Vendor B' }, lineItems: [] },
    ];
    Proposal.findAll.mockResolvedValue(mockProposals);

    const result = await findProposalsByRfq({ rfqId: 5 });

    expect(Proposal.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { rfqId: 5 } })
    );
    expect(result).toEqual(mockProposals);
    expect(result).toHaveLength(2);
  });

  it('should return empty array when no proposals exist', async () => {
    Proposal.findAll.mockResolvedValue([]);

    const result = await findProposalsByRfq({ rfqId: 5 });

    expect(result).toEqual([]);
  });

  it('should throw when query rejects', async () => {
    Proposal.findAll.mockRejectedValue(new Error('DB error'));

    await expect(findProposalsByRfq({ rfqId: 5 })).rejects.toThrow('DB error');
  });
});
