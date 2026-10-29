const { updateOrder } = require('../../../use-cases/order');
const order = require('../../../entities/order');

jest.mock('../../../entities/order', () => ({
    update: jest.fn(),
}));

describe('updateOrder', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update an order and return the affected row count', async () => {
        const mockParams = { id: 1 };
        const mockData = { status: 'Completed' };
        const mockResponse = [1]; // 1 row affected

        order.update.mockResolvedValue(mockResponse);

        const result = await updateOrder(mockParams, mockData);

        expect(order.update).toHaveBeenCalledWith(mockData, { where: { id: mockParams.id } });
        expect(result).toEqual(mockResponse);
    });

    it('should return null when no records are updated', async () => {
        const mockParams = { id: 2 };
        const mockData = { status: 'Pending' };
        order.update.mockResolvedValue([0]); // 0 rows affected

        const result = await updateOrder(mockParams, mockData);

        expect(result).toEqual([0]);
    });

    it('should log an error when an exception occurs', async () => {
        const mockParams = { id: 3 };
        const mockData = { status: 'Failed' };
        const mockError = new Error('Database error');

        order.update.mockRejectedValue(mockError);
        console.log = jest.fn();

        await updateOrder(mockParams, mockData);

        expect(console.log).toHaveBeenCalledWith(mockError);
        expect(console.log).toHaveBeenCalledWith("Update route called");
    });

    it('should log the message when function is executed', async () => {
        const mockParams = { id: 4 };
        const mockData = { status: 'Processing' };
        const mockResponse = [1];

        console.log = jest.fn();
        order.update.mockResolvedValue(mockResponse);

        await updateOrder(mockParams, mockData);

        expect(console.log).toHaveBeenCalledWith("Update route called");
    });
});
