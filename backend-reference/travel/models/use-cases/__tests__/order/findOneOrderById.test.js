const { findOneOrderById } = require('../../../use-cases/order');
const order = require('../../../entities/order');

jest.mock('../../../entities/order', () => ({
    findOne: jest.fn(),
}));
jest.mock('@logtail/node', () => ({
    Logtail: jest.fn().mockImplementation(() => ({
      // Mock any methods of Logtail that are used
    })),
  }));
  

describe('findOneOrderById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an order when a matching id is found', async () => {
        const mockId = 1;
        const mockOrder = {
            id: 1,
            amount: 5000,
            status: 'PAID',
        };

        order.findOne.mockResolvedValue(mockOrder);

        const result = await findOneOrderById(mockId);

        expect(order.findOne).toHaveBeenCalledWith({
            where: { id: mockId },
        });

        expect(result).toEqual(mockOrder);
    });

    it('should return null when no matching order is found', async () => {
        const mockId = 999;

        order.findOne.mockResolvedValue(null);

        const result = await findOneOrderById(mockId);

        expect(order.findOne).toHaveBeenCalledWith({
            where: { id: mockId },
        });

        expect(result).toBeNull();
    });

    it('should log an error when database operation fails', async () => {
        const mockId = 1;
        const mockError = new Error('Database error');

        order.findOne.mockRejectedValue(mockError);
        console.log = jest.fn();

        await expect(findOneOrderById(mockId)).resolves.toBeUndefined();

        expect(console.log).toHaveBeenCalledWith(mockError);
    });

    it('should log "ORDER FIND ONE ROUTE CALLED" in the finally block', async () => {
        const mockId = 1;

        order.findOne.mockResolvedValue({ id: 1 });

        console.log = jest.fn();

        await findOneOrderById(mockId);

        expect(console.log).toHaveBeenCalledWith('ORDER FIND ONE ROUTE CALLED');
    });
});
