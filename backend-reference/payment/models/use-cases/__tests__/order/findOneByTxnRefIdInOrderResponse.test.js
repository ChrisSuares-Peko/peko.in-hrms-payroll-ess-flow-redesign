const { findOneByTxnRefIdInOrderResponse } = require('../../order');
const order = require('../../../entities/order');

jest.mock('../../../entities/order', () => ({
  findOne: jest.fn(),
}));
jest.mock('../../../entities/transaction', () => ({
  belongsTo: jest.fn(),
}));

describe('findOneByTxnRefIdInOrderResponse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return the order when found by txnRefId', async () => {
    const mockOrder = { id: 1, providerId: 'TXN_REF_123' };
    order.findOne.mockResolvedValue(mockOrder);

    const result = await findOneByTxnRefIdInOrderResponse('TXN_REF_123');

    expect(result).toEqual(mockOrder);
    expect(order.findOne).toHaveBeenCalledWith({
      where: {
        providerId: 'TXN_REF_123',
      },
    });
    expect(order.findOne).toHaveBeenCalledTimes(1);
  });

  it('should return null when no order is found', async () => {
    order.findOne.mockResolvedValue(null);

    const result = await findOneByTxnRefIdInOrderResponse('NON_EXISTENT');

    expect(result).toBeNull();
    expect(order.findOne).toHaveBeenCalledWith({
      where: {
        providerId: 'NON_EXISTENT',
      },
    });
  });

  it('should handle errors and return undefined', async () => {
    order.findOne.mockRejectedValue(new Error('DB Error'));

    const result = await findOneByTxnRefIdInOrderResponse('TXN_REF_ERR');

    expect(result).toBeUndefined();
    expect(order.findOne).toHaveBeenCalledTimes(1);
  });

  it('should log the final message in the finally block', async () => {
    order.findOne.mockResolvedValue({ id: 1 });

    await findOneByTxnRefIdInOrderResponse('TXN_REF_123');

    expect(console.log).toHaveBeenCalledWith('ORDER FIND BY TXN REF ID IN ORDER RESPONSE ROUTE CALLED');
  });
});
