// Mock the database config to expose Sequelize (used by getCustomerDashboard for fn/col/literal)
jest.mock('../../../../configs/database/index', () => ({
  Sequelize: require('sequelize'),
  define: jest.fn().mockImplementation(() => ({})),
  sync: jest.fn(),
}));

const { getCustomerDashboard } = require('../../invoiceCustomerV2');
const InvoiceCustomerV2 = require('../../../entities/invoiceCustomerV2');
const invoicingV2 = require('../../../entities/invoicingV2');

jest.mock('../../../entities/invoiceCustomerV2', () => ({
  count: jest.fn(),
  belongsTo: jest.fn(),
  hasMany: jest.fn(),
}));
jest.mock('../../../entities/invoicingV2', () => ({
  count: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
  sum: jest.fn(),
  belongsTo: jest.fn(),
  hasMany: jest.fn(),
}));

describe('getCustomerDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return correct dashboard metrics when data exists', async () => {
    const corporateUserId = 10;

    // totalCustomers
    InvoiceCustomerV2.count
      .mockResolvedValueOnce(50)    // totalCustomers
      .mockResolvedValueOnce(30);   // activeCustomers

    // revenueResult
    invoicingV2.findOne.mockResolvedValue({ totalRevenue: '100000', paidCount: '20' });

    // totalInvoiceCount
    invoicingV2.count.mockResolvedValue(40);

    // topByRevenue
    invoicingV2.findAll
      .mockResolvedValueOnce([
        { customerId: 1, totalRevenue: '50000', transactionCount: '10', invoiceCustomerV2: { name: 'Alpha Corp' } },
      ])
      // topByTransactions
      .mockResolvedValueOnce([
        { customerId: 2, transactionCount: '15', totalRevenue: '30000', invoiceCustomerV2: { name: 'Beta Corp' } },
      ]);

    // sum calls for month comparison (thisMonth, lastMonth per customer)
    invoicingV2.sum
      .mockResolvedValueOnce(20000)   // thisMonth for Alpha
      .mockResolvedValueOnce(15000);  // lastMonth for Alpha

    const result = await getCustomerDashboard(corporateUserId);

    expect(InvoiceCustomerV2.count).toHaveBeenCalledTimes(2);
    expect(invoicingV2.findOne).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      totalCustomers: 50,
      activeCustomers: 30,
      totalRevenue: 100000,
      avgTransaction: 5000,
      topByRevenue: expect.arrayContaining([
        expect.objectContaining({ customerId: 1, name: 'Alpha Corp', totalRevenue: 50000 }),
      ]),
      topByTransactions: expect.arrayContaining([
        expect.objectContaining({ customerId: 2, name: 'Beta Corp', transactionCount: 15 }),
      ]),
    });
  });

  it('should return all zeros when no data exists', async () => {
    const corporateUserId = 10;

    InvoiceCustomerV2.count.mockResolvedValue(0);
    invoicingV2.findOne.mockResolvedValue({ totalRevenue: null, paidCount: null });
    invoicingV2.count.mockResolvedValue(0);
    invoicingV2.findAll.mockResolvedValue([]);
    invoicingV2.sum.mockResolvedValue(null);

    const result = await getCustomerDashboard(corporateUserId);

    expect(result).toEqual({
      totalCustomers: 0,
      activeCustomers: 0,
      totalRevenue: 0,
      avgTransaction: 0,
      topByRevenue: [],
      topByTransactions: [],
    });
  });

  it('should throw an error if database query fails', async () => {
    const corporateUserId = 10;

    const expectedError = new Error('Database error');

    InvoiceCustomerV2.count.mockRejectedValue(expectedError);

    await expect(getCustomerDashboard(corporateUserId)).rejects.toThrow('Database error');
  });
});
