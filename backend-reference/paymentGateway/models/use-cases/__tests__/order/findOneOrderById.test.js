const { findOneOrderById } = require('../../../use-cases/order'); 
const order = require('../../../entities/order'); 

jest.mock('../../../entities/order', () => ({
    findOne: jest.fn(),
}));

jest.mock("@logtail/node", () => ({
    Logtail: jest.fn().mockImplementation(() => ({
        log: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    })),
}));
describe('findOneOrderById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the order when found', async () => {
        const mockId = 1;
        const mockOrder = { id: mockId, /* ... other order data */ };

        order.findOne.mockResolvedValue(mockOrder);

        const result = await findOneOrderById(mockId);

        expect(order.findOne).toHaveBeenCalledWith({ where: { id: mockId } });
        expect(result).toEqual(mockOrder);
    });

    it('should return null when order is not found', async () => {
        const mockId = 1;

        order.findOne.mockResolvedValue(null);

        const result = await findOneOrderById(mockId);

        expect(order.findOne).toHaveBeenCalledWith({ where: { id: mockId } });
        expect(result).toBeNull();
    });

    it('should handle errors during database operations', async () => {
        const mockId = 1;
        const mockError = new Error('Database error');
        const consoleLogSpy = jest.spyOn(console, 'log');


        order.findOne.mockRejectedValue(mockError);

        const result = await findOneOrderById(mockId);

        expect(order.findOne).toHaveBeenCalledWith({ where: { id: mockId } });
        expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
        expect(consoleLogSpy).toHaveBeenCalledWith("ORDER FIND ONE ROUTE CALLED");
        expect(result).toBeUndefined(); // Or handle the error as you prefer (e.g., re-throw)

        consoleLogSpy.mockRestore();
    });

    it('should handle undefined id', async () => {
      await findOneOrderById(undefined);

      expect(order.findOne).toHaveBeenCalledWith({ where: { id: undefined } });
      // Add an expectation here depending on how you handle undefined id.
      // For example, if you throw an error, use:
      // await expect(findOneOrderById(undefined)).rejects.toThrow();
    });
});