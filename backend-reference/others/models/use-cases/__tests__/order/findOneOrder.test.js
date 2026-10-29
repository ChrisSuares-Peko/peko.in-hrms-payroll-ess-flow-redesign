const { findOneOrder } = require('../../../use-cases/order');
const order = require('../../../entities/order');

jest.mock('../../../entities/order', () => ({
    findOne: jest.fn(),
}));

describe('findOneOrder', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find and return an order when corporateTxnId is provided', async () => {
        const mockParams = { corporateTxnId: 'txn123' };
        const mockOrder = { id: 1, corporateTxnId: 'txn123', total: 100 };

        order.findOne.mockResolvedValue(mockOrder);

        const result = await findOneOrder(mockParams);

        expect(order.findOne).toHaveBeenCalledWith({
            where: { corporateTxnId: mockParams.corporateTxnId },
        });
        expect(result).toEqual(mockOrder);
    });

    it('should log an error and return undefined when an exception occurs', async () => {
        const mockParams = { corporateTxnId: 'txn123' };
        const mockError = new Error('Database error');

        order.findOne.mockRejectedValue(mockError);

        console.log = jest.fn();

        const result = await findOneOrder(mockParams);

        expect(order.findOne).toHaveBeenCalledWith({
            where: { corporateTxnId: mockParams.corporateTxnId },
        });
        expect(console.log).toHaveBeenCalledWith(mockError);
        expect(result).toBeUndefined();
    });

    it('should always log "ORDER FIND ONE ROUTE CALLED"', async () => {
        const mockParams = { corporateTxnId: 'txn123' };

        order.findOne.mockResolvedValue(null);
        console.log = jest.fn();

        await findOneOrder(mockParams);

        expect(console.log).toHaveBeenCalledWith('ORDER FIND ONE ROUTE CALLED');
    });
});
