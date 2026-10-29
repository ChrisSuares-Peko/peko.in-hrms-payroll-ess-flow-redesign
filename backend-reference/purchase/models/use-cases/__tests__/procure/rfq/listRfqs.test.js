'use strict';

const RFQ = require('../../../../entities/RFQ');
const { listRfqs } = require('../../../procure/rfq');

jest.mock('../../../../entities/RFQ',              () => ({ findAndCountAll: jest.fn() }));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({}));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/PurchaseRequest',  () => ({}));
jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));

describe('listRfqs', () => {
  const baseParams = {
    corporateUserId: 1, status: null, type: null, search: null,
    startDate: null, endDate: null,
    sortBy: 'createdAt', sortOrder: 'DESC',
    page: 1, limit: 20,
  };

  beforeEach(() => jest.clearAllMocks());

  it('should return paginated RFQs with count', async () => {
    const mockResult = { count: 3, rows: [{ id: 1 }, { id: 2 }, { id: 3 }] };
    RFQ.findAndCountAll.mockResolvedValue(mockResult);

    const result = await listRfqs(baseParams);

    expect(RFQ.findAndCountAll).toHaveBeenCalledTimes(1);
    expect(result.count).toBe(3);
    expect(result.rows).toHaveLength(3);
  });

  it('should filter by status and type', async () => {
    RFQ.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await listRfqs({ ...baseParams, status: 'Sent', type: 'RFQ' });

    expect(RFQ.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'Sent', type: 'RFQ' }),
      })
    );
  });

  it('should apply date filter for startDate and endDate', async () => {
    RFQ.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await listRfqs({ ...baseParams, startDate: '2026-01-01', endDate: '2026-03-31' });

    expect(RFQ.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ createdAt: expect.any(Object) }),
      })
    );
  });

  it('should use createdAt as fallback for invalid sortBy', async () => {
    RFQ.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await listRfqs({ ...baseParams, sortBy: 'invalid', sortOrder: 'ASC' });

    expect(RFQ.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ order: [['createdAt', 'ASC']] })
    );
  });

  it('should apply correct pagination offset', async () => {
    RFQ.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await listRfqs({ ...baseParams, page: 3, limit: 10 });

    expect(RFQ.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10, offset: 20 })
    );
  });

  it('should throw when query rejects', async () => {
    RFQ.findAndCountAll.mockRejectedValue(new Error('DB error'));

    await expect(listRfqs(baseParams)).rejects.toThrow('DB error');
  });
});
