const { Op } = require('sequelize');
const order = require('../../../entities/order');
const serviceOperator = require('../../../entities/serviceOperator');
const { findPopularGiftCards } = require('../../order');

jest.mock('../../../entities/order', () => ({
  findAll: jest.fn(),
}));

jest.mock('../../../entities/serviceOperator', () => ({}));

describe('findPopularGiftCards', () => {
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should return top gift card IDs ordered by usage count', async () => {
    const params = ['AMAZON', 'FLIPKART'];

    order.findAll.mockResolvedValue([
      {
        orderResponse: JSON.stringify({
          body: { giftCardId: 'GC1' },
        }),
      },
      {
        orderResponse: JSON.stringify({
          body: { giftCardId: 'GC2' },
        }),
      },
      {
        orderResponse: JSON.stringify({
          body: { giftCardId: 'GC1' },
        }),
      },
      {
        orderResponse: JSON.stringify({
          body: { giftCardId: 'GC3' },
        }),
      },
      {
        orderResponse: JSON.stringify({
          body: { giftCardId: 'GC1' },
        }),
      },
    ]);

    const result = await findPopularGiftCards(params);

    expect(order.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: serviceOperator,
          attributes: ['accessKey'],
          where: {
            accessKey: {
              [Op.in]: params,
            },
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

    expect(result).toEqual(['GC1', 'GC2', 'GC3']);

    expect(console.log).toHaveBeenCalledWith(
      'FIND POPULAR GIFTCARDS ROUTE CALLED'
    );
  });

  it('should return empty array when no orders are found', async () => {
    order.findAll.mockResolvedValue([]);

    const result = await findPopularGiftCards(['AMAZON']);

    expect(result).toEqual([]);

    expect(console.log).toHaveBeenCalledWith(
      'FIND POPULAR GIFTCARDS ROUTE CALLED'
    );
  });

  it('should handle JSON parsing safely for valid inputs', async () => {
    order.findAll.mockResolvedValue([
      {
        orderResponse: JSON.stringify({
          body: { giftCardId: 'ONLY_ONE' },
        }),
      },
    ]);

    const result = await findPopularGiftCards(['FLIPKART']);

    expect(result).toEqual(['ONLY_ONE']);
  });

  it('should log error and return undefined on failure', async () => {
    const error = new Error('DB error');

    order.findAll.mockRejectedValue(error);

    const result = await findPopularGiftCards(['AMAZON']);

    expect(console.log).toHaveBeenCalledWith(error);
    expect(console.log).toHaveBeenCalledWith(
      'FIND POPULAR GIFTCARDS ROUTE CALLED'
    );

    expect(result).toBeUndefined();
  });
});
