const { transactionDetails } = require('../../transaction');
const orders = require('../../../entities/order');

jest.mock('../../../entities/order');

describe('transactionDetails', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('should return order details with serviceOperator', async () => {
        const mockResult = { id: 1, corporateTxnId: 'TXN001', serviceOperator: { serviceProvider: 'Airtel' } };
        orders.findOne.mockResolvedValue(mockResult);

        const result = await transactionDetails({ transactionId: 'TXN001' });
        expect(orders.findOne).toHaveBeenCalledWith(expect.objectContaining({
            where: { corporateTxnId: 'TXN001' }
        }));
        expect(result).toEqual(mockResult);
    });

    it('should return undefined on error', async () => {
        orders.findOne.mockRejectedValue(new Error('DB error'));
        const result = await transactionDetails({ transactionId: 'TXN001' });
        expect(result).toBeUndefined();
    });
});
