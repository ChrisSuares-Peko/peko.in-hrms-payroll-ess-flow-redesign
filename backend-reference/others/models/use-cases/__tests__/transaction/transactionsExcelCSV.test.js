const { transactionsExcelCSV } = require('../../transaction');
const transaction = require('../../../entities/transaction');
const { handleSortFields } = require('../../../../utils/sortHandle');
const { formattedDateTime, formatNumberWithLocalString } = require('../../../../utils/formatter');


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

describe('transactionsExcelCSV', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it('should format data correctly for "corporate" route', async () => {
      // Arrange
      const params = {
        from: '2024-01-01',
        to: '2024-01-31',
        searchText: 'test',
        sort: 'DESC',
        sortField: 'transactionDate',
        route: 'corporate',
      };
  
      const mockData = {
        rows: [
          {
            transactionDate: new Date('2024-01-15'),
            corporateTxnId: 'txn123',
            debitAmount: '100.00',
            status: 'SUCCESS',
            credential: { name: 'Corp Name', username: 'corp123' },
            serviceOperator: { serviceProvider: 'Service Provider' },
            order: { accountNo: '12345' },
            corporateCashback: '20.00',
            systemCashback: '10.00',
            balance: '150.00',
          },
        ],
        count: 1,
      };
  
      handleSortFields.mockReturnValue(['transactionDate', 'DESC']);
      formattedDateTime.mockReturnValue('15 Jan 2024');
      formatNumberWithLocalString.mockImplementation(value => value); // Mock implementation to return the value directly
      transaction.findAndCountAll.mockResolvedValue(mockData);
  
      // Act
      const result = await transactionsExcelCSV(params,'corporate');
  
      // Assert
      expect(result).toEqual([
        {
          'Transaction Date': '15 Jan 2024',
          'Transaction ID': 'txn123',
          'Corporate ID': 'corp123',
          'Corporate Name': 'Corp Name',
          'Partner Name': 'Not Available',
          'Service Category': 'Not Available',
          'Service Provider': 'Service Provider',
          'Account Number': '12345',
          Amount: '0.00',
          'Payment Mode': 'Not Available',
          'Corporate Cashback': '₹ 20.00',
          'Admin Cashback': '₹ 10.00',
          Balance: '₹ 150.00',
          Status: 'SUCCESS'
        }
      ]);
    });
  
    it('should format data correctly for "order" route', async () => {
      // Arrange
      const params = {
        from: '2024-01-01',
        to: '2024-01-31',
        searchText: 'test',
        sort: 'DESC',
        sortField: 'transactionDate',
        route: 'order',
      };
  
      const mockData = {
        rows: [
          {
            transactionDate: new Date('2024-01-15'),
            corporateTxnId: 'txn123',
            debitAmount: '100.00',
            status: 'SUCCESS',
            credential: { name: 'Corp Name', username: 'corp123' },
            serviceOperator: { serviceProvider: 'Service Provider' },
            order: { amountInINR: '200.00', status: 'Completed' },
            corporateCashback: '20.00',
          },
        ],
        count: 1,
      };
  
      handleSortFields.mockReturnValue(['transactionDate', 'DESC']);
      formattedDateTime.mockReturnValue('15 Jan 2024');
      formatNumberWithLocalString.mockImplementation(value => value); 
      transaction.findAndCountAll.mockResolvedValue(mockData);
  
      // Act
      const result = await transactionsExcelCSV(params,'order');
  
      // Assert
      expect(result).toEqual([
        {
          'Transaction Date': '15 Jan 2024',
          'Transaction ID': 'txn123',
          'Corporate ID': 'corp123',
          'Account Number': 'Not Available',
          'Corporate Name': 'Corp Name',
          'Partner Name': 'Not Available',
          Category: 'Not Available',
          'Service Provider': 'Service Provider',
          Amount: '0.00',
          'Corporate Cashback': '₹ 20.00',
          Status: 'Completed'
        }
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
        route: 'corporate',
      };
  
      const errorMessage = 'Database error';
      transaction.findAndCountAll.mockRejectedValue(new Error(errorMessage));
  
      // Act
      const result = await transactionsExcelCSV(params);
  
      // Assert
      expect(result).toEqual([]);
    });
  
    it('should handle missing parameters', async () => {
      // Arrange
      const params = {}; // Empty parameters
  
      const mockData = {
        rows: [],
        count: 0,
      };
  
      transaction.findAndCountAll.mockResolvedValue(mockData);
  
      // Act
      const result = await transactionsExcelCSV(params);
  
      // Assert
      expect(result).toEqual([]);
    });

    describe('Payment Mode on corporate exports', () => {
      const paymentModeFor = async (route, order) => {
        transaction.findAndCountAll.mockResolvedValue({
          rows: [
            {
              transactionDate: new Date('2024-01-15'),
              corporateTxnId: 'txn123',
              transactionCategory: 'Utility Payments',
              serviceOperator: { serviceProvider: 'Electricity' },
              order: { amountInINR: '812.00', status: 'SUCCESS', ...order },
            },
          ],
          count: 1,
        });
        const [row] = await transactionsExcelCSV({ from: '2024-01-01', to: '2024-01-31' }, route);
        return row['Payment Mode'];
      };

      it.each(['corporateTransaction', 'corporateCashback'])(
        'shows the instrument the customer paid with on the %s export',
        async (route) => {
          await expect(
            paymentModeFor(route, {
              paymentMode: 'PAYMENT GATEWAY',
              paymentModeResponse: JSON.stringify({ payment_group: 'upi' }),
            })
          ).resolves.toBe('UPI');
        }
      );

      it('keeps the wallet leg of a split payment', async () => {
        await expect(
          paymentModeFor('corporateTransaction', {
            paymentMode: 'PAYMENT GATEWAY + WALLET',
            paymentModeResponse: JSON.stringify({ pgAmount: 400, pgResponse: { order_option_type: 'OPTCRDC' } }),
          })
        ).resolves.toBe('Credit Card + Wallet');
      });

      it('falls back to Payment Gateway when the payload names no instrument', async () => {
        await expect(
          paymentModeFor('corporateTransaction', {
            paymentMode: 'PAYMENT GATEWAY',
            paymentModeResponse: JSON.stringify({ pgAmount: 812 }),
          })
        ).resolves.toBe('Payment Gateway');
      });

      it('shows Wallet for a wallet-only payment', async () => {
        await expect(
          paymentModeFor('corporateTransaction', { paymentMode: 'WALLET', paymentModeResponse: null })
        ).resolves.toBe('Wallet');
      });
    });
  });
  
