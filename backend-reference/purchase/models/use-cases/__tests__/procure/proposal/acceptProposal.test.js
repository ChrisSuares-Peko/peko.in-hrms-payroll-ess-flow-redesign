'use strict';

const sequelize = require('../../../../../configs/database/index');
const Proposal  = require('../../../../entities/Proposal');
const { acceptProposal } = require('../../../procure/proposal');

jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));
jest.mock('../../../../entities/RFQ',              () => ({}));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({}));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/Proposal',         () => ({ update: jest.fn() }));
jest.mock('../../../../entities/ProposalLineItem', () => ({}));

describe('acceptProposal', () => {
  const mockProposal = { update: jest.fn().mockResolvedValue({}) };
  const mockRfq      = { id: 1, update: jest.fn().mockResolvedValue({}) };

  beforeEach(() => {
    jest.clearAllMocks();
    sequelize.transaction.mockImplementation((fn) => fn({}));
    Proposal.update.mockResolvedValue([1]);
    mockProposal.update.mockResolvedValue({});
    mockRfq.update.mockResolvedValue({});
  });

  it('should accept proposal, award RFQ, and decline other proposals', async () => {
    await acceptProposal({ proposal: mockProposal, rfq: mockRfq });

    expect(mockProposal.update).toHaveBeenCalledWith({ status: 'Accepted' }, expect.anything());
    expect(mockRfq.update).toHaveBeenCalledWith(
      { status: 'Awarded', awardedAt: expect.any(Date) },
      expect.anything()
    );
    expect(Proposal.update).toHaveBeenCalledWith(
      { status: 'Declined' },
      expect.objectContaining({ where: { rfqId: mockRfq.id, status: 'Submitted' } })
    );
  });

  it('should throw when transaction fails', async () => {
    sequelize.transaction.mockRejectedValue(new Error('Transaction error'));

    await expect(acceptProposal({ proposal: mockProposal, rfq: mockRfq }))
      .rejects.toThrow('Transaction error');
  });

  it('should run all three updates within the same transaction', async () => {
    await acceptProposal({ proposal: mockProposal, rfq: mockRfq });

    expect(sequelize.transaction).toHaveBeenCalledTimes(1);
    expect(mockProposal.update).toHaveBeenCalledTimes(1);
    expect(mockRfq.update).toHaveBeenCalledTimes(1);
    expect(Proposal.update).toHaveBeenCalledTimes(1);
  });
});
