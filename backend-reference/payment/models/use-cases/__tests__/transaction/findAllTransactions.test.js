const { findAllTransactions } = require('../../transaction');
const transaction = require('../../../entities/transaction');
const serviceOperator = require('../../../entities/serviceOperator');
const credential = require('../../../entities/credential');
const orders = require('../../../entities/order');
const { Op } = require('sequelize');

jest.mock('../../../entities/transaction');
jest.mock('../../../entities/serviceOperator');
jest.mock('../../../entities/credential');
jest.mock('../../../entities/order');

describe('findAllTransactions', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return result with correct include, where and order', async () => {
    const mockParams = {
      from: '2023-01-01',
      to: '2023-12-31',
      corporateId: 123,
      searchText: 'test',
      categoryName: 'serviceCategory1',
      limit: 10,
      offset: 0,
      sort: 'ASC',
      sortField: 'transactionDate'
    };

    const mockResult = { rows: [{ id: 1 }], count: 1 };
    transaction.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findAllTransactions(mockParams);

    expect(transaction.findAndCountAll).toHaveBeenCalledTimes(1);

    expect(transaction.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 10,
        offset: 0,
        order: [['transactionDate', 'ASC']],
        where: expect.objectContaining({
          credentialId: 123,
          [Op.or]: expect.any(Array)
        }),
        include: expect.arrayContaining([
          expect.objectContaining({
            model: serviceOperator,
            where: { serviceProvider: 'serviceCategory1' }
          }),
          expect.objectContaining({
            model: credential
          }),
          expect.objectContaining({
            model: orders,
            where: expect.objectContaining({
              orderResponse: { [Op.ne]: null }
            })
          })
        ])
      })
    );

    expect(result).toEqual(mockResult);
  });

  it('should set default sort ASC when sort is not provided', async () => {
    const mockParams = {
      sortField: 'transactionDate'
    };

    transaction.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await findAllTransactions(mockParams);

    expect(transaction.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        order: [['transactionDate', 'ASC']]
      })
    );
  });

  it('should apply subCorporateUserId filter when provided', async () => {
    const mockParams = {
      subCorporateUserId: 500,
      sortField: 'id'
    };

    transaction.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await findAllTransactions(mockParams);

    expect(transaction.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ['$order.subCorporateUserId$']: 500
        })
      })
    );
  });

});
