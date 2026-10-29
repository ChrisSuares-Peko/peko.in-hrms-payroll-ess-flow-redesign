const { updateOrder } = require('../../order');
const order = require("../../../entities/order");

// Mock the order.update method
jest.mock('../../../entities/order', () => ({
  update: jest.fn(),
}));
// Mock the necessary modules
jest.mock('../../../entities/transaction', () => ({
  belongsTo: jest.fn(),
}));

describe('updateOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
  });

  it('should call order.update with correct parameters and return the result', async () => {
    const params = { id: 1 };
    const data = { status: 'completed' };
    const mockResult = [1]; // Mock result, e.g., [number of affected rows]

    // Mock the implementation of order.update
    order.update.mockResolvedValue(mockResult);

    const result = await updateOrder(params, data);

    expect(order.update).toHaveBeenCalledWith(data, {
      where: { id: params.id },
    });
    expect(order.update).toHaveBeenCalledTimes(1);
    expect(result).toBe(mockResult);
  });

  it('should log error if order.update throws an error', async () => {
    const params = { id: 1 };
    const data = { status: 'completed' };
    const errorMessage = 'Database error';

    // Mock the implementation to throw an error
    order.update.mockRejectedValue(new Error(errorMessage));

    // Spy on console.log to check for error messages
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await updateOrder(params, data);

    expect(order.update).toHaveBeenCalledWith(data, {
      where: { id: params.id },
    });
    expect(order.update).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith(new Error(errorMessage));

    // Restore console.log
    consoleLogSpy.mockRestore();
  });

  it('should always execute the finally block', async () => {
    const params = { id: 1 };
    const data = { status: 'completed' };

    // Mock the implementation of order.update to simulate an error
    order.update.mockImplementation(() => {
      throw new Error('Simulated error');
    });

    // Spy on console.log to check for the finally block execution
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await updateOrder(params, data);

    expect(consoleLogSpy).toHaveBeenCalledWith('Update route called');

    // Restore console.log
    consoleLogSpy.mockRestore();
  });
});
