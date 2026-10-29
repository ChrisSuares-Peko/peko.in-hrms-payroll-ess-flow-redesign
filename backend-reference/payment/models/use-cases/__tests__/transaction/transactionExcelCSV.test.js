const { transactionExcelCSV } = require('../../transaction');
const transaction = require('../../../entities/transaction');

jest.mock('../../../entities/transaction');

describe('transactionExcelCSV', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return formatted CSV data when records exist', async () => {
    const mockParams = {
      from: '2026-01-01',
      to: '2026-01-31',
      order: 'DESC',
      column: 'transactionDate',
    };

    const mockData = {
      count: 1,
      rows: [
        {
          corporateTxnId: 'TXN123',
          credential: { name: 'Test Corp' },
          transactionDate: '2026-01-15T10:00:00Z',
          transactionType: 'DEBIT',
          transactionCategory: 'Recharge',
          debitAmount: '100.00',
          creditAmount: null,
          corporateCashback: '5.00',
          balance: '400.00',
          remarks: 'Airtel recharge',
        },
      ],
    };

    transaction.findAndCountAll.mockResolvedValue(mockData);

    const result = await transactionExcelCSV(mockParams);

    expect(transaction.findAndCountAll).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('Transaction Id', 'TXN123');
    expect(result[0]).toHaveProperty('Corporate Name', 'Test Corp');
    expect(result[0]).toHaveProperty('Type', 'DEBIT');
    expect(result[0]).toHaveProperty('Category', 'Recharge');
    expect(result[0]).toHaveProperty('Debit Amount', '100.00₹');
    expect(result[0]).toHaveProperty('Credit Amount', '0.0000');
    expect(result[0]).toHaveProperty('Cashback', '5.00₹');
    expect(result[0]).toHaveProperty('Balance', '400.00₹');
    expect(result[0]).toHaveProperty('Remarks', 'Airtel recharge');
  });

  it('should return empty array when no records found', async () => {
    const mockParams = {
      from: '2026-01-01',
      to: '2026-01-31',
      order: 'DESC',
      column: 'transactionDate',
    };

    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const result = await transactionExcelCSV(mockParams);

    expect(result).toEqual([]);
  });

  it('should handle missing field values with proper fallbacks', async () => {
    const mockParams = {
      from: '2026-01-01',
      to: '2026-01-31',
      order: 'DESC',
      column: 'transactionDate',
    };

    const mockData = {
      count: 1,
      rows: [
        {
          corporateTxnId: null,
          credential: { name: null },
          transactionDate: null,
          transactionType: null,
          transactionCategory: null,
          debitAmount: null,
          creditAmount: null,
          corporateCashback: null,
          balance: null,
          remarks: null,
        },
      ],
    };

    transaction.findAndCountAll.mockResolvedValue(mockData);

    const result = await transactionExcelCSV(mockParams);

    expect(result[0]).toHaveProperty('Transaction Id', 'Not Available');
    expect(result[0]).toHaveProperty('Corporate Name', 'Not Available');
    expect(result[0]).toHaveProperty('Date', 'Not Available');
    expect(result[0]).toHaveProperty('Debit Amount', '0.0000');
    expect(result[0]).toHaveProperty('Credit Amount', '0.0000');
  });

  it('should return empty array on error', async () => {
    const mockParams = {
      from: '2026-01-01',
      to: '2026-01-31',
      order: 'DESC',
      column: 'transactionDate',
    };

    transaction.findAndCountAll.mockRejectedValue(new Error('DB Error'));

    const result = await transactionExcelCSV(mockParams);

    expect(result).toEqual([]);
  });
});
