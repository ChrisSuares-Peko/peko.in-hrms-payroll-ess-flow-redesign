const { vendorReportExcelCSV } = require('../../transaction');
const transaction = require('../../../entities/transaction');

jest.mock('../../../entities/transaction');

describe('vendorReportExcelCSV', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return data when records exist with vendorId', async () => {
    const mockParams = {
      vendorId: 'VENDOR123',
      from: '2026-01-01',
      to: '2026-01-31',
    };

    const mockData = {
      count: 1,
      rows: [
        {
          id: 1,
          corporateTxnId: 'TXN123',
          credential: { name: 'Test Corp' },
          serviceOperator: { serviceProvider: 'Airtel' },
          order: { amountInINR: '100.00' },
        },
      ],
    };

    transaction.findAndCountAll.mockResolvedValue(mockData);

    const result = await vendorReportExcelCSV(mockParams);

    expect(transaction.findAndCountAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockData);
  });

  it('should call findAndCountAll with vendorId in serviceOperator where clause', async () => {
    const mockParams = {
      vendorId: 'VENDOR123',
      from: '2026-01-01',
      to: '2026-01-31',
    };

    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await vendorReportExcelCSV(mockParams);

    const callArgs = transaction.findAndCountAll.mock.calls[0][0];
    expect(callArgs.include[0].where).toEqual({ vendorId: 'VENDOR123' });
  });

  it('should call findAndCountAll with empty serviceOperator where clause when no vendorId', async () => {
    const mockParams = {
      vendorId: null,
      from: '2026-01-01',
      to: '2026-01-31',
    };

    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await vendorReportExcelCSV(mockParams);

    const callArgs = transaction.findAndCountAll.mock.calls[0][0];
    expect(callArgs.include[0].where).toEqual({});
  });

  it('should return empty array on error', async () => {
    const mockParams = {
      vendorId: null,
      from: '2026-01-01',
      to: '2026-01-31',
    };

    transaction.findAndCountAll.mockRejectedValue(new Error('DB Error'));

    const result = await vendorReportExcelCSV(mockParams);

    expect(result).toEqual([]);
  });
});
