'use strict';

const sequelize        = require('../../../../../configs/database/index');
const Proposal         = require('../../../../entities/Proposal');
const ProposalLineItem = require('../../../../entities/ProposalLineItem');
const { createProposalWithItems } = require('../../../procure/proposal');

jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));
jest.mock('../../../../entities/RFQ',              () => ({}));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({}));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/Proposal',         () => ({ create: jest.fn() }));
jest.mock('../../../../entities/ProposalLineItem', () => ({ bulkCreate: jest.fn() }));

describe('createProposalWithItems', () => {
  const mockInvite   = { update: jest.fn().mockResolvedValue({}) };
  const mockProposal = { id: 10, update: jest.fn().mockResolvedValue({}) };

  beforeEach(() => {
    jest.clearAllMocks();
    sequelize.transaction.mockImplementation((fn) => fn({}));
    Proposal.create.mockResolvedValue(mockProposal);
    ProposalLineItem.bulkCreate.mockResolvedValue([]);
    mockProposal.update.mockResolvedValue(mockProposal);
    mockInvite.update.mockResolvedValue({});
  });

  it('should create proposal with Online line items and update invite', async () => {
    const params = {
      rfqId: 1, vendorId: 5, submissionMode: 'Online',
      totalAmount: null, validUntil: '2026-05-01',
      paymentTerms: 'Net 30', coverNote: 'See attached',
      pdfAttachment: null, invite: mockInvite,
      lineItems: [
        { rfqLineItemId: 1, description: 'Laptop', unitPrice: 1000, qty: 2, total: 2000 },
        { rfqLineItemId: 2, description: 'Mouse',  unitPrice: 50,   qty: 2, total: 100  },
      ],
    };

    const result = await createProposalWithItems(params);

    expect(Proposal.create).toHaveBeenCalledTimes(1);
    expect(ProposalLineItem.bulkCreate).toHaveBeenCalledTimes(1);
    expect(mockProposal.update).toHaveBeenCalledWith(
      { totalAmount: 2100 },
      expect.objectContaining({})
    );
    expect(mockInvite.update).toHaveBeenCalledWith({ status: 'Submitted' }, expect.anything());
    expect(result).toEqual(mockProposal);
  });

  it('should skip line item creation for non-Online submission mode', async () => {
    const params = {
      rfqId: 1, vendorId: 5, submissionMode: 'Email',
      totalAmount: 5000, validUntil: null,
      paymentTerms: null, coverNote: null,
      pdfAttachment: 'url/file.pdf', invite: mockInvite,
      lineItems: [],
    };

    await createProposalWithItems(params);

    expect(ProposalLineItem.bulkCreate).not.toHaveBeenCalled();
    expect(mockInvite.update).toHaveBeenCalledWith({ status: 'Submitted' }, expect.anything());
  });

  it('should not update totalAmount when it is already provided', async () => {
    const params = {
      rfqId: 1, vendorId: 5, submissionMode: 'Online',
      totalAmount: 9999, validUntil: null,
      paymentTerms: null, coverNote: null,
      pdfAttachment: null, invite: mockInvite,
      lineItems: [{ rfqLineItemId: 1, description: 'Item', unitPrice: 100, qty: 1, total: 100 }],
    };

    await createProposalWithItems(params);

    expect(mockProposal.update).not.toHaveBeenCalled();
  });

  it('should throw when transaction fails', async () => {
    sequelize.transaction.mockRejectedValue(new Error('Transaction error'));

    await expect(createProposalWithItems({
      rfqId: 1, vendorId: 5, submissionMode: 'Online',
      invite: mockInvite, lineItems: [],
    })).rejects.toThrow('Transaction error');
  });
});
