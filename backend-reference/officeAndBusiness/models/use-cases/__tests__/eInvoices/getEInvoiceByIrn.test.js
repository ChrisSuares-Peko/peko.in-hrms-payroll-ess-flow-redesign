const { getEInvoiceByIrn } = require('../../eInvoices');
const eInvoice = require('../../../entities/eInvoices');

jest.mock('../../../entities/eInvoices');

describe('getEInvoiceByIrn', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the e-invoice matching the given IRN', async () => {
        const mockRecord = { id: 1, irn: 'irn-abc-123', status: 'ACTIVE' };

        eInvoice.findOne.mockResolvedValue(mockRecord);

        const result = await getEInvoiceByIrn('irn-abc-123');

        expect(eInvoice.findOne).toHaveBeenCalledWith({ where: { irn: 'irn-abc-123' } });
        expect(result).toEqual(mockRecord);
    });

    it('should return null if no record found', async () => {
        eInvoice.findOne.mockResolvedValue(null);

        const result = await getEInvoiceByIrn('irn-not-found');

        expect(result).toBeNull();
    });

    it('should throw if findOne fails', async () => {
        eInvoice.findOne.mockRejectedValue(new Error('DB error'));

        await expect(getEInvoiceByIrn('irn-abc-123')).rejects.toThrow('DB error');
    });
});
