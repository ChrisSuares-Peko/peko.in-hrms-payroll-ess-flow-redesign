const { findAllTransactionsCashback } = require('../../transaction');
const transaction = require('../../../entities/transaction');

jest.mock('../../../entities/transaction');
jest.mock('../../../../utils/sortHandle', () => ({ handleSortFields: jest.fn(() => [['createdAt', 'DESC']]) }));

describe('findAllTransactionsCashback', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('should return transactions with cashback data', async () => {
        const mockResult = { count: 1, rows: [{ id: 1 }] };
        transaction.findAndCountAll.mockResolvedValue(mockResult);

        const params = {
            from: '2023-10-01', to: '2023-10-31', categoryName: 'all',
            searchText: '', sort: 'DESC', filter: null, limit: 10, offset: 0,
            corporateId: null, serviceAttribute: ['id'], credentialAttribute: ['name'],
            transactionAttribute: ['id'], orderAttribute: ['id'], sortField: 'createdAt',
            registeredBy: null, isCashbackRecord: false, subCorporateUserId: null
        };

        const result = await findAllTransactionsCashback(params);
        expect(transaction.findAndCountAll).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });

    it('should throw error on failure', async () => {
        transaction.findAndCountAll.mockRejectedValue(new Error('DB error'));

        const params = {
            from: '2023-10-01', to: '2023-10-31', categoryName: 'all',
            searchText: '', sort: 'DESC', filter: null, limit: 10, offset: 0,
            corporateId: null, serviceAttribute: ['id'], credentialAttribute: ['name'],
            transactionAttribute: ['id'], orderAttribute: ['id'], sortField: 'createdAt',
            registeredBy: null, isCashbackRecord: false, subCorporateUserId: null
        };

        await expect(findAllTransactionsCashback(params)).rejects.toEqual({ message: 'Something went wrong' });
    });
});
