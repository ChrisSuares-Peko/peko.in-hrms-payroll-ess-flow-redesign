const { findAllTransaction } = require('../../transaction'); // Replace with the correct path
const transaction = require('../../../entities/transaction'); // Replace with the correct path

jest.mock('../../../entities/transaction'); // Mock the transaction model

describe('findAllTransaction', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks between tests
  });

  it('should retrieve all transactions successfully', async () => {
    const mockParams = { corporateId: 1 };

    const mockResponse = [
      { id: 1, credentialId: 1, amount: 100, status: 'Completed' },
      { id: 2, credentialId: 1, amount: 200, status: 'Pending' },
    ];

    transaction.findAll.mockResolvedValue(mockResponse); // Mock successful findAll

    console.log = jest.fn(); // Mock console.log

    const result = await findAllTransaction(mockParams);

    // Assertions
    expect(transaction.findAll).toHaveBeenCalledTimes(1);
    expect(transaction.findAll).toHaveBeenCalledWith({
      where: {
        credentialId: 1,
      },
    });
    expect(result).toEqual(mockResponse);
    expect(console.log).toHaveBeenCalledWith('TRANSACTION FIND ALL ROUTE CALLED');
  });

  it('should handle errors gracefully', async () => {
    const mockParams = { corporateId: 1 };
    const mockError = new Error('Database error');

    transaction.findAll.mockRejectedValue(mockError); // Mock error

    console.log = jest.fn(); // Mock console.log

    const result = await findAllTransaction(mockParams);

    // Assertions
    expect(transaction.findAll).toHaveBeenCalledTimes(1);
    expect(transaction.findAll).toHaveBeenCalledWith({
      where: {
        credentialId: 1,
      },
    });
    expect(result).toBeUndefined(); // Should return undefined on error
    expect(console.log).toHaveBeenCalledWith(mockError); // Ensure error is logged
    expect(console.log).toHaveBeenCalledWith('TRANSACTION FIND ALL ROUTE CALLED'); // Ensure final log is called
  });

  it('should always log the final message', async () => {
    const mockParams = { corporateId: 1 };

    transaction.findAll.mockResolvedValue([]); // Mock no result

    console.log = jest.fn(); // Mock console.log

    await findAllTransaction(mockParams);

    // Assertions
    expect(console.log).toHaveBeenCalledWith('TRANSACTION FIND ALL ROUTE CALLED');
  });
});
