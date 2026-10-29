const order = require('../../../entities/order');
const { findOneOrderById } = require('../../order');

jest.mock('../../../entities/order', () => ({
  findOne: jest.fn(),
}));

describe('findOneOrderById', () => {
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should return order when found by id', async () => {
    const mockOrder = {
      id: 1,
      status: 'SUCCESS',
    };

    order.findOne.mockResolvedValue(mockOrder);

    const result = await findOneOrderById(1);

    expect(order.findOne).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    });

    expect(result).toEqual(mockOrder);

    expect(console.log).toHaveBeenCalledWith(
      'ORDER FIND ONE ROUTE CALLED'
    );
  });

  it('should return null when no order is found', async () => {
    order.findOne.mockResolvedValue(null);

    const result = await findOneOrderById(999);

    expect(result).toBeNull();

    expect(console.log).toHaveBeenCalledWith(
      'ORDER FIND ONE ROUTE CALLED'
    );
  });

  it('should log error and return undefined when exception occurs', async () => {
    const error = new Error('DB error');

    order.findOne.mockRejectedValue(error);

    const result = await findOneOrderById(1);

    expect(console.log).toHaveBeenCalledWith(error);
    expect(console.log).toHaveBeenCalledWith(
      'ORDER FIND ONE ROUTE CALLED'
    );

    expect(result).toBeUndefined();
  });

  it('should scope the lookup to the owner when credentialId is passed', async () => {
    order.findOne.mockResolvedValue(null);

    const result = await findOneOrderById(1, 42);

    expect(order.findOne).toHaveBeenCalledWith({
      where: {
        id: 1,
        credentialId: 42,
      },
    });
    expect(result).toBeNull();
  });
});
