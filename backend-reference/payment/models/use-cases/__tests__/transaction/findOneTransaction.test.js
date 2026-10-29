const { findOneTransaction } = require('../../transaction'); // Replace with the correct path
const transaction = require('../../../entities/transaction'); // Replace with the correct path
const credential = require('../../../entities/credential'); // Replace with the correct path
const orders = require('../../../entities/order'); // Replace with the correct path

jest.mock('../../../entities/transaction'); // Mock the transaction model
jest.mock('../../../entities/credential'); // Mock the credential model
jest.mock('../../../entities/order'); // Mock the orders model

describe('findOneTransaction', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks between tests
  });

  it('should find a transaction successfully', async () => {
    const mockParams = {
      corporateTxnId: 'TXN123',
    };

    const mockResponse = {
      id: 1,
      corporateTxnId: 'TXN123',
      credentials: { id: 1, name: 'Test Credential' },
      orders: { id: 1, orderNumber: 'ORD123' },
    };

    transaction.findOne.mockResolvedValue(mockResponse); // Mock successful find

    console.log = jest.fn(); // Mock console.log

    const result = await findOneTransaction(mockParams);

    // Assertions
    expect(console.log).toHaveBeenCalledWith('TXN123'); // Check console log for corporateTxnId
    expect(transaction.findOne).toHaveBeenCalledTimes(1);
    expect(transaction.findOne).toHaveBeenCalledWith({
      where: {
        corporateTxnId: 'TXN123',
      },
      include: [
        {
          model: credential,
          required: false,
        },
        {
          model: orders,
          required: false,
        },
      ],
    });
    expect(result).toEqual(mockResponse);
  });

  it('should log an error if transaction lookup fails', async () => {
    const mockParams = {
      corporateTxnId: 'TXN123',
    };

    const mockError = new Error('Database error');
    transaction.findOne.mockRejectedValue(mockError); // Mock error

    console.log = jest.fn(); // Mock console.log

    const result = await findOneTransaction(mockParams);

    // Assertions
    expect(console.log).toHaveBeenCalledWith(mockError); // Check error log
    expect(transaction.findOne).toHaveBeenCalledTimes(1);
    expect(result).toBeUndefined(); // Should return undefined on error
  });

  it('should log the final message regardless of the outcome', async () => {
    const mockParams = {
      corporateTxnId: 'TXN123',
    };

    transaction.findOne.mockResolvedValue({}); // Mock successful find
    console.log = jest.fn(); // Mock console.log

    await findOneTransaction(mockParams);

    // Assertions
    expect(console.log).toHaveBeenCalledWith('TRANSACTION FIND ONE ROUTE CALLED');
  });
});
