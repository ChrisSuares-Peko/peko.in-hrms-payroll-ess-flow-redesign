const { getEInvoiceDashboard } = require('../../eInvoices');
const eInvoice = require('../../../entities/eInvoices');
const eWaybill = require('../../../entities/eWaybill');

jest.mock('../../../entities/eInvoices');
jest.mock('../../../entities/eWaybill');

describe('getEInvoiceDashboard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return dashboard stats for a corporate user', async () => {
        eInvoice.count
            .mockResolvedValueOnce(10)   // totalCount
            .mockResolvedValueOnce(7)    // activeCount
            .mockResolvedValueOnce(3);   // cancelledLast30
        eInvoice.sum.mockResolvedValue('50000.00');
        eWaybill.count.mockResolvedValue(4);

        const result = await getEInvoiceDashboard(1);

        expect(result.totalCount).toBe(10);
        expect(result.activeCount).toBe(7);
        expect(result.activeTotalAmount).toBe(50000);
        expect(result.cancelledLast30).toBe(3);
        expect(result.eWaybillActiveCount).toBe(4);
    });

    it('should return 0 for activeTotalAmount when sum is null', async () => {
        eInvoice.count.mockResolvedValue(0);
        eInvoice.sum.mockResolvedValue(null);
        eWaybill.count.mockResolvedValue(0);

        const result = await getEInvoiceDashboard(1);

        expect(result.activeTotalAmount).toBe(0);
    });

    it('should throw if any DB call fails', async () => {
        eInvoice.count.mockRejectedValue(new Error('DB error'));

        await expect(getEInvoiceDashboard(1)).rejects.toThrow('DB error');
    });
});
