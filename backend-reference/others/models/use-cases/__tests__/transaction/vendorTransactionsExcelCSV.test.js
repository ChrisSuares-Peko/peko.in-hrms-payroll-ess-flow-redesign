const { vendorTransactionsExcelCSV } = require('../../transaction');
const transaction = require('../../../entities/transaction');
const serviceOperator = require('../../../entities/serviceOperator');
const {handleSortFields}=require('../../../../utils/sortHandle')
const {formattedDateTime, formatNumberWithLocalString}=require('../../../../utils/formatter')
const {Op} =require('sequelize')

// Mock dependencies
jest.mock('../../../entities/transaction', () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock('../../../entities/serviceOperator', () => jest.fn());
jest.mock('../../../entities/order', () => jest.fn());
jest.mock('../../../entities/credential', () => jest.fn());
jest.mock('../../../entities/vendor', () => jest.fn());
jest.mock('../../../../utils/sortHandle', () => ({
  handleSortFields: jest.fn(),
}));
jest.mock('../../../../utils/formatter', () => ({
    formattedDateTime: jest.fn(),
    formatNumberWithLocalString: jest.fn(),
  }));
describe('vendorTransactionsExcelCSV', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call transaction.findAndCountAll with the correct parameters and return formatted data', async () => {
    // Arrange
    const params = {
      vendorId: 'vendor123',
      from: '2024-01-01',
      to: '2024-01-31',
      searchText: 'test',
      sort: 'DESC',
      sortField: 'transactionDate',
    };

    const mockData = {
      rows: [
        {
          transactionDate: new Date('2024-01-15'),
          corporateTxnId: 'txn123',
          debitAmount: '100.00',
          status: 'SUCCESS',
          remarks: 'Test transaction',
          credential: { name: 'Corp Name', username: 'corp123' },
          serviceOperator: { vendor: { vendorName: 'Vendor Name' }, serviceProvider: 'Service Provider' },
        },
      ],
      count: 1,
    };

    handleSortFields.mockReturnValue(['transactionDate', 'DESC']);
    formattedDateTime.mockReturnValue('15 Jan 2024');
    formatNumberWithLocalString.mockReturnValue('100.00');
    transaction.findAndCountAll.mockResolvedValue(mockData);

    // Act
    const toDate = new Date(params.to);
    toDate.setDate(toDate.getDate() + 1);
    toDate.setHours(0, 0, 0, 0);
    
    const result = await vendorTransactionsExcelCSV(params);

    // Assert
    expect(transaction.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
      include: expect.arrayContaining([
        expect.objectContaining({
          model: serviceOperator,
          required: true,
        }),
      ]),
      where: expect.objectContaining({
        transactionDate: expect.objectContaining({
          [Op.between]: expect.any(Array),
        }),
        [Op.or]: expect.any(Array),
      }),
      order: expect.arrayContaining(['transactionDate', 'DESC']),
    }));
    
    
    
    

    expect(result).toEqual([
      {
        "Transaction Date": '15 Jan 2024',
        "Transaction ID": 'txn123',
        "Corporate Name": 'Corp Name',
        "Partner Name": "Not Available",
        "Corporate ID": 'corp123',
        Vendor: 'Vendor Name',
        "Service Provider": 'Service Provider',
        Amount: '₹ 0.00',
        Status: 'SUCCESS',
        Remarks: 'Test transaction',
      },
    ]);
  });

  it('should return an empty array if no transactions are found', async () => {
    // Arrange
    const params = { vendorId: 'vendor123', from: '2024-01-01', to: '2024-01-31', searchText: 'test', sort: 'DESC', sortField: 'transactionDate' };

    const mockData = { rows: [], count: 0 };

    transaction.findAndCountAll.mockResolvedValue(mockData);

    // Act
    const result = await vendorTransactionsExcelCSV(params);

    // Assert
    expect(result).toEqual([]);
  });

  it('should handle errors thrown by transaction.findAndCountAll', async () => {
    // Arrange
    const params = { vendorId: 'vendor123', from: '2024-01-01', to: '2024-01-31', searchText: 'test', sort: 'DESC', sortField: 'transactionDate' };
    const errorMessage = 'Database error';
    transaction.findAndCountAll.mockRejectedValue(new Error(errorMessage));

    // Spy on console.log to ensure it is called with the error
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Act & Assert
    const result = await vendorTransactionsExcelCSV(params);
    expect(result).toEqual([]);

    // Assert
    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error)); // Check if console.log was called with an error
    consoleSpy.mockRestore();
  });
});
