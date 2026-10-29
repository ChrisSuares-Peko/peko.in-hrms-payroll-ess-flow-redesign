const { getOneTransaction } = require('../../transaction');
const transaction = require('../../../entities/transaction');

jest.mock('../../../entities/transaction');

describe('getOneTransaction', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('should return one transaction with order and service operator', async () => {
        const mockResult = { id: 1, corporateTxnId: 'TXN001' };
        transaction.findOne.mockResolvedValue(mockResult);

        const result = await getOneTransaction({ transactionId: 'TXN001' });
        expect(transaction.findOne).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });

    it('should return undefined on error', async () => {
        transaction.findOne.mockRejectedValue(new Error('DB error'));
        const result = await getOneTransaction({ transactionId: 'TXN001' });
        expect(result).toBeUndefined();
    });
});
