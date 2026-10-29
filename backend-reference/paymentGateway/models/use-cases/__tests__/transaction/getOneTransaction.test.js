const { getOneTransaction } = require('../../transaction');
const transaction = require('../../../entities/transaction');

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

describe('transaction - getOneTransaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return transaction with includes when found', async () => {
    const mockResult = { id: 1, corporateTxnId: 'TXN123', order: { id: 1 }, serviceOperator: { serviceProvider: 'Test' } };
    transaction.findOne.mockResolvedValue(mockResult);

    const result = await getOneTransaction({ transactionId: 'TXN123' });

    expect(transaction.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { corporateTxnId: 'TXN123' },
      })
    );
    expect(result).toEqual(mockResult);
  });

  it('should return null when not found', async () => {
    transaction.findOne.mockResolvedValue(null);

    const result = await getOneTransaction({ transactionId: 'NONEXISTENT' });

    expect(result).toBeNull();
  });

  it('should handle errors and return undefined', async () => {
    transaction.findOne.mockRejectedValue(new Error('DB Error'));

    const result = await getOneTransaction({ transactionId: 'TXN_ERR' });

    expect(result).toBeUndefined();
  });

  it('should log finally message', async () => {
    transaction.findOne.mockResolvedValue(null);

    await getOneTransaction({ transactionId: 'TXN123' });

    expect(console.log).toHaveBeenCalledWith('TRANSACTION FIND ONE ROUTE CALLED');
  });
});
