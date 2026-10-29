const { deleteOrder } = require('../../order');
const order = require('../../../entities/order');

jest.mock('../../../entities/order');

describe('deleteOrder', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete an order by orderId', async () => {
        const mockParams = { orderId: 'ORD001' };
        order.destroy.mockResolvedValue(1);

        const result = await deleteOrder(mockParams);
        expect(order.destroy).toHaveBeenCalledWith({ where: { orderId: 'ORD001' } });
        expect(result).toBe(1);
    });

    it('should return undefined on error', async () => {
        order.destroy.mockRejectedValue(new Error('DB error'));

        const result = await deleteOrder({ orderId: 'ORD001' });
        expect(result).toBeUndefined();
    });
});
