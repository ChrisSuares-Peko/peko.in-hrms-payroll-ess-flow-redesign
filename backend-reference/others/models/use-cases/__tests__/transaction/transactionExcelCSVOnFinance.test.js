const { transactionExcelCSVOnFinance } = require('../../transaction');
const transaction = require('../../../entities/transaction');

jest.mock('../../../entities/transaction');

describe('transactionExcelCSVOnFinance', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('should return formatted finance CSV data filtered by partnerId', async () => {
        const mockData = {
            rows: [{
                corporateTxnId: 'TXN001', credential: { name: 'Corp A', registeredBy: 5 },
                transactionDate: '2023-10-01', transactionType: 'DEBIT',
                transactionCategory: 'Category', debitAmount: 100,
                creditAmount: 0, corporateCashback: 5, balance: 900, remarks: 'Done'
            }]
        };
        transaction.findAndCountAll.mockResolvedValue(mockData);

        const result = await transactionExcelCSVOnFinance({
            from: '2023-10-01', to: '2023-10-31', order: 'DESC',
            column: 'createdAt', partnerId: 5, corporateId: null
        });

        expect(result.length).toBe(1);
        expect(result[0]['Transaction ID']).toBe('TXN001');
    });

    it('should exclude entries not matching partnerId', async () => {
        const mockData = {
            rows: [{
                corporateTxnId: 'TXN001', credential: { name: 'Corp A', registeredBy: 999 },
                transactionDate: '2023-10-01', transactionType: 'DEBIT',
                transactionCategory: 'Category', debitAmount: 100,
                creditAmount: 0, corporateCashback: 5, balance: 900, remarks: 'Done'
            }]
        };
        transaction.findAndCountAll.mockResolvedValue(mockData);

        const result = await transactionExcelCSVOnFinance({
            from: '2023-10-01', to: '2023-10-31', order: 'DESC',
            column: 'createdAt', partnerId: 5, corporateId: null
        });

        expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
        transaction.findAndCountAll.mockRejectedValue(new Error('DB error'));
        const result = await transactionExcelCSVOnFinance({
            from: '2023-10-01', to: '2023-10-31', order: 'DESC', column: 'createdAt', partnerId: 5
        });
        expect(result).toEqual([]);
    });
});
