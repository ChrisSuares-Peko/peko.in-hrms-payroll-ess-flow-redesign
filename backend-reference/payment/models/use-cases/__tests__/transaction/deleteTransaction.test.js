const { deleteTransaction } = require('../../transaction'); // Replace with the correct path
const transaction = require('../../../entities/transaction'); // Replace with the correct path

jest.mock('../../../entities/transaction'); // Mock the transaction model

describe('deleteTransaction', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks between tests
  });

  it('should delete a transaction successfully', async () => {
    const mockParams = { tranId: 123 };
    transaction.destroy.mockResolvedValue(1); // Mock successful deletion (returns 1)

    console.log = jest.fn(); // Mock console.log

    const result = await deleteTransaction(mockParams);

    // Assertions
    expect(transaction.destroy).toHaveBeenCalledTimes(1);
    expect(transaction.destroy).toHaveBeenCalledWith({
      where: {
        tranId: 123,
      },
    });
    expect(result).toBe(1); // Ensure the result matches the mock return value
    expect(console.log).toHaveBeenCalledWith('TRANSACTION DELETE ROUTE CALLED');
  });


  it('should always log the final message', async () => {
    const mockParams = { tranId: 123 };

    transaction.destroy.mockResolvedValue(0); // Mock no deletion (returns 0)

    console.log = jest.fn(); // Mock console.log

    await deleteTransaction(mockParams);

    // Assertions
    expect(console.log).toHaveBeenCalledWith('TRANSACTION DELETE ROUTE CALLED');
  });
});
