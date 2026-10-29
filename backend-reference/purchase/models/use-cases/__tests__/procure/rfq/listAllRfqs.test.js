'use strict';

const RFQ = require('../../../../entities/RFQ');
const { listAllRfqs } = require('../../../procure/rfq');

jest.mock('../../../../entities/RFQ',              () => ({ findAll: jest.fn() }));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({}));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/PurchaseRequest',  () => ({}));
jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));

describe('listAllRfqs', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return all RFQs for a corporate user', async () => {
    const mockRfqs = [
      { id: 1, refNumber: 'RFQ-001', status: 'Draft' },
      { id: 2, refNumber: 'RFQ-002', status: 'Sent' },
    ];
    RFQ.findAll.mockResolvedValue(mockRfqs);

    const result = await listAllRfqs({ corporateUserId: 1, status: null, type: null, search: null });

    expect(RFQ.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { corporateUserId: 1 } })
    );
    expect(result).toEqual(mockRfqs);
  });

  it('should filter by status and type when provided', async () => {
    RFQ.findAll.mockResolvedValue([]);

    await listAllRfqs({ corporateUserId: 1, status: 'Sent', type: 'RFQ', search: null });

    expect(RFQ.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { corporateUserId: 1, status: 'Sent', type: 'RFQ' } })
    );
  });

  it('should apply search filter on refNumber and title', async () => {
    RFQ.findAll.mockResolvedValue([]);

    await listAllRfqs({ corporateUserId: 1, status: null, type: null, search: 'supplies' });

    expect(RFQ.findAll).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when no RFQs found', async () => {
    RFQ.findAll.mockResolvedValue([]);

    const result = await listAllRfqs({ corporateUserId: 1, status: null, type: null, search: null });

    expect(result).toEqual([]);
  });

  it('should throw when query rejects', async () => {
    RFQ.findAll.mockRejectedValue(new Error('DB error'));

    await expect(listAllRfqs({ corporateUserId: 1, status: null, type: null, search: null }))
      .rejects.toThrow('DB error');
  });
});
