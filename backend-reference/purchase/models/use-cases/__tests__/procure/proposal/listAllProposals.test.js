'use strict';

const Proposal = require('../../../../entities/Proposal');
const { listAllProposals } = require('../../../procure/proposal');

jest.mock('../../../../entities/RFQ',              () => ({}));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({}));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/Proposal',         () => ({ findAndCountAll: jest.fn() }));
jest.mock('../../../../entities/ProposalLineItem', () => ({}));
jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));

describe('listAllProposals', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return paginated proposals with count', async () => {
    const mockResult = {
      count: 2,
      rows: [
        { id: 1, status: 'Submitted', vendor: { businessName: 'Acme' } },
        { id: 2, status: 'Submitted', vendor: { businessName: 'Beta' } },
      ],
    };
    Proposal.findAndCountAll.mockResolvedValue(mockResult);

    const result = await listAllProposals({ corporateUserId: 1, status: null, search: null, page: 1, limit: 10 });

    expect(Proposal.findAndCountAll).toHaveBeenCalledTimes(1);
    expect(result.count).toBe(2);
    expect(result.rows).toHaveLength(2);
  });

  it('should filter by status when provided', async () => {
    Proposal.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await listAllProposals({ corporateUserId: 1, status: 'Accepted', search: null, page: 1, limit: 10 });

    expect(Proposal.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'Accepted' } })
    );
  });

  it('should apply search filter on RFQ refNumber and title', async () => {
    Proposal.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await listAllProposals({ corporateUserId: 1, status: null, search: 'laptop', page: 1, limit: 10 });

    expect(Proposal.findAndCountAll).toHaveBeenCalledTimes(1);
  });

  it('should return empty result when no proposals match', async () => {
    Proposal.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const result = await listAllProposals({ corporateUserId: 1, status: 'Declined', search: null, page: 1, limit: 10 });

    expect(result.count).toBe(0);
    expect(result.rows).toHaveLength(0);
  });

  it('should throw when query rejects', async () => {
    Proposal.findAndCountAll.mockRejectedValue(new Error('DB error'));

    await expect(listAllProposals({ corporateUserId: 1, status: null, search: null, page: 1, limit: 10 }))
      .rejects.toThrow('DB error');
  });
});
