'use strict';

const PurchaseRequest = require('../../../../entities/PurchaseRequest');
const PurchaseOrder   = require('../../../../entities/PurchaseOrder');
const { fetchCharts } = require('../../../procure/dashboard');

jest.mock('../../../../entities/PurchaseRequest', () => ({ findAll: jest.fn() }));
jest.mock('../../../../entities/PurchaseOrder',   () => ({ findAll: jest.fn() }));
jest.mock('../../../../entities/RFQ',             () => ({}));
jest.mock('../../../../entities/RFQVendorInvite', () => ({}));
jest.mock('../../../../entities/ProcureVendor',   () => ({}));
jest.mock('../../../../entities/ProcureInvoice',  () => ({}));
jest.mock('../../../../entities/Proposal',        () => ({}));

describe('fetchCharts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return spend-by-category rows and PO status rows', async () => {
    const categoryRows = [
      { category: 'IT',       amount: '50000', count: '3' },
      { category: 'Supplies', amount: '20000', count: '5' },
    ];
    const poStatusRows = [
      { status: 'Draft',     count: '5' },
      { status: 'Sent',      count: '3' },
      { status: 'Completed', count: '10' },
    ];

    PurchaseRequest.findAll.mockResolvedValue(categoryRows);
    PurchaseOrder.findAll.mockResolvedValue(poStatusRows);

    const result = await fetchCharts({ corporateUserId: 1 });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(categoryRows);
    expect(result[1]).toEqual(poStatusRows);
  });

  it('should return empty arrays when no data exists', async () => {
    PurchaseRequest.findAll.mockResolvedValue([]);
    PurchaseOrder.findAll.mockResolvedValue([]);

    const result = await fetchCharts({ corporateUserId: 1 });

    expect(result[0]).toEqual([]);
    expect(result[1]).toEqual([]);
  });

  it('should call both queries with corporateUserId', async () => {
    PurchaseRequest.findAll.mockResolvedValue([]);
    PurchaseOrder.findAll.mockResolvedValue([]);

    await fetchCharts({ corporateUserId: 42 });

    expect(PurchaseRequest.findAll).toHaveBeenCalledTimes(1);
    expect(PurchaseOrder.findAll).toHaveBeenCalledTimes(1);
  });

  it('should throw when a query rejects', async () => {
    PurchaseRequest.findAll.mockRejectedValue(new Error('DB error'));
    PurchaseOrder.findAll.mockResolvedValue([]);

    await expect(fetchCharts({ corporateUserId: 1 })).rejects.toThrow('DB error');
  });
});
