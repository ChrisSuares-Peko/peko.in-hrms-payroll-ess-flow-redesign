const { getDataExcelCSV } = require('../../transaction');
const { Op } = require('sequelize');
const transaction = require('../../../entities/transaction');
const serviceOperator = require('../../../entities/serviceOperator');
const credential = require('../../../entities/credential');
const orders = require('../../../entities/order');

// Mock the imported modules
jest.mock('../../../entities/transaction', () => ({
  findAndCountAll: jest.fn(),
}));
jest.mock('../../../entities/serviceOperator');
jest.mock('../../../entities/credential');
jest.mock('../../../entities/order');

describe('getDataExcelCSV', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call transaction.findAndCountAll with correct parameters and return formatted data', async () => {
    // Arrange
    const params = {
      corporateId: 'corp1',
      from: '2024-01-01',
      to: '2024-01-31',
      categoryName: 'someCategory',
      details: true
    };

    const mockData = {
      rows: [
        {
          id: '1',
          transactionDate: '2024-01-15T12:00:00Z',
          providerId: 'provider1',
          corporateTxnId: 'txn123',
          transactionCategory: 'someCategory',
          serviceOperator: { serviceProvider: 'serviceProvider1' },
          order: {
            amountInINR: '100.00 AED',
            paymentMode: 'credit'
          },
          status: 'completed'
        }
      ]
    };

    const expectedResult = [
      {
        ID: '1',
        'Date/Time': '2024-01-15 17:30:00', 
        'Order ID': 'provider1',
        'Transaction ID': 'txn123',
        Category: 'someCategory',
        Operator: 'serviceProvider1',
        "Amount": "0.00",
        'Payment Mode': 'credit',
        Status: 'completed'
      }
    ];

    transaction.findAndCountAll.mockResolvedValue(mockData);

    // Act
    const result = await getDataExcelCSV(params);

    // Assert
    expect(transaction.findAndCountAll).toHaveBeenCalledWith({
      include: [
        { model: serviceOperator, required: true },
        { model: credential, required: true },
        { model: orders, required: true }
      ],
      where: {
        transactionDate: {
          [Op.between]: ['2024-01-01', '2024-01-31']
        },
        transactionCategory: 'someCategory',
        credentialId: 'corp1'
      },
      raw: true,
      nest: true
    });

    expect(result).toEqual(expectedResult);
  });

  it('should handle cases where fields are missing or null', async () => {
    // Arrange
    const params = {
      corporateId: 'corp1',
      from: '2024-01-01',
      to: '2024-01-31',
      categoryName: 'null',
      details: true
    };

    const mockData = {
      rows: [
        {
          id: '1',
          transactionDate: null,
          providerId: null,
          corporateTxnId: null,
          transactionCategory: null,
          serviceOperator: { serviceProvider: null },
          order: {
            amountInINR: null,
            paymentMode: null
          },
          status: null
        }
      ]
    };

    const expectedResult = [
      {
        ID: '1',
        'Date/Time': 'Not Available',
        'Order ID': 'Not Available',
        'Transaction ID': 'Not Available',
        Category: 'Not Available',
        Operator: 'Not Available',
        Amount: '0.00', // Ensure this includes currency
        'Payment Mode': 'Not Available',
        Status: 'Not Available'
      }
    ];

    transaction.findAndCountAll.mockResolvedValue(mockData);

    // Act
    const result = await getDataExcelCSV(params);

    // Assert
    expect(result).toEqual(expectedResult);
  });

  it('should throw an error if transaction.findAndCountAll fails', async () => {
    // Arrange
    const errorMessage = 'Database error';
    transaction.findAndCountAll.mockRejectedValue(new Error(errorMessage));

    // Act & Assert
    await expect(getDataExcelCSV({})).rejects.toThrow(errorMessage);
  });
});
