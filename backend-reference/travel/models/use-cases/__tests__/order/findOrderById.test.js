const { findOrderById } = require('../../../use-cases/order');
const order = require('../../../entities/order');

jest.mock('../../../entities/order', () => ({
    findOne: jest.fn(),
}));
jest.mock('@logtail/node', () => ({
    Logtail: jest.fn().mockImplementation(() => ({
      // Mock any methods of Logtail that are used
    })),
  }));

describe('findOrderById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an order when a matching credentialId and orderId are found', async () => {
        const mockParams = { credentialId: 123, orderId: 1 };
        const mockOrder = {
            id: 1,
            credentialId: 123,
            amount: 5000,
            status: 'PAID',
        };

        order.findOne.mockResolvedValue(mockOrder);

        const result = await findOrderById(mockParams);

        expect(order.findOne).toHaveBeenCalledWith({
            where: { id: mockParams.orderId, credentialId: mockParams.credentialId },
        });

        expect(result).toEqual(mockOrder);
    });

    it('should return null when no matching order is found', async () => {
        const mockParams = { credentialId: 123, orderId: 999 };

        order.findOne.mockResolvedValue(null);

        const result = await findOrderById(mockParams);

        expect(order.findOne).toHaveBeenCalledWith({
            where: { id: mockParams.orderId, credentialId: mockParams.credentialId },
        });

        expect(result).toBeNull();
    });

    it('should log an error when database operation fails', async () => {
        const mockParams = { credentialId: 123, orderId: 1 };
        const mockError = new Error('Database error');

        order.findOne.mockRejectedValue(mockError);
        console.log = jest.fn();

        await expect(findOrderById(mockParams)).resolves.toBeUndefined();

        expect(console.log).toHaveBeenCalledWith(mockError);
    });

    it('should log "ORDER FIND ONE ROUTE CALLED" in the finally block', async () => {
        const mockParams = { credentialId: 123, orderId: 1 };

        order.findOne.mockResolvedValue({ id: 1 });

        console.log = jest.fn();

        await findOrderById(mockParams);

        expect(console.log).toHaveBeenCalledWith('ORDER FIND ONE ROUTE CALLED');
    });
});
