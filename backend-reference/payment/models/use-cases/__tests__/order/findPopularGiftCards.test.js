const { findPopularGiftCards } = require('../../order');
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
describe('findPopularGiftCards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the top eight popular gift card IDs', async () => {
    // Arrange
    const params = ['key1', 'key2'];
    const mockOrdersData = [
      {
        orderResponse: JSON.stringify({
          body: {
            giftCardId: 'card1',
          },
        }),
      },
      {
        orderResponse: JSON.stringify({
          body: {
            giftCardId: 'card2',
          },
        }),
      },
      {
        orderResponse: JSON.stringify({
          body: {
            giftCardId: 'card1',
          },
        }),
      },
    ];

    order.findAll.mockResolvedValue(mockOrdersData);
    console.log = jest.fn(); // Mock console.log

    // Act
    const result = await findPopularGiftCards(params);

    // Assert
    expect(result).toEqual(['card1', 'card2']);
    expect(order.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: serviceOperator,
          attributes: ["accessKey"],
          where: {
            accessKey: {
              [Op.in]: params,
            },
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
    const result = await findPopularGiftCards(params);
  
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
          body: {
            giftCardId: 'card1',
          },
        }),
      },
    ];
  
    order.findAll.mockResolvedValue(mockOrdersData);
    console.log = jest.fn(); // Mock console.log
  
    // Act
    await findPopularGiftCards(params);
  
    // Assert
    expect(console.log).toHaveBeenCalledWith("FIND POPULAR GIFTCARDS ROUTE CALLED");
  });
    