const { createTransaction } = require('../../transaction'); // Replace with the correct path
const transaction = require('../../../entities/transaction'); // Replace with the correct path

jest.mock('../../../entities/transaction'); // Mock the transaction model

describe('createTransaction', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks between tests
  });

  it('should create a transaction successfully', async () => {
    const mockParams = {
      userId: 1,
      amount: 100,
      serviceProvider: 'TestProvider',
      status: 'Pending',
    };

    const mockResponse = {
      id: 1,
      ...mockParams,
      createdAt: new Date(),
    };

    transaction.create.mockResolvedValue(mockResponse); // Mock successful creation

    const result = await createTransaction(mockParams);

    // Assertions
    expect(transaction.create).toHaveBeenCalledTimes(1);
    expect(transaction.create).toHaveBeenCalledWith(mockParams);
    expect(result).toEqual(mockResponse);
  });

  it('should log an error if transaction creation fails', async () => {
    const mockParams = {
      userId: 1,
      amount: 100,
      serviceProvider: 'TestProvider',
      status: 'Pending',
    };

    const mockError = new Error('Database error');
    transaction.create.mockRejectedValue(mockError); // Mock error

    console.log = jest.fn(); // Mock console.log

    const result = await createTransaction(mockParams);

    // Assertions
    expect(transaction.create).toHaveBeenCalledTimes(1);
    expect(transaction.create).toHaveBeenCalledWith(mockParams);
    expect(console.log).toHaveBeenCalledWith('Database error');
    expect(result).toBeUndefined(); // Should return undefined on error
  });

  it('should log the final message regardless of the outcome', async () => {
    const mockParams = {
      userId: 1,
      amount: 100,
      serviceProvider: 'TestProvider',
      status: 'Pending',
    };

    transaction.create.mockResolvedValue({}); // Mock successful creation
    console.log = jest.fn(); // Mock console.log

    await createTransaction(mockParams);

    // Assertions
    expect(console.log).toHaveBeenCalledWith('TRANSACTION CREATE ROUTE CALLED');
  });
});
