const { updateTransaction } = require('../../transaction');
const transaction = require('../../../entities/transaction');

jest.mock('../../../entities/transaction');

describe('updateTransaction', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should update a transaction successfully', async () => {
    const mockParams = { tranId: 'TXN123' };
    transaction.update.mockResolvedValue([1]);

    console.log = jest.fn();

    const result = await updateTransaction(mockParams);

    expect(transaction.update).toHaveBeenCalledTimes(1);
    expect(transaction.update).toHaveBeenCalledWith({
      where: {
        tranId: 'TXN123',
      },
    });
    expect(result).toEqual([1]);
    expect(console.log).toHaveBeenCalledWith('TRANSACTION FIND ALL ROUTE CALLED');
  });

  it('should handle errors gracefully', async () => {
    const mockParams = { tranId: 'TXN123' };
    const mockError = new Error('Database error');
    transaction.update.mockRejectedValue(mockError);

    console.log = jest.fn();

    const result = await updateTransaction(mockParams);

    expect(transaction.update).toHaveBeenCalledTimes(1);
    expect(result).toBeUndefined();
    expect(console.log).toHaveBeenCalledWith(mockError);
  });

  it('should always log the final message', async () => {
    const mockParams = { tranId: 'TXN123' };
    transaction.update.mockResolvedValue([0]);

    console.log = jest.fn();

    await updateTransaction(mockParams);

    expect(console.log).toHaveBeenCalledWith('TRANSACTION FIND ALL ROUTE CALLED');
  });
});
