const { updateOrder } = require('../../../use-cases/order');
const order = require('../../../entities/order');

jest.mock('../../../entities/order', () => ({
    update: jest.fn(),
}));
jest.mock('@logtail/node', () => ({
    Logtail: jest.fn().mockImplementation(() => ({
      // Mock any methods of Logtail that are used
    })),
  }));
describe('updateOrder', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully update an order when a matching record is found', async () => {
        const mockParams = { id: 1 };
        const mockData = { status: 'COMPLETED' };

        order.update.mockResolvedValue([1]); // 1 row affected

        const result = await updateOrder(mockParams, mockData);

        expect(order.update).toHaveBeenCalledWith(mockData, {
            where: { id: mockParams.id },
        });

        expect(result).toEqual([1]);
    });

    it('should return [0] when no matching order is found', async () => {
        const mockParams = { id: 999 };
        const mockData = { status: 'COMPLETED' };

        order.update.mockResolvedValue([0]); // 0 rows affected

        const result = await updateOrder(mockParams, mockData);

        expect(order.update).toHaveBeenCalledWith(mockData, {
            where: { id: mockParams.id },
        });

        expect(result).toEqual([0]);
    });

    it('should log an error when database operation fails', async () => {
        const mockParams = { id: 1 };
        const mockData = { status: 'COMPLETED' };
        const mockError = new Error('Database error');

        order.update.mockRejectedValue(mockError);
        console.log = jest.fn();

        await expect(updateOrder(mockParams, mockData)).resolves.toBeUndefined();

        expect(console.log).toHaveBeenCalledWith(mockError);
    });

    it('should log "Update route called" in the finally block', async () => {
        const mockParams = { id: 1 };
        const mockData = { status: 'COMPLETED' };

        order.update.mockResolvedValue([1]);

        console.log = jest.fn();

        await updateOrder(mockParams, mockData);

        expect(console.log).toHaveBeenCalledWith('Update route called');
    });
});
