const { transactionPDF } = require('../../transaction');
const transaction = require('../../../entities/transaction');

jest.mock('../../../entities/transaction');

describe('transactionPDF', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('should return formatted PDF data', async () => {
        const mockData = {
            rows: [{
                corporateTxnId: 'TXN001', credential: { name: 'Corp A' },
                transactionDate: '2023-10-01', transactionType: 'DEBIT',
                transactionCategory: 'Mobile Recharge', debitAmount: 100,
                creditAmount: 0, corporateCashback: 5, balance: 900, remarks: 'Success'
            }]
        };
        transaction.findAndCountAll.mockResolvedValue(mockData);

        const result = await transactionPDF({
            from: '2023-10-01', to: '2023-10-31', order: 'DESC', column: 'createdAt'
        });

        expect(result).toEqual([expect.objectContaining({
            TransactionId: 'TXN001', CorporateName: 'Corp A'
        })]);
    });

    it('should return empty array on error', async () => {
        transaction.findAndCountAll.mockRejectedValue(new Error('DB error'));
        const result = await transactionPDF({ from: '2023-10-01', to: '2023-10-31', order: 'DESC', column: 'createdAt' });
        expect(result).toEqual([]);
    });
});
