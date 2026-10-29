const { createOrder } = require('../../order');
const order = require('../../../entities/order');

jest.mock('../../../entities/order');

describe('createOrder', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create an order successfully', async () => {
        const mockParams = { orderId: 'ORD001', amount: 100 };
        const mockResult = { id: 1, ...mockParams };
        order.create.mockResolvedValue(mockResult);

        const result = await createOrder(mockParams);
        expect(order.create).toHaveBeenCalledWith(mockParams);
        expect(result).toEqual(mockResult);
    });

    it('should return undefined on error', async () => {
        order.create.mockRejectedValue(new Error('DB error'));

        const result = await createOrder({});
        expect(result).toBeUndefined();
    });
});
