'use strict';

const RFQ = require('../../../../entities/RFQ');
const { fetchActiveRfqs } = require('../../../procure/dashboard');

jest.mock('../../../../entities/RFQ',             () => ({ findAll: jest.fn() }));
jest.mock('../../../../entities/RFQVendorInvite', () => ({}));
jest.mock('../../../../entities/ProcureVendor',   () => ({}));
jest.mock('../../../../entities/PurchaseRequest', () => ({}));
jest.mock('../../../../entities/PurchaseOrder',   () => ({}));
jest.mock('../../../../entities/ProcureInvoice',  () => ({}));
jest.mock('../../../../entities/Proposal',        () => ({}));

describe('fetchActiveRfqs', () => {
  const now              = new Date('2026-04-27T10:00:00Z');
  const closingSoonLimit = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  beforeEach(() => jest.clearAllMocks());

  it('should return RFQs closing within 5 days', async () => {
    const mockRows = [
      { id: 1, refNumber: 'RFQ-001', title: 'Office Supplies', vendorInvites: [{ id: 10, status: 'Invited' }] },
      { id: 2, refNumber: 'RFQ-002', title: 'IT Equipment',    vendorInvites: [] },
    ];
    RFQ.findAll.mockResolvedValue(mockRows);

    const result = await fetchActiveRfqs({ corporateUserId: 1, now, closingSoonLimit, rfqLimit: 5 });

    expect(RFQ.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockRows);
    expect(result).toHaveLength(2);
  });

  it('should return empty array when no RFQs are closing soon', async () => {
    RFQ.findAll.mockResolvedValue([]);

    const result = await fetchActiveRfqs({ corporateUserId: 1, now, closingSoonLimit, rfqLimit: 5 });

    expect(result).toEqual([]);
  });

  it('should respect rfqLimit', async () => {
    RFQ.findAll.mockResolvedValue([]);

    await fetchActiveRfqs({ corporateUserId: 1, now, closingSoonLimit, rfqLimit: 3 });

    expect(RFQ.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 3 })
    );
  });

  it('should throw when query rejects', async () => {
    RFQ.findAll.mockRejectedValue(new Error('DB error'));

    await expect(fetchActiveRfqs({ corporateUserId: 1, now, closingSoonLimit, rfqLimit: 5 }))
      .rejects.toThrow('DB error');
  });
});
