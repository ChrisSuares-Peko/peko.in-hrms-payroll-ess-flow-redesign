
const transaction = require('../../../entities/transaction'); 
const {findAllWalletTransactions} = require('../../transaction'); 

jest.mock('../../../entities/transaction'); // Mock the transaction model

describe('findAllWalletTransactions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an empty list if no wallet transactions are found', async () => {
        const params = {
            start: 0,
            from: '2024-01-01',
            to: '2024-12-31',
            length: 10,
            searchText: 'notfound',
            order: 'ASC',
            column: 1,
            userId: 101,
        };
    
        const mockResponse = { count: 0, rows: [] };
        transaction.findAndCountAll.mockResolvedValue(mockResponse);
    
        const result = await findAllWalletTransactions(params);
    
        expect(result).toEqual(mockResponse);
        expect(transaction.findAndCountAll).toHaveBeenCalled();
    });
    
    

    it('should handle errors gracefully and throw an exception', async () => {
        const params = {
            start: 0,
            from: '2024-01-01',
            to: '2024-01-31',
            length: 10,
            searchText: 'test',
            order: 'DESC',
            column: 1,
            userId: 123
        };

        // Mock findAndCountAll to throw an error
        transaction.findAndCountAll.mockRejectedValue(new Error('Database error'));

        await expect(findAllWalletTransactions(params)).rejects.toThrow('Database error');
        expect(transaction.findAndCountAll).toHaveBeenCalled();
    });
});
