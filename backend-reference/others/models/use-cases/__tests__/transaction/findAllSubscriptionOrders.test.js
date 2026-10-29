const { findAllSubscriptionOrders } = require('../../transaction');
const orders = require('../../../entities/order');
const serviceOperator = require('../../../entities/serviceOperator');
const credential = require('../../../entities/credential');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

jest.mock('../../../entities/order', () => ({
  findAndCountAll: jest.fn(),
}));
jest.mock('../../../entities/serviceOperator');
jest.mock('../../../entities/credential');

describe('findAllSubscriptionOrders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call orders.findAndCountAll with correct parameters and return formatted data', async () => {
    const params = {
      from: '2024-01-01',
      to: '2024-01-31',
      limit: 10,
      offset: 0,
      searchText: 'test',
      sort: 'DESC',
      sortField: 'transactionDate',
      corporateId: 'corp1',
      registeredBy: 'user1',
    };

    const mockData = {
      count: 1,
      rows: [
        {
          id: '1',
          transactionDate: '2024-01-15T12:00:00Z',
          corporateTxnId: 'txn123',
          operatorId: 'op123',
          amountInINR: '100',
          baseAmount: '50',
          baseCurrency: 'USD',
          exchangeRate: '1.0',
          status: 'completed',
          paymentMode: 'credit',
          credential: {
            name: 'Test User',
            email: 'testuser@example.com',
            username: 'testuser',
            registeredByCredential: { name: 'Admin User' },
          },
          message: 'test message',
          orderResponse: '{"subscriptionDetails": {"name": "Subscription Name"}}',
        },
      ],
    };

    orders.findAndCountAll.mockResolvedValue(mockData);

    const result = await findAllSubscriptionOrders(params);

    // Calculate end of day for the 'to' date as done in the function.
    const endOfDay = new Date(params.to);
    endOfDay.setDate(endOfDay.getDate() + 1);
    endOfDay.setHours(0, 0, 0, 0);

    expect(orders.findAndCountAll).toHaveBeenCalledWith({
      attributes: [
        "id",
        "createdAt",
        "transactionDate",
        "corporateTxnId",
        "orderResponse",
        "paymentMode",
        "amountInINR",
        "status",
      ],
      include: [
        {
          model: serviceOperator,
          attributes: ["serviceProvider"],
          where: {
            serviceCategory: "Softwares",
          },
        },
        {
          model: credential,
          attributes: ["name", "email", "username"],
          where: { registeredBy: "user1" },
          include: [
            {
              model: credential,
              as: "registeredByCredential",
              attributes: ["name"],
            },
          ],
        },
      ],
      where: {
        transactionDate: {
          [Op.between]: [params.from, endOfDay],
        },
        [Op.or]: [
          { id: { [Op.like]: "%test%" } },
          { corporateTxnId: { [Op.like]: "%test%" } },
          { operatorId: { [Op.like]: "%test%" } },
          { amountInINR: { [Op.like]: "%test%" } },
          { baseAmount: { [Op.like]: "%test%" } },
          { baseCurrency: { [Op.like]: "%test%" } },
          { exchangeRate: { [Op.like]: "%test%" } },
          { status: { [Op.like]: "%test%" } },
          { paymentMode: { [Op.like]: "%test%" } },
          { "$credential.name$": { [Op.like]: "%test%" } },
          { "$credential.username$": { [Op.like]: "%test%" } },
          { message: { [Op.like]: "%test%" } },
          sequelize.literal("LOWER(JSON_EXTRACT(`orderResponse`, '$.subscriptionDetails.name')) LIKE LOWER(:searchText)"),
        ],
        credentialId: "corp1",
      },
      order: [[params.sortField, params.sort]],
      limit: params.limit,
      offset: params.offset,
      replacements: { searchText: `%${params.searchText}%` },
      raw: true,
      nest: true,
    });

    expect(result).toEqual({
      count: 1,
      rows: mockData.rows,
    });
  });

  it('should handle errors properly', async () => {
    const params = {
      from: '2024-01-01',
      to: '2024-01-31',
      limit: 10,
      offset: 0,
      searchText: 'test',
      sort: 'DESC',
      sortField: 'transactionDate',
      corporateId: 'corp1',
      registeredBy: 'user1',
    };
    const errorMessage = 'DB Error';
    orders.findAndCountAll.mockRejectedValue(new Error(errorMessage));
  
    await expect(findAllSubscriptionOrders(params)).rejects.toEqual({ message: 'Something went wrong' });
  });
  
  
  
});
