'use strict';

const PurchaseRequest = require('../../../../entities/PurchaseRequest');
const { listAllPRs } = require('../../../procure/purchaseRequest');

jest.mock('../../../../entities/PurchaseRequest', () => ({ findAll: jest.fn() }));
jest.mock('../../../../entities/ProcureEmployee', () => ({}));

describe('listAllPRs', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return all PRs for a corporate user', async () => {
    const mockPRs = [
      { id: 1, refNumber: 'PR-001', status: 'Draft' },
      { id: 2, refNumber: 'PR-002', status: 'Submitted' },
    ];
    PurchaseRequest.findAll.mockResolvedValue(mockPRs);

    const result = await listAllPRs({ corporateUserId: 1, status: null });

    expect(PurchaseRequest.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { corporateUserId: 1 } })
    );
    expect(result).toEqual(mockPRs);
  });

  it('should filter by status when provided', async () => {
    PurchaseRequest.findAll.mockResolvedValue([]);

    await listAllPRs({ corporateUserId: 1, status: 'Approved' });

    expect(PurchaseRequest.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { corporateUserId: 1, status: 'Approved' } })
    );
  });

  it('should return empty array when no PRs exist', async () => {
    PurchaseRequest.findAll.mockResolvedValue([]);

    const result = await listAllPRs({ corporateUserId: 1, status: null });

    expect(result).toEqual([]);
  });

  it('should throw when query rejects', async () => {
    PurchaseRequest.findAll.mockRejectedValue(new Error('DB error'));

    await expect(listAllPRs({ corporateUserId: 1, status: null })).rejects.toThrow('DB error');
  });
});
