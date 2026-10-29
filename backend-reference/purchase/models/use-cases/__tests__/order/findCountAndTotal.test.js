const { Op } = require('sequelize');
const orders = require('../../../entities/order');
const serviceOperator = require('../../../entities/serviceOperator');
const { findCountAndTotal } = require('../../order');

jest.mock('../../../entities/order', () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock('../../../entities/serviceOperator', () => ({}));

describe('findCountAndTotal', () => {
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should return count and rows for successful orders', async () => {
    const param = '123';

    const mockResult = {
      count: 2,
      rows: [
        {
          id: 1,
          credentialId: '123',
          status: 'SUCCESS',
        },
        {
          id: 2,
          credentialId: '123',
          status: 'SUCCESS',
        },
      ],
    };

    orders.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findCountAndTotal(param);

    expect(orders.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: serviceOperator,
          where: {
            accessKey: 'carbon_footprint',
          },
        },
      ],
      where: {
        credentialId: {
          [Op.like]: `%${param}%`,
        },
        status: {
          [Op.like]: '%SUCCESS%',
        },
      },
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockResult);
  });

  it('should return empty result when no orders are found', async () => {
    const param = '999';

    const mockResult = {
      count: 0,
      rows: [],
    };

    orders.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findCountAndTotal(param);

    expect(result).toEqual(mockResult);
  });

  it('should handle errors and log them', async () => {
    const error = new Error('DB failure');

    orders.findAndCountAll.mockRejectedValue(error);

    const result = await findCountAndTotal('FAIL');

    expect(console.log).toHaveBeenCalledWith(error);
    expect(result).toBeUndefined();
  });
});
