'use strict';

const PurchaseOrder  = require('../../../../entities/PurchaseOrder');
const RFQ            = require('../../../../entities/RFQ');
const ProcureInvoice = require('../../../../entities/ProcureInvoice');
const { fetchKpiStats } = require('../../../procure/dashboard');

jest.mock('../../../../entities/PurchaseOrder',   () => ({ count: jest.fn(), findOne: jest.fn() }));
jest.mock('../../../../entities/RFQ',             () => ({ count: jest.fn() }));
jest.mock('../../../../entities/ProcureInvoice',  () => ({ findOne: jest.fn() }));
jest.mock('../../../../entities/RFQVendorInvite', () => ({}));
jest.mock('../../../../entities/ProcureVendor',   () => ({}));
jest.mock('../../../../entities/PurchaseRequest', () => ({}));
jest.mock('../../../../entities/Proposal',        () => ({}));

describe('fetchKpiStats', () => {
  const lastMonth = { start: new Date('2026-03-01'), end: new Date('2026-03-31') };

  beforeEach(() => jest.clearAllMocks());

  it('should return all 7 KPI query results', async () => {
    PurchaseOrder.count.mockResolvedValueOnce(5).mockResolvedValueOnce(3);
    RFQ.count.mockResolvedValueOnce(8).mockResolvedValueOnce(6);
    PurchaseOrder.findOne
      .mockResolvedValueOnce({ total: '150000' })
      .mockResolvedValueOnce({ total: '80000' });
    ProcureInvoice.findOne.mockResolvedValue({ count: '4', amount: '25000' });

    const result = await fetchKpiStats({ corporateUserId: 1, lastMonth });

    expect(result).toHaveLength(7);
    expect(result[0]).toBe(5);
    expect(result[1]).toBe(3);
    expect(result[2]).toBe(8);
    expect(result[3]).toBe(6);
    expect(result[4]).toEqual({ total: '150000' });
    expect(result[5]).toEqual({ total: '80000' });
    expect(result[6]).toEqual({ count: '4', amount: '25000' });
  });

  it('should call PurchaseOrder.count twice, RFQ.count twice, PurchaseOrder.findOne twice, ProcureInvoice.findOne once', async () => {
    PurchaseOrder.count.mockResolvedValue(0);
    RFQ.count.mockResolvedValue(0);
    PurchaseOrder.findOne.mockResolvedValue(null);
    ProcureInvoice.findOne.mockResolvedValue(null);

    await fetchKpiStats({ corporateUserId: 99, lastMonth });

    expect(PurchaseOrder.count).toHaveBeenCalledTimes(2);
    expect(RFQ.count).toHaveBeenCalledTimes(2);
    expect(PurchaseOrder.findOne).toHaveBeenCalledTimes(2);
    expect(ProcureInvoice.findOne).toHaveBeenCalledTimes(1);
  });

  it('should return nulls when no data exists', async () => {
    PurchaseOrder.count.mockResolvedValue(0);
    RFQ.count.mockResolvedValue(0);
    PurchaseOrder.findOne.mockResolvedValue(null);
    ProcureInvoice.findOne.mockResolvedValue(null);

    const result = await fetchKpiStats({ corporateUserId: 1, lastMonth });

    expect(result[4]).toBeNull();
    expect(result[5]).toBeNull();
    expect(result[6]).toBeNull();
  });

  it('should throw when a query rejects', async () => {
    PurchaseOrder.count.mockRejectedValue(new Error('DB error'));
    RFQ.count.mockResolvedValue(0);
    PurchaseOrder.findOne.mockResolvedValue(null);
    ProcureInvoice.findOne.mockResolvedValue(null);

    await expect(fetchKpiStats({ corporateUserId: 1, lastMonth })).rejects.toThrow('DB error');
  });
});
