const { findTransactionsByBatchId } = require('../../../use-cases/eSIM');
const transaction = require('../../../entities/transaction');
const orders = require('../../../entities/order');

jest.mock('../../../entities/transaction', () => ({
    findAll: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));

describe('findTransactionsByBatchId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return transactions when matching records are found', async () => {
        const mockBatchId = 'BATCH123';
        const mockTransactions = [
            {
                status: 'SUCCESS',
                corporateTxnId: '1001',
                orders: {}
            },
            {
                status: 'FAILED',
                corporateTxnId: '1002',
                orders: {}
            }
        ];

        transaction.findAll.mockResolvedValue(mockTransactions);

        const result = await findTransactionsByBatchId(mockBatchId, 10);

        expect(transaction.findAll).toHaveBeenCalledWith({
            where: { batchId: mockBatchId, credentialId: 10 },
            include: [{ model: orders }],
            attributes: ['status', 'corporateTxnId'],
            raw: true,
            nest: true,
        });

        expect(result).toEqual([
            { status: 'SUCCESS', corporateTxnId: 1001, orders: {} },
            { status: 'FAILED', corporateTxnId: 1002, orders: {} }
        ]);
    });

    it('should return an empty array when no matching transactions are found', async () => {
        const mockBatchId = 'BATCH456';

        transaction.findAll.mockResolvedValue([]);

        const result = await findTransactionsByBatchId(mockBatchId, 10);

        expect(transaction.findAll).toHaveBeenCalledWith(expect.any(Object));
        expect(result).toEqual([]);
    });

    it('should return an empty array when an error occurs', async () => {
        const mockBatchId = 'BATCH_ERROR';
        const mockError = new Error('Database error');

        transaction.findAll.mockRejectedValue(mockError);

        const result = await findTransactionsByBatchId(mockBatchId, 10);

        expect(transaction.findAll).toHaveBeenCalledWith(expect.any(Object));
        expect(result).toEqual([]);
    });

    it('should return an empty array without querying when credentialId is missing', async () => {
        const result = await findTransactionsByBatchId('BATCH123');

        expect(transaction.findAll).not.toHaveBeenCalled();
        expect(result).toEqual([]);
    });
});
