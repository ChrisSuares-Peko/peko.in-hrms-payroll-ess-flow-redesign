const { findOneOrder } = require('../../../use-cases/order');
const order = require('../../../entities/order');

jest.mock('../../../entities/order', () => ({
    findOne: jest.fn(),
}));

describe('findOneOrder', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an order when found', async () => {
        const mockParams = { corporateTxnId: 'TXN123' };
        const mockOrder = { id: 1, corporateTxnId: 'TXN123', amount: 100 };

        order.findOne.mockResolvedValue(mockOrder);

        const result = await findOneOrder(mockParams);

        expect(order.findOne).toHaveBeenCalledWith({ where: { corporateTxnId: mockParams.corporateTxnId } });
        expect(result).toEqual(mockOrder);
    });

    it('should return null when no order is found', async () => {
        const mockParams = { corporateTxnId: 'TXN999' };
        order.findOne.mockResolvedValue(null);

        const result = await findOneOrder(mockParams);

        expect(result).toBeNull();
    });

    it('should log an error when an exception occurs', async () => {
        const mockParams = { corporateTxnId: 'TXN789' };
        const mockError = new Error('Database error');

        order.findOne.mockRejectedValue(mockError);
        console.log = jest.fn();

        await findOneOrder(mockParams);

        expect(console.log).toHaveBeenCalledWith(mockError);
        expect(console.log).toHaveBeenCalledWith("ORDER FIND ONE ROUTE CALLED");
    });

    it('should log the message when function is executed', async () => {
        const mockParams = { corporateTxnId: 'TXN456' };
        const mockOrder = { id: 2, corporateTxnId: 'TXN456', amount: 200 };

        console.log = jest.fn();
        order.findOne.mockResolvedValue(mockOrder);

        await findOneOrder(mockParams);

        expect(console.log).toHaveBeenCalledWith("ORDER FIND ONE ROUTE CALLED");
    });
});
