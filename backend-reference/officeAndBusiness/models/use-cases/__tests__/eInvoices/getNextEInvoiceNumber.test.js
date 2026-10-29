const { getNextEInvoiceNumber } = require('../../eInvoices');
const eInvoice = require('../../../entities/eInvoices');

jest.mock('../../../entities/eInvoices');

describe('getNextEInvoiceNumber', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return max docNo + 1 when records exist', async () => {
        eInvoice.findOne.mockResolvedValue({ maxNumber: '5' });

        const result = await getNextEInvoiceNumber(1);

        expect(result).toBe(6);
    });

    it('should return 1 when no records exist (maxNumber is null)', async () => {
        eInvoice.findOne.mockResolvedValue({ maxNumber: null });

        const result = await getNextEInvoiceNumber(1);

        expect(result).toBe(1);
    });

    it('should throw if findOne fails', async () => {
        eInvoice.findOne.mockRejectedValue(new Error('DB error'));

        await expect(getNextEInvoiceNumber(1)).rejects.toThrow('DB error');
    });
});
