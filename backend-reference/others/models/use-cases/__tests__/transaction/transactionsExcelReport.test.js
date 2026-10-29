const { transactionsExcelReport } = require('../../transaction');
const transaction = require('../../../entities/transaction');

jest.mock('../../../entities/transaction');

describe('transactionsExcelReport', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('should return formatted excel report', async () => {
        const mockData = {
            rows: [{
                id: 1, transactionDate: '2023-10-01', providerId: 'PROV001',
                corporateTxnId: 'TXN001', transactionCategory: 'Mobile',
                serviceOperator: { serviceProvider: 'Airtel' },
                order: { amountInINR: 100, paymentMode: 'UPI' },
                status: 'SUCCESS', credential: {}
            }]
        };
        transaction.findAndCountAll.mockResolvedValue(mockData);

        const result = await transactionsExcelReport({
            credentialId: 1, from: '2023-10-01', to: '2023-10-31', partnerId: undefined
        });

        expect(result.length).toBe(1);
        expect(result[0].ID).toBe(1);
    });

    it('should return empty array on error', async () => {
        transaction.findAndCountAll.mockRejectedValue(new Error('DB error'));
        const result = await transactionsExcelReport({
            credentialId: 1, from: '2023-10-01', to: '2023-10-31'
        });
        expect(result).toEqual([]);
    });
});
