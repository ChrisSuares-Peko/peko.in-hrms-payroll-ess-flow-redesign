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

  it('should return results with filters and pagination', async () => {
    const mockParams = {
      corporateId: 123,
      from: '2023-01-01',
      to: '2023-12-31',
      searchText: 'test',
      details: true,
      categoryName: 'serviceCategory1'
    };

    const mockResult = { rows: [{ id: 1 }], count: 1 };

    transaction.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findAllTransactions(mockParams);

    expect(transaction.findAndCountAll).toHaveBeenCalledTimes(1);

    expect(transaction.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.arrayContaining([
          expect.objectContaining({
            model: serviceOperator,
            where: expect.objectContaining({
              serviceProvider: 'serviceCategory1'
            })
          }),
          expect.objectContaining({
            model: credential
          }),
          expect.objectContaining({
            model: orders
          })
        ]),
        where: expect.objectContaining({
          credentialId: 123,
          transactionDate: expect.any(Object),
          [Op.or]: expect.any(Array)
        }),
        raw: true,
        nest: true
      })
    );

    expect(result).toEqual(mockResult);
  });

  it('should use default ordering when invalid column index passed', async () => {
    const mockParams = {
      corporateId: 123,
      from: '2023-01-01',
      to: '2023-12-31',
      order: 'ASC',
      column: -1
    };

    const mockResult = { rows: [{ id: 1 }], count: 1 };
    transaction.findAndCountAll.mockResolvedValue(mockResult);

    await findAllTransactions(mockParams);

    expect(transaction.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        order: expect.any(Array)
      })
    );
  });

 it('should make include optional when details flag is false', async () => {
  const mockParams = {
    corporateId: 123,
    from: '2023-01-01',
    to: '2023-12-31',
    details: false
  };

  const mockResult = { rows: [{ id: 1 }], count: 1 };
  transaction.findAndCountAll.mockResolvedValue(mockResult);

  await findAllTransactions(mockParams);

  expect(transaction.findAndCountAll).toHaveBeenCalled();

  const callArgs = transaction.findAndCountAll.mock.calls[0][0];

  // ✅ This is the correct check
  callArgs.include.forEach(includeObj => {
    expect(includeObj.required).toBeUndefined();
  });
});

});
