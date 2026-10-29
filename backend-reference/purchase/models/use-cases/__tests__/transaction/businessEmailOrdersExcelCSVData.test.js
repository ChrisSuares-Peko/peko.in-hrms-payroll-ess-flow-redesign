const { businessEmailOrdersExcelCSVData } = require('../../../use-cases/transaction');
const transaction = require('../../../entities/transaction');
const { Op } = require('sequelize');

jest.mock('../../../entities/transaction', () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock('../../../entities/order', () => ({}));
jest.mock('../../../entities/serviceOperator', () => ({}));
jest.mock('../../../entities/credential', () => ({}));

describe('businessEmailOrdersExcelCSVData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch transactions and return formatted result', async () => {
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
      serviceAttribute: ['id', 'serviceProvider'],
      credentialAttribute: ['id', 'name'],
      transactionAttribute: ['id', 'transactionDate', 'amount'],
      orderAttribute: ['id', 'status', 'amountInINR', 'orderResponse'],
    };

    const mockTransactions = {
      count: 2,
      rows: [
        {
          id: 1,
          transactionDate: new Date('2024-01-10'),
          credential: { name: 'John Doe', email: 'john@example.com' },
          order: {
            amountInINR: 5000,
            orderResponse: JSON.stringify({
              emailDomainsDetails: { name: 'Premium', softwares_subscription: { name: 'G-Suite' } },
              formDetails: { numberOfUsers: 10 },
              billingType: 'Annual',
            }),
          },
          status: 'Completed',
        },
      ],
    };

    transaction.findAndCountAll.mockResolvedValue(mockTransactions);

    const result = await businessEmailOrdersExcelCSVData(mockParams);

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

    expect(result).toEqual([
      {
        'Purchased On': '2024-01-10 05:30:00',
        'Company Name': 'John Doe',
        'Email ID': 'john@example.com',
        Product: 'G-Suite',
        Plan: 'Premium',
        'Billing Cycle': 'Annual',
        Amount: '5000.00 ₹',
        'No. of Email Accounts': 10,
        Status: 'Completed',
      },
    ]);
  });

  it('should return an empty array when no transactions are found', async () => {
    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const result = await businessEmailOrdersExcelCSVData({ searchText: 'test' });

    expect(result).toEqual([]);
  });

  it('should handle errors and throw an exception', async () => {
    const mockError = new Error('Database error');
    transaction.findAndCountAll.mockRejectedValue(mockError);

    await expect(businessEmailOrdersExcelCSVData({})).rejects.toThrow('Database error');
  });
});
