const { getEInvoiceById } = require('../../eInvoices');
const eInvoice = require('../../../entities/eInvoices');

jest.mock('../../../entities/eInvoices');

describe('getEInvoiceById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the e-invoice matching the given id', async () => {
        const mockRecord = { id: 5, irn: 'irn-abc-123', status: 'ACTIVE' };

        eInvoice.findOne.mockResolvedValue(mockRecord);

        const result = await getEInvoiceById(5);

        expect(eInvoice.findOne).toHaveBeenCalledWith({ where: { id: 5 } });
        expect(result).toEqual(mockRecord);
    });

    it('should return null if no record found', async () => {
        eInvoice.findOne.mockResolvedValue(null);

        const result = await getEInvoiceById(999);

        expect(result).toBeNull();
    });

    it('should throw if findOne fails', async () => {
        eInvoice.findOne.mockRejectedValue(new Error('DB error'));

        await expect(getEInvoiceById(1)).rejects.toThrow('DB error');
    });
});
