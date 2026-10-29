const { corporateAllTransactions } = require('../../transaction');
const transaction = require('../../../entities/transaction');

jest.mock('../../../entities/transaction');

describe('corporateAllTransactions', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('should return all transactions for a corporate', async () => {
        const mockResult = { count: 5, rows: [{ id: 1 }] };
        transaction.findAndCountAll.mockResolvedValue(mockResult);

        const params = { corporateId: 1, from: '2023-10-01', to: '2023-10-31' };
        const result = await corporateAllTransactions(params);
        expect(transaction.findAndCountAll).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });

    it('should work without corporateId', async () => {
        const mockResult = { count: 10, rows: [] };
        transaction.findAndCountAll.mockResolvedValue(mockResult);

        const result = await corporateAllTransactions({ from: '2023-10-01', to: '2023-10-31' });
        expect(result).toEqual(mockResult);
    });
});
