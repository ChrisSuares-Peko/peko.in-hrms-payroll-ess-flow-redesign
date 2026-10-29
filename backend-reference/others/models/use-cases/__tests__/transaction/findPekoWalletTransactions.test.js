const { findPekoWalletTransactions } = require('../../transaction');
const transaction = require('../../../entities/transaction');

jest.mock('../../../entities/transaction');
jest.mock('../../../../utils/sortHandle', () => ({ handleSortFields: jest.fn(() => [['createdAt', 'DESC']]) }));

describe('findPekoWalletTransactions', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('should return peko wallet transactions', async () => {
        const mockResult = { count: 1, rows: [{ id: 1 }] };
        transaction.findAndCountAll.mockResolvedValue(mockResult);

        const params = {
            from: '2023-10-01', to: '2023-10-31', limit: 10, offset: 0,
            searchText: '', sort: 'DESC', sortField: 'createdAt',
            userId: null, partnerId: null
        };

        const result = await findPekoWalletTransactions(params);
        expect(transaction.findAndCountAll).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });

    it('should filter by userId when provided', async () => {
        const mockResult = { count: 1, rows: [{ id: 1 }] };
        transaction.findAndCountAll.mockResolvedValue(mockResult);

        const params = {
            from: '2023-10-01', to: '2023-10-31', limit: 10, offset: 0,
            searchText: '', sort: 'DESC', sortField: 'createdAt',
            userId: 5, partnerId: null
        };

        const result = await findPekoWalletTransactions(params);
        expect(result).toEqual(mockResult);
    });
});
