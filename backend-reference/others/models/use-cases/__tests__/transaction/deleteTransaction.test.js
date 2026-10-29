const { deleteTransaction } = require('../../transaction');
const transaction = require('../../../entities/transaction');

jest.mock('../../../entities/transaction');

describe('deleteTransaction', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('should delete a transaction by tranId', async () => {
        transaction.destroy.mockResolvedValue(1);

        const result = await deleteTransaction({ tranId: 'TXN001' });
        expect(transaction.destroy).toHaveBeenCalledWith({ where: { tranId: 'TXN001' } });
        expect(result).toBe(1);
    });

    it('should return undefined on error', async () => {
        transaction.destroy.mockRejectedValue(new Error('DB error'));
        const result = await deleteTransaction({ tranId: 'TXN001' });
        expect(result).toBeUndefined();
    });
});
