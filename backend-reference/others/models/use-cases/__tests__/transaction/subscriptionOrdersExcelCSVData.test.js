const { subscriptionOrdersExcelCSVData } = require('../../transaction');
const orders = require('../../../entities/order');
const { formattedDateTime, formatNumberWithLocalString } = require('../../../../utils/formatter');
const { handleSortFields } = require('../../../../utils/sortHandle'); 

// Mock dependencies
jest.mock('../../../entities/order', () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock('../../../entities/serviceOperator', () => jest.fn());
jest.mock('../../../entities/credential', () => jest.fn());
jest.mock('../../../../utils/sortHandle', () => ({
  handleSortFields: jest.fn(),
}));
jest.mock('../../../../utils/formatter', () => ({
  formattedDateTime: jest.fn(),
  formatNumberWithLocalString: jest.fn(),
}));

describe('subscriptionOrdersExcelCSVData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should format data correctly', async () => {
    // Arrange
    const params = {
      from: '2024-01-01',
      to: '2024-01-31',
      searchText: 'test',
      sort: 'DESC',
      sortField: 'transactionDate',
      corporateId: 'corp123',
      registeredBy: 'registeredByUser',
    };

    const mockData = {
      rows: [
        {
          transactionDate: new Date('2024-01-15'),
          corporateTxnId: 'txn123',
          amountInINR: '200.00',
          status: 'Completed',
          paymentMode: 'Credit Card',
          orderResponse: JSON.stringify({
            subscriptionDetails: {
              name: 'Software Plan',
            },
          }),
          credential: { name: 'Corp Name', username: 'corp123' },
          credentialId: 'corp123',
        },
      ],
      count: 1,
    };

    handleSortFields.mockReturnValue(['transactionDate', 'DESC']);
    formattedDateTime.mockReturnValue('15 Jan 2024');
    formatNumberWithLocalString.mockImplementation(value => value);
    orders.findAndCountAll.mockResolvedValue(mockData);

    // Act
    const result = await subscriptionOrdersExcelCSVData(params);

    // Assert
    expect(result).toEqual([
      {
        "Transaction Date": '15 Jan 2024',
        "Transaction ID": 'txn123',
        "Corporate Name": 'Corp Name',
        "Partner Name": "Not Available",
        "Corporate ID": 'corp123',
        "Software Name": 'Software Plan',
        "Payment Mode": 'Credit Card',
        Amount: '₹ 0.00',
        Status: 'Completed',
      },
    ]);
  });

  it('should handle errors gracefully', async () => {
    // Arrange
    const params = {
      from: '2024-01-01',
      to: '2024-01-31',
      searchText: 'test',
      sort: 'DESC',
      sortField: 'transactionDate',
    };

    orders.findAndCountAll.mockRejectedValue(new Error('Database error'));

    // Act & Assert
    await expect(subscriptionOrdersExcelCSVData(params)).rejects.toEqual({
      message: 'Something went wrong',
    });
  });

  it('should handle missing parameters gracefully', async () => {
    // Arrange
    const params = {}; // No parameters

    const mockData = {
      rows: [],
      count: 0,
    };

    handleSortFields.mockReturnValue(['transactionDate', 'DESC']);
    formattedDateTime.mockReturnValue('Not Available');
    formatNumberWithLocalString.mockImplementation(value => value);
    orders.findAndCountAll.mockResolvedValue(mockData);

    // Act
    const result = await subscriptionOrdersExcelCSVData(params);

    // Assert
    expect(result).toEqual([]);
  });

  it('should handle invalid date formats', async () => {
    // Arrange
    const params = {
      from: 'invalid-date', // Invalid date
      to: '2024-01-31',
    };

    // Mock the behavior of the database call to throw an error when invalid parameters are used
    orders.findAndCountAll.mockRejectedValue(new Error('Database error'));

    // Act & Assert
    await expect(subscriptionOrdersExcelCSVData(params)).rejects.toEqual({
      message: 'Something went wrong',
    });
  });
});
