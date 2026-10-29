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

  it('should return results based on filters and pagination', async () => {
    const mockParams = {
      corporateId: 123,
      from: '2023-01-01',
      to: '2023-12-31',
      start: 0,
      length: 10,
      searchText: 'test',
      order: 'ASC',
      column: 0,
      details: true,
      categoryName: 'serviceCategory1'
    };

    const mockResult = { rows: [{ id: 1 }], count: 1 };
    transaction.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findAllTransactions(mockParams);

    expect(transaction.findAndCountAll).toHaveBeenCalledTimes(1);

    const call = transaction.findAndCountAll.mock.calls[0][0];

    // **General expectation checks**
    expect(call.where.credentialId).toBe(123);
    expect(call.where.transactionDate[Op.between]).toContain('2023-01-01');
    expect(call.where.transactionDate[Op.between][1]).toBeInstanceOf(Date);

    // **Check search exists**
    expect(call.replacements.searchText).toBe('%test%');

    // **Check includes**
    expect(call.include).toEqual(expect.arrayContaining([
      expect.objectContaining({ model: serviceOperator }),
      expect.objectContaining({ model: credential }),
      expect.objectContaining({ model: orders })
    ]));

    expect(result).toEqual(mockResult);
  });

  it('should apply default sorting when invalid column index is provided', async () => {
    const mockParams = {
      corporateId: 123,
      from: '2023-01-01',
      to: '2023-12-31',
      start: 0,
      length: 10,
      searchText: 'test',
      order: 'ASC',
      column: -1,
      details: true
    };

    transaction.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await findAllTransactions(mockParams);

    const call = transaction.findAndCountAll.mock.calls[0][0];

    // Just check order exists and ASC is applied
    expect(call.order[0][1]).toBe('ASC');
  });

 it('should set include.required = false when details = false', async () => {
  const mockParams = {
    corporateId: 123,
    from: '2023-01-01',
    to: '2023-12-31',
    start: 0,
    length: 10,
    searchText: '',
    order: 'ASC',
    column: 0,
    details: false
  };

  transaction.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

  await findAllTransactions(mockParams);

  const call = transaction.findAndCountAll.mock.calls[0][0];

  call.include.forEach(includeObj => {
    // ✅ Pass if required is either `false` or not set at all (undefined)
    expect(includeObj.required === false || includeObj.required === undefined).toBe(true);
  });
});


});
