const {deleteOrder} = require('../../order'); 
const order = require('../../../entities/order');
// Mock the order.destroy method
jest.mock('../../../entities/order', () => ({
  destroy: jest.fn()
}));
jest.mock('../../../entities/transaction', () => ({
  belongsTo: jest.fn(),
  }));
describe('deleteOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
  });

  it('should delete an order successfully', async () => {
    // Arrange
    const params = { orderId: 'order123' };
    order.destroy.mockResolvedValue(1); // Mock successful deletion (1 row affected)

    // Act
    const result = await deleteOrder(params);

    // Assert
    expect(result).toBe(1);
    expect(order.destroy).toHaveBeenCalledWith({
      where: {
        orderId: params.orderId,
      },
    });
    expect(order.destroy).toHaveBeenCalledTimes(1);
  });

  it('should handle errors correctly', async () => {
    // Arrange
    const params = { orderId: 'order123' };
    const errorMessage = "Error deleting order";
    order.destroy.mockRejectedValue(new Error(errorMessage)); // Mock error

    // Act
    const result = await deleteOrder(params);

    // Assert
    expect(result).toBeUndefined(); // Assuming deleteOrder does not return anything on error
    expect(order.destroy).toHaveBeenCalledWith({
      where: {
        orderId: params.orderId,
      },
    });
    expect(order.destroy).toHaveBeenCalledTimes(1);
  });
});
