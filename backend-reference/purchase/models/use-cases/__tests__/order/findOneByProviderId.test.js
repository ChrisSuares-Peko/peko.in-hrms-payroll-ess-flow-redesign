const order = require('../../../entities/order');
const { findOneByProviderId } = require('../../order');

jest.mock('../../../entities/order', () => ({
  findOne: jest.fn(),
}));

describe('findOneByProviderId', () => {
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should return order when providerId exists', async () => {
    const params = { providerId: 'PROV123' };
    const mockOrder = { id: 1, providerId: 'PROV123' };

    order.findOne.mockResolvedValue(mockOrder);

    const result = await findOneByProviderId(params);

    expect(order.findOne).toHaveBeenCalledWith({
      where: {
        providerId: params.providerId,
      },
    });

    expect(result).toEqual(mockOrder);
    expect(console.log).toHaveBeenCalledWith(
      'ORDER FIND BY PROVIDER ID ONE ROUTE CALLED'
    );
  });

  it('should return null when no order found', async () => {
    const params = { providerId: 'PROV999' };

    order.findOne.mockResolvedValue(null);

    const result = await findOneByProviderId(params);

    expect(order.findOne).toHaveBeenCalledWith({
      where: {
        providerId: params.providerId,
      },
    });

    expect(result).toBeNull();
    expect(console.log).toHaveBeenCalledWith(
      'ORDER FIND BY PROVIDER ID ONE ROUTE CALLED'
    );
  });

  it('should log error when exception occurs', async () => {
    const params = { providerId: 'FAIL' };
    const error = new Error('DB error');

    order.findOne.mockRejectedValue(error);

    const result = await findOneByProviderId(params);

    expect(console.log).toHaveBeenCalledWith(error);
    expect(console.log).toHaveBeenCalledWith(
      'ORDER FIND BY PROVIDER ID ONE ROUTE CALLED'
    );
    expect(result).toBeUndefined();
  });
});
