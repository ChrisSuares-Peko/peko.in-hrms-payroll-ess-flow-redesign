'use strict';

const sequelize       = require('../../../../../configs/database/index');
const RFQ             = require('../../../../entities/RFQ');
const RFQLineItem     = require('../../../../entities/RFQLineItem');
const RFQVendorInvite = require('../../../../entities/RFQVendorInvite');
const { createRfqTransaction } = require('../../../procure/rfq');

jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));
jest.mock('../../../../entities/RFQ',              () => ({ create: jest.fn() }));
jest.mock('../../../../entities/RFQLineItem',      () => ({ bulkCreate: jest.fn() }));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({ bulkCreate: jest.fn() }));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/PurchaseRequest',  () => ({}));

describe('createRfqTransaction', () => {
  const mockRfq = { id: 'rfq-1', update: jest.fn() };

  const baseParams = {
    corporateUserId: 1, refNumber: 'RFQ-001', title: 'Office Supplies',
    type: 'RFQ', submissionDeadline: '2026-05-01', termsAndConditions: null,
    buyerNotes: null, attachments: [], purchaseRequestId: null,
    send: false, now: new Date(), lineItems: [
      { description: 'Laptop', qty: 2, unit: 'pcs', estUnitCost: 1000, sortOrder: 0 },
    ],
    invitedVendors: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sequelize.transaction.mockImplementation((fn) => fn({}));
    RFQ.create.mockResolvedValue(mockRfq);
    RFQLineItem.bulkCreate.mockResolvedValue([{ total: 2000 }]);
    mockRfq.update.mockResolvedValue(mockRfq);
    RFQVendorInvite.bulkCreate.mockResolvedValue([]);
  });

  it('should create RFQ, line items, and update estimated total', async () => {
    const result = await createRfqTransaction(baseParams);

    expect(RFQ.create).toHaveBeenCalledTimes(1);
    expect(RFQLineItem.bulkCreate).toHaveBeenCalledTimes(1);
    expect(mockRfq.update).toHaveBeenCalledWith(
      { estimatedTotal: expect.any(Number) },
      expect.anything()
    );
    expect(result).toEqual(mockRfq);
  });

  it('should create vendor invites when invitedVendors is not empty and send=true', async () => {
    const params = {
      ...baseParams, send: true, invitedVendors: [5, 6],
    };

    await createRfqTransaction(params);

    expect(RFQVendorInvite.bulkCreate).toHaveBeenCalledTimes(1);
    const inviteArgs = RFQVendorInvite.bulkCreate.mock.calls[0][0];
    expect(inviteArgs[0]).toMatchObject({ rfqId: mockRfq.id, vendorId: 5, status: 'Invited' });
    expect(inviteArgs[0].vendorToken).toBeTruthy();
  });

  it('should not create invites when invitedVendors is empty', async () => {
    await createRfqTransaction({ ...baseParams, invitedVendors: [] });

    expect(RFQVendorInvite.bulkCreate).not.toHaveBeenCalled();
  });

  it('should create invites without token when send=false', async () => {
    await createRfqTransaction({ ...baseParams, invitedVendors: [5], send: false });

    const inviteArgs = RFQVendorInvite.bulkCreate.mock.calls[0][0];
    expect(inviteArgs[0].vendorToken).toBeNull();
    expect(inviteArgs[0].invitedAt).toBeNull();
  });

  it('should throw when transaction fails', async () => {
    sequelize.transaction.mockRejectedValue(new Error('Transaction error'));

    await expect(createRfqTransaction(baseParams)).rejects.toThrow('Transaction error');
  });
});
