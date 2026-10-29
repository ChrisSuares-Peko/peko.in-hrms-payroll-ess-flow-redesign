'use strict';

const RFQ = require('../../../../entities/RFQ');
const { listClosingSoonRfqs } = require('../../../procure/rfq');

jest.mock('../../../../entities/RFQ',              () => ({ findAll: jest.fn() }));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({}));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/PurchaseRequest',  () => ({}));
jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));

describe('listClosingSoonRfqs', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return Sent RFQs closing within 5 days', async () => {
    const mockRfqs = [
      { id: 1, status: 'Sent', submissionDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), vendorInvites: [] },
      { id: 2, status: 'Sent', submissionDeadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), vendorInvites: [] },
    ];
    RFQ.findAll.mockResolvedValue(mockRfqs);

    const result = await listClosingSoonRfqs({ corporateUserId: 1 });

    expect(RFQ.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockRfqs);
    expect(result).toHaveLength(2);
  });

  it('should return empty array when no RFQs are closing soon', async () => {
    RFQ.findAll.mockResolvedValue([]);

    const result = await listClosingSoonRfqs({ corporateUserId: 1 });

    expect(result).toEqual([]);
  });

  it('should query with status Sent and submissionDeadline between now and 5 days', async () => {
    RFQ.findAll.mockResolvedValue([]);

    await listClosingSoonRfqs({ corporateUserId: 10 });

    expect(RFQ.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ corporateUserId: 10, status: 'Sent' }),
      })
    );
  });

  it('should throw when query rejects', async () => {
    RFQ.findAll.mockRejectedValue(new Error('DB error'));

    await expect(listClosingSoonRfqs({ corporateUserId: 1 })).rejects.toThrow('DB error');
  });
});
