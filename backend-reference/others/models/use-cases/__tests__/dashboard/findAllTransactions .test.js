const transaction = require('../../../entities/transaction');
const orders = require('../../../entities/order');
const serviceOperator = require('../../../entities/serviceOperator');
const { Op } = require('sequelize');
const { findAllTransactions } = require('../../dashboard');


jest.mock('../../../entities/transaction', () => ({
  findAll: jest.fn(),
}));

jest.mock('../../../entities/order', () => ({}));
jest.mock('../../../entities/serviceOperator', () => ({}));


describe('findAllTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all SUCCESS transactions excluding REFUND entries', async () => {
    const params = { corporateId: 55 };
    const mockResponse = [
      { id: 1, remarks: "OK", credentialId: 55 }
    ];

    transaction.findAll.mockResolvedValue(mockResponse);

    const result = await findAllTransactions(params);

    expect(transaction.findAll).toHaveBeenCalledWith({
      where: {
        [Op.and]: [
          {
            credentialId: params.corporateId,
            status: 'SUCCESS',
            [Op.not]: [
              { remarks: 'REFUND' },
              { remarks: 'REFUNDED' }
            ]
          }
        ]
      },
      attributes: [],
      include: [
        {
          model: orders,
          attributes: [
            'paymentMode',
            'transactionDate',
            'amountInINR',
            'status',
            'baseAmount'
          ]
        },
        {
          model: serviceOperator,
          attributes: ['serviceProvider', 'id', 'serviceCategory']
        }
      ],
      order: [['transactionDate', 'DESC']]
    });

    expect(result).toBe(mockResponse);
  });

  it('should return an empty array when no transactions exist', async () => {
    transaction.findAll.mockResolvedValue([]);

    const result = await findAllTransactions({ corporateId: 1 });

    expect(result).toEqual([]);
  });

  it('should throw an error if transaction.findAll fails', async () => {
    const error = new Error("DB Failure");
    transaction.findAll.mockRejectedValue(error);

    await expect(findAllTransactions({ corporateId: 1 }))
      .rejects
      .toThrow("DB Failure");
  });

  it('should throw when params is undefined', async () => {
    await expect(findAllTransactions(undefined)).rejects.toThrow();
  });

  it('should throw if corporateId is missing', async () => {
    await expect(findAllTransactions({})).rejects.toThrow();
  });
});