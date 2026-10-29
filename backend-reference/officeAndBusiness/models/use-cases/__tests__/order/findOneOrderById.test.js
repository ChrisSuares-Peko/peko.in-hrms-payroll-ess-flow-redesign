const { findOneOrderById } = require('../../../use-cases/order');
const order = require('../../../entities/order');

jest.mock('../../../entities/order', () => ({
    findOne: jest.fn(),
}));

describe('findOneOrderById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an order when found', async () => {
        const mockId = 1;
        const mockOrder = { id: 1, corporateTxnId: 'TXN123', amount: 100 };

        order.findOne.mockResolvedValue(mockOrder);

        const result = await findOneOrderById(mockId);

        expect(order.findOne).toHaveBeenCalledWith({ where: { id: mockId } });
        expect(result).toEqual(mockOrder);
    });

    it('should return null when no order is found', async () => {
        const mockId = 999;
        order.findOne.mockResolvedValue(null);

        const result = await findOneOrderById(mockId);

        expect(result).toBeNull();
    });

    it('should log an error when an exception occurs', async () => {
        const mockId = 789;
        const mockError = new Error('Database error');

        order.findOne.mockRejectedValue(mockError);
        console.log = jest.fn();

        await findOneOrderById(mockId);

        expect(console.log).toHaveBeenCalledWith(mockError);
        expect(console.log).toHaveBeenCalledWith("ORDER FIND ONE ROUTE CALLED");
    });

    it('should log the message when function is executed', async () => {
        const mockId = 456;
        const mockOrder = { id: 2, corporateTxnId: 'TXN456', amount: 200 };

        console.log = jest.fn();
        order.findOne.mockResolvedValue(mockOrder);

        await findOneOrderById(mockId);

        expect(console.log).toHaveBeenCalledWith("ORDER FIND ONE ROUTE CALLED");
    });
});
