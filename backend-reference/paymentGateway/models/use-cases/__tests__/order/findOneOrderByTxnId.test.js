const { findOneOrderByTxnId } = require('../../order');
const order = require('../../../entities/order');

jest.mock('../../../entities/order', () => ({
  findOne: jest.fn(),
  sum: jest.fn(),
  update: jest.fn(),
  findByPk: jest.fn(),
}));

describe('findOneOrderByTxnId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return the order when found by corporateTxnId', async () => {
    const mockOrder = { id: 1, corporateTxnId: 'TXN123' };
    order.findOne.mockResolvedValue(mockOrder);

    const result = await findOneOrderByTxnId('TXN123');

    expect(order.findOne).toHaveBeenCalledWith({
      where: { corporateTxnId: 'TXN123' },
    });
    expect(result).toEqual(mockOrder);
  });

  it('should return null when order not found', async () => {
    order.findOne.mockResolvedValue(null);

    const result = await findOneOrderByTxnId('NONEXISTENT');

    expect(result).toBeNull();
  });

  it('should handle errors and return undefined', async () => {
    order.findOne.mockRejectedValue(new Error('DB Error'));

    const result = await findOneOrderByTxnId('TXN_ERR');

    expect(result).toBeUndefined();
  });

  it('should log the finally message', async () => {
    order.findOne.mockResolvedValue(null);

    await findOneOrderByTxnId('TXN123');

    expect(console.log).toHaveBeenCalledWith('ORDER FIND ONE ROUTE CALLED');
  });
});
