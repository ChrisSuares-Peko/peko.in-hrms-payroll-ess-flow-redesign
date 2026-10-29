const { transactionExcelCSVOnFinance } = require('../../transaction');
const transaction = require('../../../entities/transaction');

jest.mock('../../../entities/transaction');

describe('transactionExcelCSVOnFinance', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return formatted data for matching partnerId records', async () => {
    const mockParams = {
      from: '2026-01-01',
      to: '2026-01-31',
      order: 'DESC',
      column: 'transactionDate',
      partnerId: 'PARTNER1',
      corporateId: null,
    };

    const mockData = {
      count: 2,
      rows: [
        {
          corporateTxnId: 'TXN123',
          credential: { name: 'Test Corp', registeredBy: 'PARTNER1' },
          transactionDate: '2026-01-15T10:00:00Z',
          transactionType: 'DEBIT',
          transactionCategory: 'Recharge',
          debitAmount: '100.00',
          creditAmount: null,
          corporateCashback: '5.00',
          balance: '400.00',
          remarks: 'Airtel recharge',
        },
        {
          corporateTxnId: 'TXN456',
          credential: { name: 'Other Corp', registeredBy: 'PARTNER2' },
          transactionDate: '2026-01-16T10:00:00Z',
          transactionType: 'DEBIT',
          transactionCategory: 'Recharge',
          debitAmount: '200.00',
          creditAmount: null,
          corporateCashback: null,
          balance: '300.00',
          remarks: 'Jio recharge',
        },
      ],
    };

    transaction.findAndCountAll.mockResolvedValue(mockData);

    const result = await transactionExcelCSVOnFinance(mockParams);

    expect(transaction.findAndCountAll).toHaveBeenCalledTimes(1);
    // Only the first row matches PARTNER1
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('Transaction Id', 'TXN123');
    expect(result[0]).toHaveProperty('Corporate Name', 'Test Corp');
    expect(result[0]).toHaveProperty('Type', 'DEBIT');
    expect(result[0]).toHaveProperty('Debit Amount', '100.00₹');
    expect(result[0]).toHaveProperty('Cashback', '5.00₹');
    expect(result[0]).toHaveProperty('Balance', '400.00₹');
  });

  it('should return empty array when no records match partnerId', async () => {
    const mockParams = {
      from: '2026-01-01',
      to: '2026-01-31',
      order: 'DESC',
      column: 'transactionDate',
      partnerId: 'PARTNER_NONE',
      corporateId: null,
    };

    const mockData = {
      count: 1,
      rows: [
        {
          corporateTxnId: 'TXN123',
          credential: { name: 'Test Corp', registeredBy: 'PARTNER_OTHER' },
          transactionDate: '2026-01-15T10:00:00Z',
          transactionType: 'DEBIT',
          transactionCategory: 'Recharge',
          debitAmount: '100.00',
          creditAmount: null,
          corporateCashback: null,
          balance: '400.00',
          remarks: 'test',
        },
      ],
    };

    transaction.findAndCountAll.mockResolvedValue(mockData);

    const result = await transactionExcelCSVOnFinance(mockParams);

    expect(result).toEqual([]);
  });

  it('should add corporateId to where clause when provided', async () => {
    const mockParams = {
      from: '2026-01-01',
      to: '2026-01-31',
      order: 'DESC',
      column: 'transactionDate',
      partnerId: 'PARTNER1',
      corporateId: 'CORP123',
    };

    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await transactionExcelCSVOnFinance(mockParams);

    expect(transaction.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          credentialId: 'CORP123',
        }),
      })
    );
  });

  it('should return empty array on error', async () => {
    const mockParams = {
      from: '2026-01-01',
      to: '2026-01-31',
      order: 'DESC',
      column: 'transactionDate',
      partnerId: 'PARTNER1',
      corporateId: null,
    };

    transaction.findAndCountAll.mockRejectedValue(new Error('DB Error'));

    const result = await transactionExcelCSVOnFinance(mockParams);

    expect(result).toEqual([]);
  });

  it('should handle missing field values with proper fallbacks', async () => {
    const mockParams = {
      from: '2026-01-01',
      to: '2026-01-31',
      order: 'DESC',
      column: 'transactionDate',
      partnerId: 'PARTNER1',
      corporateId: null,
    };

    const mockData = {
      count: 1,
      rows: [
        {
          corporateTxnId: null,
          credential: { name: null, registeredBy: 'PARTNER1' },
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

    const result = await transactionExcelCSVOnFinance(mockParams);

    expect(result[0]).toHaveProperty('Transaction Id', 'Not Available');
    expect(result[0]).toHaveProperty('Corporate Name', 'Not Available');
    expect(result[0]).toHaveProperty('Date', 'Not Available');
    expect(result[0]).toHaveProperty('Debit Amount', '0.0000');
    expect(result[0]).toHaveProperty('Credit Amount', '0.0000');
    expect(result[0]).toHaveProperty('Cashback', '0.0000');
    expect(result[0]).toHaveProperty('Balance', '0.0000');
    expect(result[0]).toHaveProperty('Remarks', 'Not Available');
  });
});
