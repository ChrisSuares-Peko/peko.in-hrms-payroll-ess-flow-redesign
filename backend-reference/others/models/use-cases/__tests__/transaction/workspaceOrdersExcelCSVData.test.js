const { workspaceOrdersExcelCSVData } = require('../../transaction');
const orders =require('../../../entities/order')
const { formattedDateTime, formatNumberWithLocalString } = require('../../../../utils/formatter');
const {handleSortFields} = require('../../../../utils/sortHandle'); // Adjust the path as necessary

// Mock dependencies
jest.mock('../../../entities/order', () => ({
    findAndCountAll: jest.fn(),
  }));
  
  jest.mock('../../../entities/serviceOperator', () => jest.fn());
  jest.mock('../../../entities/transaction', () => jest.fn());
  jest.mock('../../../entities/credential', () => jest.fn());
  jest.mock('../../../entities/vendor', () => jest.fn());
  jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(),
  }));
  jest.mock('../../../../utils/formatter', () => ({
      formattedDateTime: jest.fn(),
      formatNumberWithLocalString: jest.fn(),
    }));
 
describe('workspaceOrdersExcelCSVData', () => {
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
      registeredBy: 'registeredByUser',
    };

    const mockData = {
      rows: [
        {
          transactionDate: new Date('2024-01-15'),
          corporateTxnId: 'txn123',
          baseAmount: '200.00',
          status: 'Completed',
          paymentMode: 'Credit Card',
          orderResponse: JSON.stringify({
            planDetails: {
              name: 'Gold Plan',
              billingCycle: 'Monthly',
            },
          }),
          credential: { name: 'Corp Name', username: 'corp123' },
        },
      ],
      count: 1,
    };

    handleSortFields.mockReturnValue(['transactionDate', 'DESC']);
    formattedDateTime.mockReturnValue('15 Jan 2024');
    formatNumberWithLocalString.mockImplementation(value => value); // Mock implementation to return the value directly
    orders.findAndCountAll.mockResolvedValue(mockData);

    // Act
    const result = await workspaceOrdersExcelCSVData(params);

    // Assert
    expect(result).toEqual([
      {
        "Transaction Date": '15 Jan 2024',
        "Transaction ID": 'txn123',
        "Corporate Name": 'Corp Name',
        "Partner Name": "Not Available",
        "Corporate ID": 'corp123',
        "Plan Name": 'Gold Plan',
        "Billing Cycle": 'Monthly',
        "Payment Mode": 'Credit Card',
        Amount: '₹ 200.00',
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
    await expect(workspaceOrdersExcelCSVData(params)).rejects.toEqual({
      message: 'Something went wrong',
    });
  });

  it('should throw an error for invalid input', async () => {
    // Arrange
    const params = {
      from: 'invalid-date', // Invalid date
      to: '2024-01-31',
    };

    // Mock the behavior of the database call to throw an error when invalid parameters are used
    orders.findAndCountAll.mockImplementation(() => {
      throw new Error('Database error');
    });

    // Act & Assert
    await expect(workspaceOrdersExcelCSVData(params)).rejects.toEqual({
      message: 'Something went wrong',
    });
  });
  
});
