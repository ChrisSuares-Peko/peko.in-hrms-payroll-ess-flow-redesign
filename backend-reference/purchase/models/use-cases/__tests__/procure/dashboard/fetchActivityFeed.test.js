'use strict';

const Proposal        = require('../../../../entities/Proposal');
const RFQ             = require('../../../../entities/RFQ');
const PurchaseRequest = require('../../../../entities/PurchaseRequest');
const PurchaseOrder   = require('../../../../entities/PurchaseOrder');
const ProcureInvoice  = require('../../../../entities/ProcureInvoice');
const { fetchActivityFeed } = require('../../../procure/dashboard');

jest.mock('../../../../entities/Proposal',        () => ({ findAll: jest.fn() }));
jest.mock('../../../../entities/RFQ',             () => ({ findAll: jest.fn() }));
jest.mock('../../../../entities/PurchaseRequest', () => ({ findAll: jest.fn() }));
jest.mock('../../../../entities/PurchaseOrder',   () => ({ findAll: jest.fn() }));
jest.mock('../../../../entities/ProcureInvoice',  () => ({ findAll: jest.fn() }));
jest.mock('../../../../entities/ProcureVendor',   () => ({}));
jest.mock('../../../../entities/RFQVendorInvite', () => ({}));

describe('fetchActivityFeed', () => {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  beforeEach(() => jest.clearAllMocks());

  it('should return results from all 5 activity queries', async () => {
    Proposal.findAll.mockResolvedValue([{ id: 1 }]);
    RFQ.findAll.mockResolvedValue([{ id: 2 }]);
    PurchaseRequest.findAll.mockResolvedValue([{ id: 3 }]);
    PurchaseOrder.findAll.mockResolvedValue([{ id: 4 }]);
    ProcureInvoice.findAll.mockResolvedValue([{ id: 5 }]);

    const result = await fetchActivityFeed({ corporateUserId: 1, since, activityLimit: 10 });

    expect(result).toHaveLength(5);
    expect(result[0]).toEqual([{ id: 1 }]);
    expect(result[1]).toEqual([{ id: 2 }]);
    expect(result[2]).toEqual([{ id: 3 }]);
    expect(result[3]).toEqual([{ id: 4 }]);
    expect(result[4]).toEqual([{ id: 5 }]);
  });

  it('should return empty array for a failing inner query (each has .catch)', async () => {
    Proposal.findAll.mockRejectedValue(new Error('Proposals DB error'));
    RFQ.findAll.mockResolvedValue([]);
    PurchaseRequest.findAll.mockResolvedValue([]);
    PurchaseOrder.findAll.mockResolvedValue([]);
    ProcureInvoice.findAll.mockResolvedValue([]);

    const result = await fetchActivityFeed({ corporateUserId: 1, since, activityLimit: 10 });

    expect(result[0]).toEqual([]);
  });

  it('should return empty arrays when no recent activity exists', async () => {
    Proposal.findAll.mockResolvedValue([]);
    RFQ.findAll.mockResolvedValue([]);
    PurchaseRequest.findAll.mockResolvedValue([]);
    PurchaseOrder.findAll.mockResolvedValue([]);
    ProcureInvoice.findAll.mockResolvedValue([]);

    const result = await fetchActivityFeed({ corporateUserId: 1, since, activityLimit: 10 });

    expect(result.every((r) => r.length === 0)).toBe(true);
  });

  it('should call all 5 queries exactly once', async () => {
    Proposal.findAll.mockResolvedValue([]);
    RFQ.findAll.mockResolvedValue([]);
    PurchaseRequest.findAll.mockResolvedValue([]);
    PurchaseOrder.findAll.mockResolvedValue([]);
    ProcureInvoice.findAll.mockResolvedValue([]);

    await fetchActivityFeed({ corporateUserId: 42, since, activityLimit: 5 });

    expect(Proposal.findAll).toHaveBeenCalledTimes(1);
    expect(RFQ.findAll).toHaveBeenCalledTimes(1);
    expect(PurchaseRequest.findAll).toHaveBeenCalledTimes(1);
    expect(PurchaseOrder.findAll).toHaveBeenCalledTimes(1);
    expect(ProcureInvoice.findAll).toHaveBeenCalledTimes(1);
  });
});
