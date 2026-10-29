const order = require('../../../entities/order'); // Ensure this path is correct
const { createOrder } = require('../../order'); 

jest.mock('../../../entities/order', () => ({
    create: jest.fn(),
}));

describe('createOrder', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully create an order with schema attributes', async () => {
        const params = {
            corporateTxnId: 'TXN123',
            operatorId: 'OP123',
            providerId: 'PR123',
            transactionDate: new Date(),
            accountNo: 'ACC123',
            amountInINR: 100.00,
            baseAmount: 90.00,
            paymentMode: 'CreditCard',
            orderResponse: 'Success',
            paymentModeResponse: 'Authorized',
            surcharge: 5.00,
            baseCurrency: 'USD',
            exchangeRate: '3.67',
            status: 'Completed',
            message: 'Order completed successfully',
            ecomOrderStatus: 'Confirmed',
            workspaceOrderStatus: 'Pending',
            shipmentStatus: []
        };
        const createdOrder = { id: 1, ...params };

        order.create.mockResolvedValue(createdOrder); // Mock successful creation

        const result = await createOrder(params);

        expect(result).toEqual(createdOrder);
        expect(order.create).toHaveBeenCalledWith(params);
    });

    it('should handle errors gracefully', async () => {
        const params = { corporateTxnId: 'TXN123' };
        const errorMessage = 'Failed to create order';

        order.create.mockRejectedValue(new Error(errorMessage)); // Simulate an error

        // Spy on console.log
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        await createOrder(params);

        // Verify that console.log was called with the error message
        expect(consoleLogSpy).toHaveBeenCalledWith(errorMessage);

        // Clean up the spy
        consoleLogSpy.mockRestore();
    });

    it('should execute the finally block', async () => {
        const params = { corporateTxnId: 'TXN123' };

        // Spy on console.log
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        // Test both success and error cases
        order.create.mockResolvedValue({ id: 1, ...params });
        await createOrder(params);
        expect(consoleLogSpy).toHaveBeenCalledWith("ORDER CREATE ROUTE CALLED");

        order.create.mockRejectedValue(new Error('Test Error'));
        await createOrder(params);
        expect(consoleLogSpy).toHaveBeenCalledWith("ORDER CREATE ROUTE CALLED");

        // Clean up the spy
        consoleLogSpy.mockRestore();
    });
});
