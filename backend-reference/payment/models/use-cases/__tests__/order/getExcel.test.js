const { getExcel } = require('../../order');
const transaction = require('../../../entities/transaction');

jest.mock('../../../entities/transaction');

describe('getExcel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return formatted excel data when records exist', async () => {
    const mockParams = {
      from: '2026-01-01',
      to: '2026-01-31',
      order: 'DESC',
      column: 'transactionDate',
      corporateId: null,
      categoryName: 'null',
    };

    const mockData = {
      count: 1,
      rows: [
        {
          transactionDate: '2026-01-15T10:00:00Z',
          credential: { name: 'Test Corp' },
          providerId: 'PROV123',
          corporateTxnId: 'TXN123',
          transactionCategory: 'Recharge',
          serviceOperator: { serviceProvider: 'Airtel' },
          order: { amountInINR: '100.50', paymentMode: 'Wallet', status: 'SUCCESS' },
        },
      ],
    };

    transaction.findAndCountAll.mockResolvedValue(mockData);

    const result = await getExcel(mockParams);

    expect(transaction.findAndCountAll).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('Corporate Name', 'Test Corp');
    expect(result[0]).toHaveProperty('Order Id', 'PROV123');
    expect(result[0]).toHaveProperty('Transaction Id', 'TXN123');
    expect(result[0]).toHaveProperty('Category', 'Recharge');
    expect(result[0]).toHaveProperty('Operator', 'Airtel');
    expect(result[0]).toHaveProperty('Amount', '100.50 ₹');
    expect(result[0]).toHaveProperty('Payment Mode', 'Wallet');
    expect(result[0]).toHaveProperty('Status', 'SUCCESS');
  });

  it('should return empty array when no records found', async () => {
    const mockParams = {
      from: '2026-01-01',
      to: '2026-01-31',
      order: 'DESC',
      column: 'transactionDate',
      corporateId: null,
      categoryName: 'null',
    };

    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const result = await getExcel(mockParams);

    expect(result).toEqual([]);
  });

  it('should add corporateId to where clause when provided', async () => {
    const mockParams = {
      from: '2026-01-01',
      to: '2026-01-31',
      order: 'DESC',
      column: 'transactionDate',
      corporateId: 'CORP123',
      categoryName: 'null',
    };

    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await getExcel(mockParams);

    expect(transaction.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          credentialId: 'CORP123',
        }),
      })
    );
  });

  it('should add categoryName to where clause when not "null"', async () => {
    const mockParams = {
      from: '2026-01-01',
      to: '2026-01-31',
      order: 'DESC',
      column: 'transactionDate',
      corporateId: null,
      categoryName: 'Recharge',
    };

    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await getExcel(mockParams);

    expect(transaction.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          transactionCategory: 'Recharge',
        }),
      })
    );
  });

  it('should handle missing field values with fallback "Not Available" or "0.00"', async () => {
    const mockParams = {
      from: '2026-01-01',
      to: '2026-01-31',
      order: 'DESC',
      column: 'transactionDate',
      corporateId: null,
      categoryName: 'null',
    };

    const mockData = {
      count: 1,
      rows: [
        {
          transactionDate: null,
          credential: { name: null },
          providerId: null,
          corporateTxnId: null,
          transactionCategory: null,
          serviceOperator: { serviceProvider: null },
          order: { amountInINR: null, paymentMode: null, status: null },
        },
      ],
    };

    transaction.findAndCountAll.mockResolvedValue(mockData);

    const result = await getExcel(mockParams);

    expect(result[0]).toHaveProperty('Date', 'Not Available');
    expect(result[0]).toHaveProperty('Corporate Name', 'Not Available');
    expect(result[0]).toHaveProperty('Order Id', 'Not Available');
    expect(result[0]).toHaveProperty('Transaction Id', 'Not Available');
    expect(result[0]).toHaveProperty('Category', 'Not Available');
    expect(result[0]).toHaveProperty('Operator', 'Not Available');
    expect(result[0]).toHaveProperty('Amount', '0.00');
    expect(result[0]).toHaveProperty('Payment Mode', 'Not Available');
    expect(result[0]).toHaveProperty('Status', 'Not Available');
  });
});
