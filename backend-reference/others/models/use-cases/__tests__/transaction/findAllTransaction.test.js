const { findAllTransaction } = require('../../transaction');
const transaction = require('../../../entities/transaction');

jest.mock('../../../entities/transaction', () => ({
  findAll: jest.fn(),
}));

describe('findAllTransaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call transaction.findAll with the correct parameters and return results', async () => {
    // Arrange
    const params = { corporateId: '123' };
    const mockData = [
      { id: '1', corporateId: '123', amount: '100.00' },
      { id: '2', corporateId: '123', amount: '200.00' },
    ];

    transaction.findAll.mockResolvedValue(mockData);

    // Act
    const result = await findAllTransaction(params);

    // Assert
    expect(transaction.findAll).toHaveBeenCalledWith({
      where: {
        credentialId: params.corporateId,
      },
    });

    expect(result).toEqual(mockData);
  });

  it('should handle errors and log them', async () => {
    // Arrange
    const params = { corporateId: '123' };
    const errorMessage = 'Database error';
    transaction.findAll.mockRejectedValue(new Error(errorMessage));
    
    // Use a spy to verify the console log
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Act
    const result = await findAllTransaction(params);

    // Assert
    expect(transaction.findAll).toHaveBeenCalledWith({
      where: {
        credentialId: params.corporateId,
      },
    });

    expect(result).toBeUndefined(); // Expect undefined due to error

    expect(consoleSpy).toHaveBeenCalledWith(new Error(errorMessage));
    expect(consoleSpy).toHaveBeenCalledWith('TRANSACTION FIND ALL ROUTE CALLED');

    consoleSpy.mockRestore();
  });

  it('should log "TRANSACTION FIND ALL ROUTE CALLED" even if there is no data', async () => {
    // Arrange
    const params = { corporateId: '123' };
    const mockData = [];

    transaction.findAll.mockResolvedValue(mockData);

    // Use a spy to verify the console log
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Act
    const result = await findAllTransaction(params);

    // Assert
    expect(transaction.findAll).toHaveBeenCalledWith({
      where: {
        credentialId: params.corporateId,
      },
    });

    expect(result).toEqual(mockData);
    expect(consoleSpy).toHaveBeenCalledWith('TRANSACTION FIND ALL ROUTE CALLED');

    consoleSpy.mockRestore();
  });
});
