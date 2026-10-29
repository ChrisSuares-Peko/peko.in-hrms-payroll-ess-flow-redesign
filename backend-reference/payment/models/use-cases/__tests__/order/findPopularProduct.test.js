const { findPopularProduct } = require('../../order');
const order = require("../../../entities/order");
const serviceOperator = require("../../../entities/serviceOperator");
const { Op } = require("sequelize");
jest.mock('../../../entities/order', () => ({
  findAll: jest.fn(),
}));
jest.mock('../../../entities/serviceOperator', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../entities/transaction', () => ({
    belongsTo: jest.fn(),
  }));
describe('findPopularProduct', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the top eight popular product IDs', async () => {
    // Arrange
    const params = ['key1', 'key2'];
    const mockOrdersData = [
      {
        orderResponse: JSON.stringify({
          products: [
            { productId: 'product1', productQuantity: 10 },
            { productId: 'product2', productQuantity: 5 },
          ],
        }),
      },
      {
        orderResponse: JSON.stringify({
          products: [
            { productId: 'product1', productQuantity: 15 },
            { productId: 'product3', productQuantity: 8 },
          ],
        }),
      },
      {
        orderResponse: JSON.stringify({
          products: [
            { productId: 'product2', productQuantity: 7 },
            { productId: 'product4', productQuantity: 3 },
          ],
        }),
      },
    ];

    order.findAll.mockResolvedValue(mockOrdersData);
    console.log = jest.fn(); // Mock console.log

    // Act
    const result = await findPopularProduct(params);

    // Assert
    expect(result).toEqual(['product1', 'product2', 'product3', 'product4']);
    expect(order.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: serviceOperator,
          attributes: ["accessKey"],
          where: {
            accessKey: params,
          },
        },
      ],
      attributes: ["status", "orderResponse"],
      where: {
        status: "SUCCESS",
        orderResponse: {
          [Op.not]: null,
        },
      },
    });
    expect(console.log).toHaveBeenCalledWith("FIND POPULAR GIFTCARDS ROUTE CALLED");
  });
});
it('should handle errors and log them', async () => {
    // Arrange
    const params = ['key1', 'key2'];
    const errorMessage = 'Error retrieving orders';
    order.findAll.mockRejectedValue(new Error(errorMessage));
    console.log = jest.fn(); // Mock console.log
  
    // Act
    const result = await findPopularProduct(params);
  
    // Assert
    expect(result).toBeUndefined(); // Or handle as per your actual implementation
    expect(console.log).toHaveBeenCalledWith(new Error(errorMessage));
    expect(console.log).toHaveBeenCalledWith("FIND POPULAR GIFTCARDS ROUTE CALLED");
  });
  it('should log FIND POPULAR GIFTCARDS ROUTE CALLED', async () => {
    // Arrange
    const params = ['key1', 'key2'];
    const mockOrdersData = [
      {
        orderResponse: JSON.stringify({
          products: [
            { productId: 'product1', productQuantity: 10 },
            { productId: 'product2', productQuantity: 5 },
          ],
        }),
      },
    ];
  
    order.findAll.mockResolvedValue(mockOrdersData);
    console.log = jest.fn(); // Mock console.log
  
    // Act
    await findPopularProduct(params);
  
    // Assert
    expect(console.log).toHaveBeenCalledWith("FIND POPULAR GIFTCARDS ROUTE CALLED");
  });
    