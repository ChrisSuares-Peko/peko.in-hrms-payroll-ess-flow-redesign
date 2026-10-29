const { findOneTransaction } = require('../../transaction'); 
const transaction = require("../../../entities/transaction");

describe('findOneTransaction', () => {
  const mockParams = {
    corporateTxnId: '12345',
  };

  beforeEach(() => {
    jest.clearAllMocks(); // Clears all mocks before each test
  });

  it('should return a transaction when called with a valid corporateTxnId', async () => {
    // Mocking the successful response from the database
    const mockTransaction = {
      corporateTxnId: '12345',
      status: 'Success',
      amount: 100,
    };
    transaction.findOne.mockResolvedValue(mockTransaction);

    const result = await findOneTransaction(mockParams);

    expect(result).toEqual(mockTransaction);
    expect(transaction.findOne).toHaveBeenCalledWith({
      where: {
        corporateTxnId: '12345',
      },
      include: expect.any(Array),
    });
  });

  it('should return null if no transaction is found', async () => {
    // Simulating a case where no transaction is found
    transaction.findOne.mockResolvedValue(null);

    const result = await findOneTransaction(mockParams);

    expect(result).toBeNull();
    expect(transaction.findOne).toHaveBeenCalledWith({
      where: {
        corporateTxnId: '12345',
      },
      include: expect.any(Array),
    });
  });

  it('should log an error and return undefined if there is an error', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log');
    
    // Simulating an error in the database query
    transaction.findOne.mockRejectedValue(new Error('Database error'));

    await findOneTransaction(mockParams);

    // Check that the error is logged
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(Error));
    expect(consoleLogSpy).toHaveBeenCalledWith('TRANSACTION FIND ONE ROUTE CALLED');
    
    // Check that the function doesn't return a result
    expect(transaction.findOne).toHaveBeenCalledWith({
      where: {
        corporateTxnId: '12345',
      },
      include: expect.any(Array),
    });
  });

  it('should log "TRANSACTION FIND ONE ROUTE CALLED" after execution', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log');
    
    // Mocking successful database response
    const mockTransaction = {
      corporateTxnId: '12345',
      status: 'Success',
      amount: 100,
    };
    transaction.findOne.mockResolvedValue(mockTransaction);

    await findOneTransaction(mockParams);

    // Check that the final log message is called
    expect(consoleLogSpy).toHaveBeenCalledWith('TRANSACTION FIND ONE ROUTE CALLED');
  });
});
