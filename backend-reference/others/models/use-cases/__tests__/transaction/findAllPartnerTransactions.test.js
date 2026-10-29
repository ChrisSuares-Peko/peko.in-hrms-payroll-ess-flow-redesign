const { findAllPartnerTransactions } = require('../../transaction');
const transaction = require('../../../entities/transaction');

jest.mock('../../../entities/transaction');
jest.mock('../../../../utils/sortHandle', () => ({ handleSortFields: jest.fn(() => [['createdAt', 'DESC']]) }));

describe('findAllPartnerTransactions', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('should return partner transactions', async () => {
        const mockResult = { count: 2, rows: [{ id: 1 }, { id: 2 }] };
        transaction.findAndCountAll.mockResolvedValue(mockResult);

        const params = {
            from: '2023-10-01', to: '2023-10-31', categoryName: 'all',
            searchText: '', sort: 'DESC', filter: null, limit: 10, offset: 0,
            corporateId: null, serviceAttribute: ['id'], credentialAttribute: ['name'],
            transactionAttribute: ['id'], orderAttribute: ['id'], sortField: 'createdAt',
            partnerId: 10, subCorporateUserId: null
        };

        const result = await findAllPartnerTransactions(params);
        expect(transaction.findAndCountAll).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });
});
