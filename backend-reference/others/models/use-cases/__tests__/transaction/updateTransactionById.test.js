const { updateTransactionById } = require('../../transaction'); 
const transaction = require("../../../entities/transaction");

describe('updateTransactionById', () => {
  const mockTransactionId = 1;
  const mockData = { status: 'Success', amount: 200 };

  beforeEach(() => {
    jest.clearAllMocks(); // Clears all mocks before each test
  });

  it('should update the transaction when called with valid data', async () => {
    // Mocking the update method to simulate a successful update
    const mockUpdateResponse = [1]; // Sequelize returns an array where the first element is the number of affected rows
    transaction.update.mockResolvedValue(mockUpdateResponse);

    const result = await updateTransactionById(mockTransactionId, mockData);

    expect(result).toEqual(mockUpdateResponse);
    expect(transaction.update).toHaveBeenCalledWith(mockData, {
      where: {
        id: mockTransactionId,
      },
    });
  });

  it('should return error if update fails', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log');
    
    // Simulating an error during the update operation
    transaction.update.mockRejectedValue(new Error('Database error'));

    await updateTransactionById(mockTransactionId, mockData);

    // Check that the error is logged
    expect(consoleLogSpy).toHaveBeenCalledWith('Database error');
    expect(transaction.update).toHaveBeenCalledWith(mockData, {
      where: {
        id: mockTransactionId,
      },
    });
  });

  it('should log "TRANSACTION CREATE ROUTE CALLED" after execution', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log');
    
    // Mocking the update method to simulate a successful update
    const mockUpdateResponse = [1];
    transaction.update.mockResolvedValue(mockUpdateResponse);

    await updateTransactionById(mockTransactionId, mockData);

    // Check that the final log message is called
    expect(consoleLogSpy).toHaveBeenCalledWith('TRANSACTION CREATE ROUTE CALLED');
  });
});
