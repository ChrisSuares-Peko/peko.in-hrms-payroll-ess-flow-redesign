const { updateTransaction } = require('../../transaction');
const transaction = require('../../../entities/transaction');

jest.mock('../../../entities/transaction');

describe('updateTransaction', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('should update a transaction by tranId', async () => {
        const mockParams = { tranId: 'TXN001' };
        transaction.update.mockResolvedValue([1]);

        const result = await updateTransaction(mockParams);
        expect(transaction.update).toHaveBeenCalledWith({ where: { tranId: 'TXN001' } });
        expect(result).toEqual([1]);
    });

    it('should return undefined on error', async () => {
        transaction.update.mockRejectedValue(new Error('DB error'));
        const result = await updateTransaction({ tranId: 'TXN001' });
        expect(result).toBeUndefined();
    });
});
