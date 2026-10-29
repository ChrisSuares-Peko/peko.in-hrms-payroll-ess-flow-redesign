const { findAllOrder } = require('../../order');
const order = require('../../../entities/order');

jest.mock('../../../entities/order');

describe('findAllOrder', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find all orders by orderId', async () => {
        const mockParams = { orderId: 'ORD001' };
        const mockResult = [{ id: 1, orderId: 'ORD001' }];
        order.findAll.mockResolvedValue(mockResult);

        const result = await findAllOrder(mockParams);
        expect(order.findAll).toHaveBeenCalledWith({ where: { orderId: 'ORD001' } });
        expect(result).toEqual(mockResult);
    });

    it('should return undefined on error', async () => {
        order.findAll.mockRejectedValue(new Error('DB error'));

        const result = await findAllOrder({ orderId: 'ORD001' });
        expect(result).toBeUndefined();
    });
});
