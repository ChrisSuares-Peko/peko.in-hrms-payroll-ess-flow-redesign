const { findOneTransactionDetails } = require('../../transaction');
const transaction = require('../../../entities/transaction');
const serviceOperator = require('../../../entities/serviceOperator');
const orders = require('../../../entities/order');
const credential = require('../../../entities/credential');

jest.mock('../../../entities/transaction', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../entities/serviceOperator', () => jest.fn());
jest.mock('../../../entities/order', () => jest.fn());
jest.mock('../../../entities/credential', () => jest.fn());

describe('findOneTransactionDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call transaction.findOne with the correct parameters and return results', async () => {
    // Arrange
    const params = { transactionId: 'txn123' };
    const mockData = {
      id: '1',
      corporateTxnId: 'txn123',
      status: 'SUCCESS',
      serviceOperator: { id: 'op1', name: 'Operator1' },
      orders: { id: 'order1', item: 'Item1' },
      credential: { id: 'cred1', type: 'Type1' },
    };

    transaction.findOne.mockResolvedValue(mockData);

    // Act
    const result = await findOneTransactionDetails(params);

    // Assert
    expect(transaction.findOne).toHaveBeenCalledWith({
      where: {
        corporateTxnId: params.transactionId,
        status: 'SUCCESS',
      },
      include: [
        { model: serviceOperator },
        { model: orders },
        { model: credential },
      ],
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockData);
  });

  it('should scope by credentialId when provided (ownership check)', async () => {
    // Arrange
    const params = { transactionId: 'txn123', credentialId: 42 };
    transaction.findOne.mockResolvedValue(null);

    // Act
    await findOneTransactionDetails(params);

    // Assert
    expect(transaction.findOne).toHaveBeenCalledWith({
      where: {
        corporateTxnId: params.transactionId,
        status: 'SUCCESS',
        credentialId: 42,
      },
      include: [
        { model: serviceOperator },
        { model: orders },
        { model: credential },
      ],
      raw: true,
      nest: true,
    });
  });

  it('should additionally scope sub-users by order.subCorporateUserId', async () => {
    // Arrange
    const params = { transactionId: 'txn123', credentialId: 42, subCorporateUserId: 7 };
    transaction.findOne.mockResolvedValue(null);

    // Act
    await findOneTransactionDetails(params);

    // Assert
    expect(transaction.findOne).toHaveBeenCalledWith({
      where: {
        corporateTxnId: params.transactionId,
        status: 'SUCCESS',
        credentialId: 42,
        '$order.subCorporateUserId$': 7,
      },
      include: [
        { model: serviceOperator },
        { model: orders },
        { model: credential },
      ],
      raw: true,
      nest: true,
    });
  });

  it('should return null if no transaction is found', async () => {
    // Arrange
    const params = { transactionId: 'txn123' };

    transaction.findOne.mockResolvedValue(null);

    // Act
    const result = await findOneTransactionDetails(params);

    // Assert
    expect(transaction.findOne).toHaveBeenCalledWith({
      where: {
        corporateTxnId: params.transactionId,
        status: 'SUCCESS',
      },
      include: [
        { model: serviceOperator },
        { model: orders },
        { model: credential },
      ],
      raw: true,
      nest: true,
    });

    expect(result).toBeNull();
  });

  it('should handle errors thrown by transaction.findOne', async () => {
    // Arrange
    const params = { transactionId: 'txn123' };
    const errorMessage = 'Database error';
    transaction.findOne.mockRejectedValue(new Error(errorMessage));

    // Spy on console.log to ensure it is called with the error
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Act & Assert
    await expect(findOneTransactionDetails(params)).rejects.toThrow(errorMessage);

    // Assert
    //expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error)); // Check if console.log was called with an error
    consoleSpy.mockRestore();
  });
});
