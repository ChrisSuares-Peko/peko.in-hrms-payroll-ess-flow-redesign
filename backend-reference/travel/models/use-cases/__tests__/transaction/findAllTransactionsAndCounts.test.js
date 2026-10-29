const { findAllTransactionsAndCounts } = require('../../../use-cases/transaction');
const transaction = require('../../../entities/transaction');
const serviceOperator = require('../../../entities/serviceOperator');
const credential = require('../../../entities/credential');
const orders = require('../../../entities/order');

jest.mock('../../../entities/transaction', () => ({
    findAndCountAll: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));

describe('findAllTransactionsAndCounts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return transactions with counts when matching parameters are found', async () => {
        const mockParams = {
            from: '2024-01-01',
            to: '2024-02-01',
            categoryName: 'MOBILE',
            searchText: 'Test',
            sort: 'DESC',
            filter: 'PAID',
            limit: 10,
            offset: 0,
            corporateId: 123,
            serviceAttribute: ['serviceProvider'],
            credentialAttribute: ['name'],
            transactionAttribute: ['id', 'corporateTxnId', 'debitAmount'],
            orderAttribute: ['paymentMode', 'status'],
            sortField: 'transactionDate',
        };

        const mockTransactions = {
            count: 2,
            rows: [
                {
                    id: 1,
                    corporateTxnId: 'TXN123',
                    debitAmount: 500,
                    serviceOperator: { serviceProvider: 'Provider A' },
                    credential: { name: 'Corporate User' },
                    orders: { paymentMode: 'Credit Card', status: 'PAID' },
                },
                {
                    id: 2,
                    corporateTxnId: 'TXN456',
                    debitAmount: 1000,
                    serviceOperator: { serviceProvider: 'Provider B' },
                    credential: { name: 'Another User' },
                    orders: { paymentMode: 'PayPal', status: 'PAID' },
                },
            ],
        };

        transaction.findAndCountAll.mockResolvedValue(mockTransactions);

        const result = await findAllTransactionsAndCounts(mockParams);

        expect(transaction.findAndCountAll).toHaveBeenCalledWith({
            include: expect.arrayContaining([
                expect.objectContaining({ model: serviceOperator, attributes: mockParams.serviceAttribute }),
                expect.objectContaining({ model: credential, attributes: mockParams.credentialAttribute }),
                expect.objectContaining({ model: orders, attributes: mockParams.orderAttribute }),
            ]),
            where: expect.any(Object),
            order: [['transactionDate', 'DESC']],
            limit: mockParams.limit,
            offset: mockParams.offset,
            attributes: mockParams.transactionAttribute,
            raw: true,
            nest: true,
        });

        expect(result).toEqual(mockTransactions);
    });

    it('should return empty results when no transactions are found', async () => {
        const mockParams = {
            from: '2024-01-01',
            to: '2024-02-01',
            searchText: 'NonExistent',
            limit: 10,
            offset: 0,
        };

        const mockTransactions = { count: 0, rows: [] };

        transaction.findAndCountAll.mockResolvedValue(mockTransactions);

        const result = await findAllTransactionsAndCounts(mockParams);

        expect(transaction.findAndCountAll).toHaveBeenCalledWith(expect.any(Object));
        expect(result).toEqual(mockTransactions);
    });

    it('should log an error and throw when database operation fails', async () => {
        const mockParams = { from: '2024-01-01', to: '2024-02-01' };
        const mockError = new Error('Database error');

        transaction.findAndCountAll.mockRejectedValue(mockError);
        console.error = jest.fn();

        await expect(findAllTransactionsAndCounts(mockParams)).rejects.toThrow('Database error');

    });
});
