const { findAllTransactions } = require('../../../use-cases/transaction');
const transaction = require('../../../entities/transaction');
const { Op } = require('sequelize');

jest.mock('../../../entities/transaction', () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock('../../../entities/order', () => ({}));
jest.mock('../../../entities/serviceOperator', () => ({}));
jest.mock('../../../entities/credential', () => ({}));

describe('findAllTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch transactions and return the expected result', async () => {
    const mockParams = {
      from: '2024-01-01',
      to: '2024-01-31',
      searchText: 'test',
      sort: 'DESC',
      sortField: 'transactionDate',
      categoryName: 'Banking',
      filter: 'Completed',
      limit: 10,
      offset: 0,
      corporateId: 1,
      subCorporateUserId: 2,
      productId: 123,
      serviceAttribute: ['id', 'serviceProvider'],
      credentialAttribute: ['id', 'name'],
      transactionAttribute: ['id', 'transactionDate', 'amount'],
      orderAttribute: ['id', 'status'],
    };

    const mockTransactions = {
      count: 2,
      rows: [
        {
          id: 1,
          transactionDate: new Date('2024-01-10'),
          amount: 100,
          '$order.status$': 'Completed',
          '$credential.name$': 'John Doe',
        },
        {
          id: 2,
          transactionDate: new Date('2024-01-15'),
          amount: 200,
          '$order.status$': 'Completed',
          '$credential.name$': 'Jane Smith',
        },
      ],
    };

    transaction.findAndCountAll.mockResolvedValue(mockTransactions);

    const result = await findAllTransactions(mockParams);

    expect(transaction.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          transactionDate: expect.objectContaining({ [Op.between]: expect.any(Array) }),
          credentialId: 1,
          '$order.subCorporateUserId$': 2,
        }),
        order: [['transactionDate', 'DESC']],
        limit: 10,
        offset: 0,
        raw: true,
        nest: true,
      })
    );

    expect(result).toEqual(mockTransactions);
  });

  it('should handle errors and throw an exception', async () => {
    const mockParams = { from: '2024-01-01', to: '2024-01-31', searchText: 'test' };
    const mockError = new Error('Database error');
    transaction.findAndCountAll.mockRejectedValue(mockError);

    await expect(findAllTransactions(mockParams)).rejects.toThrow('Database error');

    expect(transaction.findAndCountAll).toHaveBeenCalled();
  });
});
