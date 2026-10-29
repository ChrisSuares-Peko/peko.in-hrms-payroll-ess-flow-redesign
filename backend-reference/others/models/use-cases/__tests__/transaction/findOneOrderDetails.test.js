const { findOneOrderDetails } = require('../../transaction');
const orders = require('../../../entities/order');

jest.mock('../../../entities/order');

describe('findOneOrderDetails', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('should return order details for successful transaction', async () => {
        const mockResult = { id: 1, corporateTxnId: 'TXN001', status: 'SUCCESS' };
        orders.findOne.mockResolvedValue(mockResult);

        const result = await findOneOrderDetails({ transactionId: 'TXN001' });
        expect(orders.findOne).toHaveBeenCalledWith(expect.objectContaining({
            where: { corporateTxnId: 'TXN001', status: 'SUCCESS' }
        }));
        expect(result).toEqual(mockResult);
    });

    it('should return null if not found', async () => {
        orders.findOne.mockResolvedValue(null);
        const result = await findOneOrderDetails({ transactionId: 'NOTFOUND' });
        expect(result).toBeNull();
    });
});
