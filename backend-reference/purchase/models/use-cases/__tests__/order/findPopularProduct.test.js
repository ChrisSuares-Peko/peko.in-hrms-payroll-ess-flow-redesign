const { Op } = require('sequelize');
const order = require('../../../entities/order');
const serviceOperator = require('../../../entities/serviceOperator');
const { findPopularProduct } = require('../../order');

jest.mock('../../../entities/order', () => ({
  findAll: jest.fn(),
}));

jest.mock('../../../entities/serviceOperator', () => ({}));

describe('findPopularProduct', () => {
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should return top product IDs based on total quantity', async () => {
    const params = 'ECOMMERCE';

    order.findAll.mockResolvedValue([
      {
        orderResponse: JSON.stringify({
          products: [
            { productId: 'P1', productQuantity: 2 },
            { productId: 'P2', productQuantity: 1 },
          ],
        }),
      },
      {
        orderResponse: JSON.stringify({
          products: [
            { productId: 'P1', productQuantity: 3 },
            { productId: 'P3', productQuantity: 5 },
          ],
        }),
      },
      {
        orderResponse: JSON.stringify({
          products: [
            { productId: 'P2', productQuantity: 4 },
          ],
        }),
      },
    ]);

    const result = await findPopularProduct(params);

    expect(order.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: serviceOperator,
          attributes: ['accessKey'],
          where: {
            accessKey: params,
          },
        },
      ],
      attributes: ['status', 'orderResponse'],
      where: {
        status: 'SUCCESS',
        orderResponse: {
          [Op.not]: null,
        },
      },
    });

    // Quantities:
    // P1 -> 5, P2 -> 5, P3 -> 5
    expect(result).toEqual(['P1', 'P2', 'P3']);

    expect(console.log).toHaveBeenCalledWith(
      'FIND POPULAR PRODUCTS ROUTE CALLED'
    );
  });

  it('should return empty array when no orders are found', async () => {
    order.findAll.mockResolvedValue([]);

    const result = await findPopularProduct('ECOMMERCE');

    expect(result).toEqual([]);

    expect(console.log).toHaveBeenCalledWith(
      'FIND POPULAR PRODUCTS ROUTE CALLED'
    );
  });

  it('should correctly limit results to top 8 products', async () => {
    const orders = [];

    for (let i = 1; i <= 10; i++) {
      orders.push({
        orderResponse: JSON.stringify({
          products: [
            { productId: `P${i}`, productQuantity: i },
          ],
        }),
      });
    }

    order.findAll.mockResolvedValue(orders);

    const result = await findPopularProduct('ECOMMERCE');

    expect(result.length).toBe(8);
    expect(result[0]).toBe('P10'); // highest quantity
  });

  it('should log error and return undefined when query fails', async () => {
    const error = new Error('DB failure');

    order.findAll.mockRejectedValue(error);

    const result = await findPopularProduct('ECOMMERCE');

    expect(console.log).toHaveBeenCalledWith(error);
    expect(console.log).toHaveBeenCalledWith(
      'FIND POPULAR PRODUCTS ROUTE CALLED'
    );

    expect(result).toBeUndefined();
  });
});
