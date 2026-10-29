const { findAllTransactions } = require('../../../use-cases/works');
const transaction = require('../../../entities/transaction');
const { handleSortFields } = require('../../../../utils/sortHandle');

jest.mock('../../../entities/transaction', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(),
}));

describe('findAllTransactions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return transactions with filtering, sorting, and pagination', async () => {
        const mockParams = {
            from: '2024-01-01',
            to: '2024-01-31',
            accessKey: 'test-key',
            searchText: 'test',
            sort: 'ASC',
            limit: 10,
            offset: 0,
            corporateId: 1,
            sortField: 'transactionDate',
            transactionAttribute: ['id', 'amount'],
            orderAttribute: ['workspaceOrderStatus'],
            credentialAttribute: ['name', 'username'],
            serviceAttribute: ['id', 'serviceName'],
        };
        const mockData = { count: 2, rows: [
            { id: 1, amount: 1000 },
            { id: 2, amount: 2000 },
        ]};

        handleSortFields.mockReturnValue([['transactionDate', 'ASC']]);
        transaction.findAndCountAll.mockResolvedValue(mockData);

        const result = await findAllTransactions(mockParams);

        expect(handleSortFields).toHaveBeenCalledWith(mockParams.sortField, mockParams.sort);
        expect(transaction.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.any(Object),
            order: [['transactionDate', 'ASC']],
            limit: mockParams.limit,
            offset: mockParams.offset,
            attributes: mockParams.transactionAttribute,
            raw: true,
            nest: true,
        }));
        expect(result).toEqual(mockData);
    });

    it('should return an empty result when no transactions are found', async () => {
        const mockParams = { searchText: 'nonexistent', sort: 'DESC', sortField: 'transactionDate', limit: 10, offset: 0 };
        transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await findAllTransactions(mockParams);

        expect(result).toEqual({ count: 0, rows: [] });
    });

    it('should return a structured empty response when no transactions exist', async () => {
        const mockParams = { searchText: 'none', sort: 'ASC', sortField: 'transactionDate', limit: 5, offset: 0 };
        transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await findAllTransactions(mockParams) || { count: 0, rows: [] };

        expect(result).toEqual({ count: 0, rows: [] });
    });
});
