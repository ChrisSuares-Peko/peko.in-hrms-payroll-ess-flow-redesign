const order = require('../../../entities/order');
const {findOneOrder} = require('../../order'); 

// Mock the order.findOne method
jest.mock('../../../entities/order', () => ({
  findOne: jest.fn()
}));

describe('findOneOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
  });

  it('should find an order successfully', async () => {
    // Arrange
    const params = { corporateTxnId: 'txn123' };
    const mockOrder = { id: 1, corporateTxnId: 'txn123', amount: 100.00 }; // Example order object
    order.findOne.mockResolvedValue(mockOrder); // Mock successful find

    // Act
    const result = await findOneOrder(params);

    // Assert
    expect(result).toEqual(mockOrder);
    expect(order.findOne).toHaveBeenCalledWith({
      where: {
        corporateTxnId: params.corporateTxnId,
      },
    });
    expect(order.findOne).toHaveBeenCalledTimes(1);
  });

  it('should handle errors correctly', async () => {
    // Arrange
    const params = { corporateTxnId: 'txn123' };
    const errorMessage = 'Error finding order';
    order.findOne.mockRejectedValue(new Error(errorMessage)); // Mock error

    // Act
    const result = await findOneOrder(params);

    // Assert
    expect(result).toBeUndefined(); // Assuming findOneOrder does not return anything on error
    expect(order.findOne).toHaveBeenCalledWith({
      where: {
        corporateTxnId: params.corporateTxnId,
      },
    });
    expect(order.findOne).toHaveBeenCalledTimes(1);
    // You can also check if the error is logged
  });
});
