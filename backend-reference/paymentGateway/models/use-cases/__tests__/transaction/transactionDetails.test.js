const { transactionDetails } = require('../../transaction');
const orders = require('../../../entities/order');

jest.mock('../../../entities/transaction', () => ({
  findOne: jest.fn(),
  findAndCountAll: jest.fn(),
}));

jest.mock('../../../entities/order', () => ({
  findOne: jest.fn(),
  sum: jest.fn(),
}));

jest.mock('../../../entities/serviceOperator', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../entities/userCoupons', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../entities/credential', () => ({
  findOne: jest.fn(),
}));

describe('transaction - transactionDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return order details with includes', async () => {
    const mockResult = {
      id: 1,
      corporateTxnId: 'TXN123',
      serviceOperator: { serviceProvider: 'Airtel', accessKey: 'AK1' },
      couponData: { usedCouponData: {} },
    };
    orders.findOne.mockResolvedValue(mockResult);

    const result = await transactionDetails({ transactionId: 'TXN123' });

    expect(orders.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { corporateTxnId: 'TXN123' },
        raw: true,
        nest: true,
      })
    );
    expect(result).toEqual(mockResult);
  });

  it('should return null when not found', async () => {
    orders.findOne.mockResolvedValue(null);

    const result = await transactionDetails({ transactionId: 'NONEXISTENT' });

    expect(result).toBeNull();
  });

  it('should handle errors and return undefined', async () => {
    orders.findOne.mockRejectedValue(new Error('DB Error'));

    const result = await transactionDetails({ transactionId: 'TXN_ERR' });

    expect(result).toBeUndefined();
  });
});
