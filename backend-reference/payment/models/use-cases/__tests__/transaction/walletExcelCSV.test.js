const { walletExcelCSV } = require('../../transaction');
const transaction = require('../../../entities/transaction');

jest.mock('../../../entities/transaction');

describe('walletExcelCSV', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return formatted wallet CSV data when records exist', async () => {
    const mockParams = {
      from: '2026-01-01',
      to: '2026-01-31',
    };

    const mockData = {
      count: 1,
      rows: [
        {
          id: 1,
          corporateTxnId: 'TXN123',
          transactionDate: '2026-01-15T10:00:00Z',
          transactionType: 'CREDIT',
          debitAmount: null,
          creditAmount: '500.00',
          balance: '1500.00',
          remarks: 'Fund transfer',
          credential: { name: 'Test Corp' },
        },
      ],
    };

    transaction.findAndCountAll.mockResolvedValue(mockData);

    const result = await walletExcelCSV(mockParams);

    expect(transaction.findAndCountAll).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('ID', 1);
    expect(result[0]).toHaveProperty('Transaction Id', 'TXN123');
    expect(result[0]).toHaveProperty('Transaction Type', 'CREDIT');
    expect(result[0]).toHaveProperty('Debit Amount', '0.0000');
    expect(result[0]).toHaveProperty('Credit Amount', '500.00₹');
    expect(result[0]).toHaveProperty('Balance', '1500.00₹');
    expect(result[0]).toHaveProperty('Remarks', 'Fund transfer');
  });

  it('should return empty array when no records found', async () => {
    const mockParams = {
      from: '2026-01-01',
      to: '2026-01-31',
    };

    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const result = await walletExcelCSV(mockParams);

    expect(result).toEqual([]);
  });

  it('should handle missing field values with proper fallbacks', async () => {
    const mockParams = {
      from: '2026-01-01',
      to: '2026-01-31',
    };

    const mockData = {
      count: 1,
      rows: [
        {
          id: 1,
          corporateTxnId: null,
          transactionDate: null,
          transactionType: null,
          debitAmount: null,
          creditAmount: null,
          balance: null,
          remarks: null,
          credential: { name: 'Test Corp' },
        },
      ],
    };

    transaction.findAndCountAll.mockResolvedValue(mockData);

    const result = await walletExcelCSV(mockParams);

    expect(result[0]).toHaveProperty('Transaction Id', 'Not Available');
    expect(result[0]).toHaveProperty('Transaction Date', 'Not Available');
    expect(result[0]).toHaveProperty('Transaction Type', 'Not Available');
    expect(result[0]).toHaveProperty('Debit Amount', '0.0000');
    expect(result[0]).toHaveProperty('Credit Amount', '0.0000');
    expect(result[0]).toHaveProperty('Balance', '0.0000');
    expect(result[0]).toHaveProperty('Remarks', 'Not Available');
  });

  it('should return empty array on error', async () => {
    const mockParams = {
      from: '2026-01-01',
      to: '2026-01-31',
    };

    transaction.findAndCountAll.mockRejectedValue(new Error('DB Error'));

    const result = await walletExcelCSV(mockParams);

    expect(result).toEqual([]);
  });
});
