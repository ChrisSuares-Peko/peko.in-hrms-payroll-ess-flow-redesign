const { getDataExcelCSV } = require('../../transaction');
const transaction = require('../../../entities/transaction');

jest.mock('../../../entities/transaction');

describe('getDataExcelCSV', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return formatted data when records exist', async () => {
    const mockParams = {
      corporateId: 'CORP123',
      from: '2026-01-01',
      to: '2026-01-31',
      categoryName: 'Recharge',
      details: true,
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
          status: 'SUCCESS',
          serviceOperator: { serviceProvider: 'Airtel' },
          order: { amountInINR: '200.00', paymentMode: 'Wallet' },
        },
      ],
    };

    transaction.findAndCountAll.mockResolvedValue(mockData);

    const result = await getDataExcelCSV(mockParams);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('ID', 1);
    expect(result[0]).toHaveProperty('Order ID', 'PROV123');
    expect(result[0]).toHaveProperty('Transaction ID', 'TXN123');
    expect(result[0]).toHaveProperty('Category', 'Recharge');
    expect(result[0]).toHaveProperty('Operator', 'Airtel');
    expect(result[0]).toHaveProperty('Amount', '200.00 ₹');
    expect(result[0]).toHaveProperty('Payment Mode', 'Wallet');
    expect(result[0]).toHaveProperty('Status', 'SUCCESS');
  });

  it('should filter by categoryName when not "null"', async () => {
    const mockParams = {
      corporateId: null,
      from: '2026-01-01',
      to: '2026-01-31',
      categoryName: 'Recharge',
      details: false,
    };

    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await getDataExcelCSV(mockParams);

    expect(transaction.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          transactionCategory: 'Recharge',
        }),
      })
    );
  });

  it('should not filter by categoryName when "null"', async () => {
    const mockParams = {
      corporateId: null,
      from: '2026-01-01',
      to: '2026-01-31',
      categoryName: 'null',
      details: false,
    };

    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await getDataExcelCSV(mockParams);

    const callArgs = transaction.findAndCountAll.mock.calls[0][0];
    expect(callArgs.where).not.toHaveProperty('transactionCategory');
  });

  it('should return empty array when no records found', async () => {
    const mockParams = {
      corporateId: null,
      from: '2026-01-01',
      to: '2026-01-31',
      categoryName: 'null',
      details: false,
    };

    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const result = await getDataExcelCSV(mockParams);

    expect(result).toEqual([]);
  });

  it('should throw error when DB fails', async () => {
    const mockParams = {
      corporateId: null,
      from: '2026-01-01',
      to: '2026-01-31',
      categoryName: 'null',
      details: false,
    };

    transaction.findAndCountAll.mockRejectedValue(new Error('DB Error'));

    await expect(getDataExcelCSV(mockParams)).rejects.toThrow('DB Error');
  });
});
