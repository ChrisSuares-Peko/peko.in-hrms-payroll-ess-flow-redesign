const { getDataExcelCSV } = require('../../transaction');
const transaction = require('../../../entities/transaction');

jest.mock('../../../entities/transaction', () => ({
  findOne: jest.fn(),
  findAndCountAll: jest.fn(),
}));

jest.mock('../../../entities/order', () => ({
  findOne: jest.fn(),
  sum: jest.fn(),
}));

jest.mock('../../../entities/serviceOperator', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../entities/userCoupons', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../entities/credential', () => ({
  findOne: jest.fn(),
}));

describe('transaction - getDataExcelCSV', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return formatted CSV data', async () => {
    const mockParams = {
      corporateId: null,
      from: '2026-01-01',
      to: '2026-12-31',
      categoryName: 'null',
      details: false,
    };

    const mockRows = [
      {
        id: 1,
        transactionDate: '2026-06-15T10:00:00Z',
        providerId: 'PROV1',
        corporateTxnId: 'TXN123',
        transactionCategory: 'RECHARGE',
        status: 'SUCCESS',
        serviceOperator: { serviceProvider: 'Airtel' },
        order: { amountInINR: '100.50', paymentMode: 'WALLET' },
        credential: {},
      },
    ];

    transaction.findAndCountAll.mockResolvedValue({ count: 1, rows: mockRows });

    const result = await getDataExcelCSV(mockParams);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.objectContaining({
      ID: 1,
      'Transaction ID': 'TXN123',
      Category: 'RECHARGE',
      Operator: 'Airtel',
      Amount: '100.50 ₹',
      'Payment Mode': 'WALLET',
      Status: 'SUCCESS',
    }));
  });

  it('should handle missing data with fallbacks', async () => {
    const mockParams = {
      corporateId: null,
      from: '2026-01-01',
      to: '2026-12-31',
      categoryName: 'null',
      details: false,
    };

    const mockRows = [
      {
        id: 2,
        transactionDate: null,
        providerId: null,
        corporateTxnId: null,
        transactionCategory: null,
        status: null,
        serviceOperator: { serviceProvider: null },
        order: { amountInINR: null, paymentMode: null },
        credential: {},
      },
    ];

    transaction.findAndCountAll.mockResolvedValue({ count: 1, rows: mockRows });

    const result = await getDataExcelCSV(mockParams);

    expect(result[0]['Date/Time']).toBe('Not Available');
    expect(result[0]['Order ID']).toBe('Not Available');
    expect(result[0].Amount).toBe('0.00');
  });

  it('should filter by corporateId when provided', async () => {
    const mockParams = {
      corporateId: 'CORP123',
      from: '2026-01-01',
      to: '2026-12-31',
      categoryName: 'null',
      details: false,
    };

    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await getDataExcelCSV(mockParams);

    expect(transaction.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          credentialId: 'CORP123',
        }),
      })
    );
  });

  it('should filter by categoryName when not null', async () => {
    const mockParams = {
      corporateId: null,
      from: '2026-01-01',
      to: '2026-12-31',
      categoryName: 'RECHARGE',
      details: false,
    };

    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await getDataExcelCSV(mockParams);

    expect(transaction.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          transactionCategory: 'RECHARGE',
        }),
      })
    );
  });
});
