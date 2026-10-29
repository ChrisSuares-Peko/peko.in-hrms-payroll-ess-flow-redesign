const { getExcelCSVData } = require('../../transaction');
const transaction = require('../../../entities/transaction');

jest.mock('../../../entities/transaction');

describe('getExcelCSVData', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('should return formatted excel CSV data', async () => {
        const mockData = {
            rows: [{
                corporateTxnId: 'TXN001', credential: { name: 'Corp A' },
                transactionDate: '2023-10-01', transactionType: 'DEBIT',
                transactionCategory: 'Category', debitAmount: 100,
                creditAmount: 0, corporateCashback: 5, systemCashback: 2,
                balance: 900, remarks: 'Done', serviceOperator: { serviceProvider: 'Airtel' },
                order: { paymentMode: 'UPI', status: 'SUCCESS' }
            }]
        };
        transaction.findAndCountAll.mockResolvedValue(mockData);

        const params = {
            corporateId: 1, from: '2023-10-01', to: '2023-10-31',
            searchText: '', order: 'DESC', column: 'createdAt', reportFor: null
        };

        const result = await getExcelCSVData(params);
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
    });
});
