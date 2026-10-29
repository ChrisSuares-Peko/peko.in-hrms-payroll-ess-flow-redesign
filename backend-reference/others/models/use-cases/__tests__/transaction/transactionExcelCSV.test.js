const { transactionExcelCSV } = require('../../transaction');
const transaction = require('../../../entities/transaction');

jest.mock('../../../entities/transaction');

describe('transactionExcelCSV', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('should return formatted CSV data', async () => {
        const mockData = {
            rows: [{
                corporateTxnId: 'TXN001', credential: { name: 'Corp A' },
                transactionDate: '2023-10-01', transactionType: 'DEBIT',
                transactionCategory: 'Mobile Recharge', debitAmount: 100,
                creditAmount: 0, corporateCashback: 5, balance: 900, remarks: 'Success'
            }]
        };
        transaction.findAndCountAll.mockResolvedValue(mockData);

        const result = await transactionExcelCSV({
            from: '2023-10-01', to: '2023-10-31', order: 'DESC', column: 'createdAt'
        });

        expect(result).toEqual([{
            'Transaction ID': 'TXN001', 'Corporate Name': 'Corp A',
            Date: expect.any(String), Type: 'DEBIT', Category: 'Mobile Recharge',
            'Debit Amount': '100₹', 'Credit Amount': '0.0000',
            Cashback: '5₹', Balance: '900₹', Remarks: 'Success'
        }]);
    });

    it('should return empty array on error', async () => {
        transaction.findAndCountAll.mockRejectedValue(new Error('DB error'));
        const result = await transactionExcelCSV({ from: '2023-10-01', to: '2023-10-31', order: 'DESC', column: 'createdAt' });
        expect(result).toEqual([]);
    });
});
