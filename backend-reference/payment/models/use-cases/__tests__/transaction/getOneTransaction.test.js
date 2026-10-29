const { getOneTransaction } = require('../../transaction'); // Replace with the correct path
const transaction = require('../../../entities/transaction'); // Replace with the correct path
const orders = require('../../../entities/order'); // Replace with the correct path
const serviceOperator = require('../../../entities/serviceOperator'); // Replace with the correct path

jest.mock('../../../entities/transaction'); // Mock the transaction model
jest.mock('../../../entities/order'); // Mock the orders model
jest.mock('../../../entities/serviceOperator'); // Mock the serviceOperator model

describe('getOneTransaction', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks between tests
  });

  it('should retrieve a transaction successfully', async () => {
    const mockParams = { transactionId: 'TXN123' };

    const mockResponse = {
      id: 1,
      corporateTxnId: 'TXN123',
      orders: { id: 1, orderNumber: 'ORD123' },
      serviceOperator: { serviceProvider: 'Test Service Provider' },
    };

    transaction.findOne.mockResolvedValue(mockResponse); // Mock successful find

    console.log = jest.fn(); // Mock console.log

    const result = await getOneTransaction(mockParams);

    // Assertions
    expect(transaction.findOne).toHaveBeenCalledTimes(1);
    expect(transaction.findOne).toHaveBeenCalledWith({
      include: [
        {
          model: orders,
        },
        {
          model: serviceOperator,
          attributes: ['serviceProvider'],
        },
      ],
      where: {
        corporateTxnId: 'TXN123',
      },
    });
    expect(result).toEqual(mockResponse);
    expect(console.log).toHaveBeenCalledWith('TRANSACTION FIND ONE ROUTE CALLED');
  });

  it('should log an error if transaction lookup fails', async () => {
    const mockParams = { transactionId: 'TXN123' };
    const mockError = new Error('Database error');

    transaction.findOne.mockRejectedValue(mockError); // Mock error

    console.log = jest.fn(); // Mock console.log

    const result = await getOneTransaction(mockParams);

    // Assertions
    expect(transaction.findOne).toHaveBeenCalledTimes(1);
    expect(transaction.findOne).toHaveBeenCalledWith({
      include: [
        {
          model: orders,
        },
        {
          model: serviceOperator,
          attributes: ['serviceProvider'],
        },
      ],
      where: {
        corporateTxnId: 'TXN123',
      },
    });
    expect(result).toBeUndefined(); // Should return undefined on error
    expect(console.log).toHaveBeenCalledWith(mockError); // Ensure error is logged
    expect(console.log).toHaveBeenCalledWith('TRANSACTION FIND ONE ROUTE CALLED'); // Ensure final log is called
  });

  it('should always log the final message', async () => {
    const mockParams = { transactionId: 'TXN123' };

    transaction.findOne.mockResolvedValue(null); // Mock no result

    console.log = jest.fn(); // Mock console.log

    await getOneTransaction(mockParams);

    // Assertions
    expect(console.log).toHaveBeenCalledWith('TRANSACTION FIND ONE ROUTE CALLED');
  });
});
