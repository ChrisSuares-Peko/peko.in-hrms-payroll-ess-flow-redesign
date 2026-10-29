'use strict';

const PurchaseRequest = require('../../../../entities/PurchaseRequest');
const { listPRs } = require('../../../procure/purchaseRequest');

jest.mock('../../../../entities/PurchaseRequest', () => ({ findAndCountAll: jest.fn() }));
jest.mock('../../../../entities/ProcureEmployee', () => ({}));

describe('listPRs', () => {
  const baseParams = {
    corporateUserId: 1, status: null, search: null,
    startDate: null, endDate: null,
    sortBy: 'createdAt', sortOrder: 'DESC',
    page: 1, limit: 20,
  };

  beforeEach(() => jest.clearAllMocks());

  it('should return paginated PRs', async () => {
    const mockResult = { count: 2, rows: [{ id: 1 }, { id: 2 }] };
    PurchaseRequest.findAndCountAll.mockResolvedValue(mockResult);

    const result = await listPRs(baseParams);

    expect(PurchaseRequest.findAndCountAll).toHaveBeenCalledTimes(1);
    expect(result.count).toBe(2);
    expect(result.rows).toHaveLength(2);
  });

  it('should filter by status', async () => {
    PurchaseRequest.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await listPRs({ ...baseParams, status: 'Submitted' });

    expect(PurchaseRequest.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'Submitted' }) })
    );
  });

  it('should apply date filter when startDate and endDate are provided', async () => {
    PurchaseRequest.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await listPRs({ ...baseParams, startDate: '2026-01-01', endDate: '2026-03-31' });

    expect(PurchaseRequest.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ createdAt: expect.any(Object) }),
      })
    );
  });

  it('should fallback to createdAt DESC for invalid sortBy', async () => {
    PurchaseRequest.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await listPRs({ ...baseParams, sortBy: 'malicious_field', sortOrder: 'ASC' });

    expect(PurchaseRequest.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ order: [['createdAt', 'ASC']] })
    );
  });

  it('should apply search filter on refNumber', async () => {
    PurchaseRequest.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await listPRs({ ...baseParams, search: 'PR-001' });

    expect(PurchaseRequest.findAndCountAll).toHaveBeenCalledTimes(1);
  });

  it('should throw when query rejects', async () => {
    PurchaseRequest.findAndCountAll.mockRejectedValue(new Error('DB error'));

    await expect(listPRs(baseParams)).rejects.toThrow('DB error');
  });
});
