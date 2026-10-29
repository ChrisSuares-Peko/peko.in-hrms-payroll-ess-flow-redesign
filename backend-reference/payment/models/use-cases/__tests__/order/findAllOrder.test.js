const {findAllOrder} = require('../../order'); 
const order = require('../../../entities/order');
// Mock the order.findAll method
jest.mock('../../../entities/order', () => ({
  findAll: jest.fn()
}));
jest.mock('../../../entities/transaction', () => ({
  belongsTo: jest.fn(),
  }));
describe('findAllOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
  });

  it('should find all orders successfully', async () => {
    // Arrange
    const params = { orderId: 'order123' };
    const mockOrders = [
      { id: 1, orderId: 'order123', amount: 100.00 },
      { id: 2, orderId: 'order123', amount: 150.00 }
    ]; // Example orders array
    order.findAll.mockResolvedValue(mockOrders); // Mock successful find

    // Act
    const result = await findAllOrder(params);

    // Assert
    expect(result).toEqual(mockOrders);
    expect(order.findAll).toHaveBeenCalledWith({
      where: {
        orderId: params.orderId,
      },
    });
    expect(order.findAll).toHaveBeenCalledTimes(1);
  });

  it('should handle errors correctly', async () => {
    // Arrange
    const params = { orderId: 'order123' };
    const errorMessage = 'Error finding orders';
    order.findAll.mockRejectedValue(new Error(errorMessage)); // Mock error

    // Act
    const result = await findAllOrder(params);

    // Assert
    expect(result).toBeUndefined(); // Assuming findAllOrder does not return anything on error
    expect(order.findAll).toHaveBeenCalledWith({
      where: {
        orderId: params.orderId,
      },
    });
    expect(order.findAll).toHaveBeenCalledTimes(1);
    // You can also check if the error is logged
  });
});
