const { findAllOrdersCount } = require('../../transaction'); 
const orders = require('../../../entities/order');
const serviceOperator = require('../../../entities/serviceOperator');
const credential = require('../../../entities/credential');
const { Op } = require('sequelize');

jest.mock('../../../entities/order', () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock('../../../entities/serviceOperator', () => ({}));
jest.mock('../../../entities/credential', () => ({}));

jest.mock('../../../../utils/sortHandle', () => ({
  handleSortFields: jest.fn(() => [['transactionDate', 'DESC']]),
}));

describe('findAllOrdersCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return orders with correct filters', async () => {
    const params = {
      start: 0,
      from: '2026-02-01',
      to: '2026-02-05',
      length: 10,
      searchText: 'test',
      sort: 'DESC',
      sortField: 'transactionDate',
      status: 'SUCCESS',
    };
    const statusAlt = 'COMPLETED';

    const mockResult = {
      count: 2,
      rows: [
        { id: 1, amountInINR: 100 },
        { id: 2, amountInINR: 200 },
      ],
    };

    orders.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findAllOrdersCount(params, statusAlt);

    expect(orders.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        attributes: expect.arrayContaining([
          'id',
          'transactionDate',
          'orderResponse',
          'amountInINR',
          'ecomOrderStatus',
          'status',
          'corporateTxnId',
          'workspaceOrderStatus',
          'paymentMode',
        ]),
        include: expect.arrayContaining([
          expect.objectContaining({
            model: serviceOperator,
            attributes: ['serviceProvider'],
            where: { serviceCategory: 'Office Supplies' },
          }),
          expect.objectContaining({
            model: credential,
            attributes: ['name', 'username'],
          }),
        ]),
        where: expect.objectContaining({
          [Op.or]: expect.any(Array),
          transactionDate: {
            [Op.between]: [expect.any(Date), expect.any(Date)],
          },
          ecomOrderStatus: 'SUCCESS',
          workspaceOrderStatus: 'COMPLETED',
        }),
        limit: 10,
        offset: 0,
        raw: true,
        nest: true,
        order: [['transactionDate', 'DESC']],
      })
    );

    expect(result).toEqual(mockResult);
  });

  it('should throw error if findAndCountAll fails', async () => {
    const error = new Error('DB Error');
    orders.findAndCountAll.mockRejectedValue(error);

    const params = { start: 0, length: 5, searchText: '' };

    await expect(findAllOrdersCount(params)).rejects.toEqual({
      message: 'Something went wrong',
    });
  });
});
