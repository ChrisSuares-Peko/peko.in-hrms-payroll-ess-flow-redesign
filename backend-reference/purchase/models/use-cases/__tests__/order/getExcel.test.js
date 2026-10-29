const transaction = require('../../../entities/transaction');
const serviceOperator = require('../../../entities/serviceOperator');
const credential = require('../../../entities/credential');
const orders = require('../../../entities/order');
const { getExcel } = require('../../order');
const {Op} = require('sequelize')

jest.mock('../../../entities/transaction', () => ({
    findAndCountAll: jest.fn(),
}));

describe('getExcel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return formatted transaction data successfully', async () => {
        // Mock input parameters
        const mockParams = {
            from: '2024-01-01',
            to: '2024-02-01',
            order: 'DESC',
            column: 'transactionDate'
        };

        // Mock response from database
        const mockData = {
            rows: [
                {
                    transactionDate: '2024-01-10T10:30:00Z',
                    credential: { name: 'Test Corp' },
                    providerId: 'ORD12345',
                    corporateTxnId: 98765,
                    transactionCategory: 'Recharge',
                    serviceOperator: { serviceProvider: 'Operator A' },
                    order: {
                        amountInINR: 500.75,
                        paymentMode: 'Credit Card',
                        status: 'Completed'
                    }
                },
                {
                    transactionDate: null,
                    credential: { name: null },
                    providerId: null,
                    corporateTxnId: null,
                    transactionCategory: null,
                    serviceOperator: { serviceProvider: null },
                    order: {
                        amountInINR: null,
                        paymentMode: null,
                        status: null
                    }
                }
            ]
        };

        // Expected formatted response
        const expectedData = [
            {
                Date: '2024-01-10 16:00:00',
                'Corporate Name': 'Test Corp',
                'Order Id': 'ORD12345',
                'Transaction Id': '98765',
                Category: 'Recharge',
                Operator: 'Operator A',
                Amount: '500.75 INR',
                'Payment Mode': 'Credit Card',
                Status: 'Completed'
            },
            {
                Date: 'Not Available',
                'Corporate Name': 'Not Available',
                'Order Id': 'Not Available',
                'Transaction Id': 'Not Available',
                Category: 'Not Available',
                Operator: 'Not Available',
                Amount: '0.00',
                'Payment Mode': 'Not Available',
                Status: 'Not Available'
            }
        ];

        // Mock implementation
        transaction.findAndCountAll.mockResolvedValue(mockData);

        // Call function
        const result = await getExcel(mockParams);

        // Expectations
        expect(transaction.findAndCountAll).toHaveBeenCalledTimes(1);
        expect(transaction.findAndCountAll).toHaveBeenCalledWith({
            include: [
                { model: serviceOperator },
                { model: credential },
                { model: orders }
            ],
            where: {
                transactionDate: {
                    [Op.between]: [mockParams.from, mockParams.to]
                }
            },
            order: [[mockParams.column, mockParams.order]],
            raw: true,
            nest: true
        });
        
        expect(result).toEqual(expectedData);
    });

    it('should handle errors properly', async () => {
        // Mock rejection
        const mockError = new Error('Database error');
        transaction.findAndCountAll.mockRejectedValue(mockError);

        // Expect function to throw an error
        await expect(getExcel({ from: '2024-01-01', to: '2024-02-01', order: 'DESC', column: 'transactionDate' }))
            .rejects.toThrow('Database error');
    });
});
