const { transactionDetails } = require('../../transaction');
const orders = require('../../../entities/order');

jest.mock('../../../entities/transaction');
jest.mock('../../../entities/order');

describe('transactionDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return order details with service operator when found', async () => {
    const mockParams = { transactionId: 'TXN123' };
    const mockOrder = {
      id: 1,
      corporateTxnId: 'TXN123',
      serviceOperator: { serviceProvider: 'Airtel' },
    };

    orders.findOne.mockResolvedValue(mockOrder);

    const result = await transactionDetails(mockParams);

    expect(orders.findOne).toHaveBeenCalledTimes(1);
    expect(orders.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { corporateTxnId: 'TXN123' },
      })
    );
    expect(result).toEqual(mockOrder);
  });

  it('should return null when no order is found', async () => {
    const mockParams = { transactionId: 'NON_EXISTENT' };
    orders.findOne.mockResolvedValue(null);

    const result = await transactionDetails(mockParams);

    expect(result).toBeNull();
  });

  it('should handle errors and return undefined', async () => {
    const mockParams = { transactionId: 'TXN_ERR' };
    orders.findOne.mockRejectedValue(new Error('DB Error'));

    const result = await transactionDetails(mockParams);

    expect(result).toBeUndefined();
  });

  it('should log the final message', async () => {
    const mockParams = { transactionId: 'TXN123' };
    orders.findOne.mockResolvedValue(null);

    await transactionDetails(mockParams);

    expect(console.log).toHaveBeenCalledWith('ORDER FIND ONE ROUTE CALLED');
  });
});
