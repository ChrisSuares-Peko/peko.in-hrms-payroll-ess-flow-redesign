const { findOrdersByServiceOperatorId } = require('../../../use-cases/order');
const order = require('../../../entities/order');

jest.mock('../../../entities/order', () => ({
    findAll: jest.fn(),
}));
jest.mock('@logtail/node', () => ({
    Logtail: jest.fn().mockImplementation(() => ({
      // Mock any methods of Logtail that are used
    })),
  }));

describe('findOrdersByServiceOperatorId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return orders when matching serviceOperatorId is found', async () => {
        const mockId = 10;
        const mockOrders = [
            { id: 1, serviceOperatorId: 10, amount: 5000, status: 'PAID' },
            { id: 2, serviceOperatorId: 10, amount: 3000, status: 'PENDING' },
        ];

        order.findAll.mockResolvedValue(mockOrders);

        const result = await findOrdersByServiceOperatorId(mockId);

        expect(order.findAll).toHaveBeenCalledWith({
            where: { serviceOperatorId: mockId },
        });

        expect(result).toEqual(mockOrders);
    });

    it('should return an empty array when no matching orders are found', async () => {
        const mockId = 999;

        order.findAll.mockResolvedValue([]);

        const result = await findOrdersByServiceOperatorId(mockId);

        expect(order.findAll).toHaveBeenCalledWith({
            where: { serviceOperatorId: mockId },
        });

        expect(result).toEqual([]);
    });

    it('should log an error and throw when database operation fails', async () => {
        const mockId = 10;
        const mockError = new Error('Database error');

        order.findAll.mockRejectedValue(mockError);
        console.error = jest.fn();

        await expect(findOrdersByServiceOperatorId(mockId)).rejects.toThrow('Database error');

        expect(console.error).toHaveBeenCalledWith('Error fetching orders:', mockError);
    });

    it('should log "ORDER FIND ALL ROUTE CALLED" in the finally block', async () => {
        const mockId = 10;

        order.findAll.mockResolvedValue([{ id: 1, serviceOperatorId: 10 }]);

        console.log = jest.fn();

        await findOrdersByServiceOperatorId(mockId);

        expect(console.log).toHaveBeenCalledWith('ORDER FIND ALL ROUTE CALLED');
    });
});
