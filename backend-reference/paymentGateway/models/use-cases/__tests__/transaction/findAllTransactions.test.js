const { findAllTransactions } = require('../../transaction');
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

describe('transaction - findAllTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return paginated transactions', async () => {
    const mockParams = {
      corporateId: null,
      from: '2026-01-01',
      to: '2026-12-31',
      start: 0,
      length: 10,
      searchText: '',
      order: 'DESC',
      column: 0,
      details: false,
      categoryName: undefined,
    };

    const mockResult = { count: 1, rows: [{ id: 1 }] };
    transaction.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findAllTransactions(mockParams);

    expect(transaction.findAndCountAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockResult);
  });

  it('should filter by corporateId when provided', async () => {
    const mockParams = {
      corporateId: 'CORP123',
      from: '2026-01-01',
      to: '2026-12-31',
      start: 0,
      length: 10,
      searchText: '',
      order: 'DESC',
      column: 0,
      details: false,
      categoryName: undefined,
    };

    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllTransactions(mockParams);

    expect(transaction.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          credentialId: 'CORP123',
        }),
      })
    );
  });

  it('should use default column when invalid column index provided', async () => {
    const mockParams = {
      corporateId: null,
      from: '2026-01-01',
      to: '2026-12-31',
      start: 0,
      length: 10,
      searchText: '',
      order: 'DESC',
      column: 99, // invalid
      details: false,
      categoryName: undefined,
    };

    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllTransactions(mockParams);

    expect(transaction.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        order: [['createdAt', 'DESC']],
      })
    );
  });

  it('should throw error when DB fails', async () => {
    const mockParams = {
      from: '2026-01-01',
      to: '2026-12-31',
      start: 0,
      length: 10,
      searchText: '',
      order: 'DESC',
      column: 0,
    };

    transaction.findAndCountAll.mockRejectedValue(new Error('DB Error'));

    await expect(findAllTransactions(mockParams)).rejects.toThrow('DB Error');
  });
});
