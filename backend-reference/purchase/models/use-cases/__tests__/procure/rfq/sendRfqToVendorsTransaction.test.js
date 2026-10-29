'use strict';

const sequelize = require('../../../../../configs/database/index');
const { sendRfqToVendorsTransaction } = require('../../../procure/rfq');

jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));
jest.mock('../../../../entities/RFQ',              () => ({}));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({}));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/PurchaseRequest',  () => ({}));

describe('sendRfqToVendorsTransaction', () => {
  const mockInvite1 = { update: jest.fn().mockResolvedValue({}) };
  const mockInvite2 = { update: jest.fn().mockResolvedValue({}) };
  const mockRfq     = { update: jest.fn().mockResolvedValue({}), vendorInvites: [mockInvite1, mockInvite2] };
  const now         = new Date('2026-04-27T10:00:00Z');
  const tokenExpiry = new Date('2026-05-01T23:59:59Z');

  beforeEach(() => {
    jest.clearAllMocks();
    sequelize.transaction.mockImplementation((fn) => fn({}));
    mockRfq.update.mockResolvedValue({});
    mockInvite1.update.mockResolvedValue({});
    mockInvite2.update.mockResolvedValue({});
  });

  it('should update RFQ status to Sent and all vendor invites', async () => {
    await sendRfqToVendorsTransaction({ rfq: mockRfq, now, tokenExpiry });

    expect(mockRfq.update).toHaveBeenCalledWith(
      { status: 'Sent', sentAt: now },
      expect.anything()
    );
    expect(mockInvite1.update).toHaveBeenCalledTimes(1);
    expect(mockInvite2.update).toHaveBeenCalledTimes(1);
  });

  it('should set vendorToken and tokenExpiresAt on each invite', async () => {
    await sendRfqToVendorsTransaction({ rfq: mockRfq, now, tokenExpiry });

    const invite1Args = mockInvite1.update.mock.calls[0][0];
    expect(invite1Args.status).toBe('Invited');
    expect(invite1Args.invitedAt).toBe(now);
    expect(invite1Args.vendorToken).toBeTruthy();
    expect(invite1Args.tokenExpiresAt).toBe(tokenExpiry);
  });

  it('should update all invites in a single transaction', async () => {
    await sendRfqToVendorsTransaction({ rfq: mockRfq, now, tokenExpiry });

    expect(sequelize.transaction).toHaveBeenCalledTimes(1);
  });

  it('should throw when transaction fails', async () => {
    sequelize.transaction.mockRejectedValue(new Error('Transaction error'));

    await expect(sendRfqToVendorsTransaction({ rfq: mockRfq, now, tokenExpiry }))
      .rejects.toThrow('Transaction error');
  });
});
