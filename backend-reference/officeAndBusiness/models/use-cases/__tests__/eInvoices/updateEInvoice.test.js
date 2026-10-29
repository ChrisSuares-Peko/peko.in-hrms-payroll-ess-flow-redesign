const { updateEInvoice } = require('../../eInvoices');
const eInvoice = require('../../../entities/eInvoices');

jest.mock('../../../entities/eInvoices');

describe('updateEInvoice', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update and return result for given id', async () => {
        eInvoice.update.mockResolvedValue([1]);

        const result = await updateEInvoice(5, { status: 'CANCELLED' });

        expect(eInvoice.update).toHaveBeenCalledWith({ status: 'CANCELLED' }, { where: { id: 5 } });
        expect(result).toEqual([1]);
    });

    it('should return [0] if no record matched', async () => {
        eInvoice.update.mockResolvedValue([0]);

        const result = await updateEInvoice(999, { status: 'CANCELLED' });

        expect(result).toEqual([0]);
    });

    it('should throw if update fails', async () => {
        eInvoice.update.mockRejectedValue(new Error('DB error'));

        await expect(updateEInvoice(1, {})).rejects.toThrow('DB error');
    });
});
