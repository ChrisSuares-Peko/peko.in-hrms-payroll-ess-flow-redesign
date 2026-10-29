const { findOneOrderById } = require('../../order');
const order = require("../../../entities/order");

jest.mock('../../../entities/order', () => ({
  findOne: jest.fn(),
}));
jest.mock('../../../entities/transaction', () => ({
    belongsTo: jest.fn(),
  }));
describe('findOneOrderById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the order when found successfully', async () => {
    // Arrange
    const id = 1;
    const mockOrder = { id: 1, name: 'Test Order' }; // Mock order data
    order.findOne.mockResolvedValue(mockOrder);
    console.log = jest.fn(); // Mock console.log

    // Act
    const result = await findOneOrderById(id);

    // Assert
    expect(result).toEqual(mockOrder);
    expect(order.findOne).toHaveBeenCalledWith({
      where: {
        id,
      },
    });
    expect(console.log).toHaveBeenCalledWith("ORDER FIND ONE ROUTE CALLED");
  });
});
it('should handle errors and log them', async () => {
    // Arrange
    const id = 1;
    const errorMessage = 'Error finding order';
    order.findOne.mockRejectedValue(new Error(errorMessage));
    console.log = jest.fn(); // Mock console.log
  
    // Act
    const result = await findOneOrderById(id);
  
    // Assert
    expect(result).toBeUndefined(); // Function returns undefined on error
    expect(console.log).toHaveBeenCalledWith(new Error(errorMessage));
    expect(console.log).toHaveBeenCalledWith("ORDER FIND ONE ROUTE CALLED");
  });
  it('should log ORDER FIND ONE ROUTE CALLED', async () => {
    // Arrange
    const id = 1;
    const mockOrder = { id: 1, name: 'Test Order' };
    order.findOne.mockResolvedValue(mockOrder);
    console.log = jest.fn(); // Mock console.log
  
    // Act
    await findOneOrderById(id);
  
    // Assert
    expect(console.log).toHaveBeenCalledWith("ORDER FIND ONE ROUTE CALLED");
  });
    