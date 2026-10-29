const { getBillPaymentAlert } = require('../../dashboard'); // Adjust the path as needed
const transaction = require('../../../entities/transaction');

jest.mock('../../../entities/transaction', () => ({
    findAll: jest.fn(),
}));

jest.mock('../../../entities/order');
jest.mock('../../../entities/serviceOperator');
jest.mock('../../../entities/corporateUser',()=>({
    hasMany:jest.fn()
}))

describe('getBillPaymentAlert', () => {
    it('should return pending bills based on transactions', async () => {
        // Mocking the transactions data returned by `findAll`
        const currentDate = new Date();
        const fortyDaysAgo = new Date(currentDate);
        fortyDaysAgo.setDate(currentDate.getDate() - 40); // Falls within 25-60 days ago

        const mockTransactions = [
            {
                id: 1,
                transactionCategory: 'Telecom Payments',
                transactionDate: fortyDaysAgo, // Date falls within the required range
                debitAmount: 100.0,
                status: 'SUCCESS',
                order: {
                    accountNo: '123456789',
                },
                serviceOperator: {
                    serviceProvider: 'Service Provider 1',
                    serviceImage: 'image_url_1',
                },
            },
            {
                id: 2,
                transactionCategory: 'Utility Payments',
                transactionDate: currentDate, // Date is too recent, shouldn't be included
                debitAmount: 200.0,
                status: 'SUCCESS',
                order: {
                    accountNo: '987654321',
                },
                serviceOperator: {
                    serviceProvider: 'Service Provider 2',
                    serviceImage: 'image_url_2',
                },
            },
        ];

        transaction.findAll.mockResolvedValueOnce(mockTransactions);

        const params = 'some-credential-id';
        const result = await getBillPaymentAlert(params);

        // Validate the result as an array of pending bills
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0); // Should be greater than 0 based on mock data

        // Example of further validating specific values
        expect(result[0]).toHaveProperty('order.accountNo', '123456789');
        expect(result[0]).toHaveProperty('serviceOperator.serviceProvider', 'Service Provider 1');

        expect(transaction.findAll).toHaveBeenCalledWith({
            where: expect.any(Object),
            include: expect.any(Array),
        });
    });

    it('should return an empty array if there are no transactions', async () => {
        transaction.findAll.mockResolvedValueOnce([]);

        const params = 'some-credential-id';
        const result = await getBillPaymentAlert(params);

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);

        expect(transaction.findAll).toHaveBeenCalledWith({
            where: expect.any(Object),
            include: expect.any(Array),
        });
    });

    it('should handle errors when the findAll method fails', async () => {
        transaction.findAll.mockRejectedValueOnce(new Error('Database error'));

        const params = 'some-credential-id';
        
        await expect(getBillPaymentAlert(params)).rejects.toThrow('Database error');
        expect(transaction.findAll).toHaveBeenCalled();
    });
});
