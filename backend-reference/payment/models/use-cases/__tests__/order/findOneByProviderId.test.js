const {findOneByProviderId} = require('../../order'); 
const order = require('../../../entities/order');
jest.mock('../../../entities/order', () => ({
  findOne: jest.fn()
}));
jest.mock('../../../entities/transaction', () => ({
  belongsTo: jest.fn(),
  }));

  describe('findOneByProviderId', () => {
    beforeEach(() => {
      jest.clearAllMocks(); // Clear mocks before each test
      jest.spyOn(console, 'log').mockImplementation(() => {}); // Mock console.log
    });
  

  it('should return the order when found successfully', async () => {
    // Arrange
    const params = { providerId: 'provider123' };
    const mockOrder = { id: 1, providerId: 'provider123' };
    order.findOne.mockResolvedValue(mockOrder); // Mock successful find

    // Act
    const result = await findOneByProviderId(params);

    // Assert
    expect(result).toEqual(mockOrder);
    expect(order.findOne).toHaveBeenCalledWith({
      where: {
        providerId: params.providerId,
      },
    });
    expect(order.findOne).toHaveBeenCalledTimes(1);
  });

  it('should handle errors correctly', async () => {
    // Arrange
    const params = { providerId: 'provider123' };
    const errorMessage = "Error finding order";
    order.findOne.mockRejectedValue(new Error(errorMessage)); // Mock error

    // Act
    const result = await findOneByProviderId(params);

    // Assert
    expect(result).toBeUndefined(); // Assuming the function does not return anything on error
    expect(order.findOne).toHaveBeenCalledWith({
      where: {
        providerId: params.providerId,
      },
    });
    expect(order.findOne).toHaveBeenCalledTimes(1);
    // You can also check if the error is logged
  });

  it('should log "ORDER FIND BY PROVIDER ID ONE ROUTE CALLED" in the finally block', async () => {
    // Arrange
    const params = { providerId: 'provider123' };
    const mockOrder = { id: 1, providerId: 'provider123' };
    order.findOne.mockResolvedValue(mockOrder); // Mock successful find

    //console.log = jest.fn(); // Mock console.log

    // Act
    await findOneByProviderId(params);

    // Assert
    expect(console.log).toHaveBeenCalledWith("ORDER FIND BY PROVIDER ID ONE ROUTE CALLED");
  });
});
