const { getExcelCSVData } = require('../../transaction');
const transaction = require('../../../entities/transaction');

jest.mock('../../../entities/transaction');

describe('getExcelCSVData', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return order-style formatted data when reportFor is not walletReports', async () => {
    const mockParams = {
      corporateId: 'CORP123',
      from: '2026-01-01',
      to: '2026-01-31',
      searchText: '',
      order: 'DESC',
      column: 'transactionDate',
      reportFor: 'transactions',
    };

    const mockData = {
      count: 1,
      rows: [
        {
          id: 1,
          transactionDate: '2026-01-15T10:00:00Z',
          providerId: 'PROV123',
          corporateTxnId: 'TXN123',
          transactionCategory: 'Recharge',
          serviceOperator: { serviceProvider: 'Airtel' },
          order: { amountInINR: '100.50', paymentMode: 'Wallet' },
          status: 'SUCCESS',
        },
      ],
    };

    transaction.findAndCountAll.mockResolvedValue(mockData);

    const result = await getExcelCSVData(mockParams);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('ID', 1);
    expect(result[0]).toHaveProperty('Order ID', 'PROV123');
    expect(result[0]).toHaveProperty('Transaction ID', 'TXN123');
    expect(result[0]).toHaveProperty('Category', 'Recharge');
    expect(result[0]).toHaveProperty('Operator', 'Airtel');
    expect(result[0]).toHaveProperty('Amount', '100.50 ₹');
    expect(result[0]).toHaveProperty('Payment Mode', 'Wallet');
    expect(result[0]).toHaveProperty('Status', 'SUCCESS');
  });

  it('should return wallet-style formatted data when reportFor is walletReports', async () => {
    const mockParams = {
      corporateId: 'CORP123',
      from: '2026-01-01',
      to: '2026-01-31',
      searchText: '',
      order: 'DESC',
      column: 'transactionDate',
      reportFor: 'walletReports',
    };

    const mockData = {
      count: 1,
      rows: [
        {
          id: 1,
          corporateTxnId: 'TXN123',
          transactionDate: '2026-01-15T10:00:00Z',
          transactionType: 'CREDIT',
          transactionCategory: 'FUND TRANSFER',
          debitAmount: null,
          creditAmount: '500.00',
          corporateCashback: '10.00',
          balance: '1500.00',
          remarks: 'Fund added',
        },
      ],
    };

    transaction.findAndCountAll.mockResolvedValue(mockData);

    const result = await getExcelCSVData(mockParams);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('ID', 1);
    expect(result[0]).toHaveProperty('Transaction ID', 'TXN123');
    expect(result[0]).toHaveProperty('Transaction Type', 'CREDIT');
    expect(result[0]).toHaveProperty('Category', 'FUND TRANSFER');
    expect(result[0]).toHaveProperty('Debit Amount', '0.00');
    expect(result[0]).toHaveProperty('Credit Amount', '500.00');
    expect(result[0]).toHaveProperty('Cashback', '10.00');
    expect(result[0]).toHaveProperty('Balance', '1500.00');
    expect(result[0]).toHaveProperty('Remarks', 'Fund added');
  });

  it('should return empty array when no records found', async () => {
    const mockParams = {
      corporateId: null,
      from: '2026-01-01',
      to: '2026-01-31',
      searchText: '',
      order: 'DESC',
      column: 'transactionDate',
      reportFor: null,
    };

    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const result = await getExcelCSVData(mockParams);

    expect(result).toEqual([]);
  });

  it('should add corporateId to where clause when provided', async () => {
    const mockParams = {
      corporateId: 'CORP123',
      from: '2026-01-01',
      to: '2026-01-31',
      searchText: '',
      order: 'DESC',
      column: 'transactionDate',
      reportFor: null,
    };

    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await getExcelCSVData(mockParams);

    expect(transaction.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          credentialId: 'CORP123',
        }),
      })
    );
  });

  it('should throw error when DB fails', async () => {
    const mockParams = {
      corporateId: null,
      from: '2026-01-01',
      to: '2026-01-31',
      searchText: '',
      order: 'DESC',
      column: 'transactionDate',
      reportFor: null,
    };

    transaction.findAndCountAll.mockRejectedValue(new Error('DB Error'));

    await expect(getExcelCSVData(mockParams)).rejects.toThrow('DB Error');
  });
});
