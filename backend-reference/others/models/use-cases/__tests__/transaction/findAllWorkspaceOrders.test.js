const { findAllWorkspaceOrders } = require('../../transaction'); 
const { Op } = require('sequelize');
const orders = require('../../../entities/order'); 

// Mock the imported modules
jest.mock('../../../entities/order', () => ({
  findAndCountAll: jest.fn()
}));
jest.mock('../../../entities/serviceOperator'); 
jest.mock('../../../entities/credential'); 
jest.mock('../../../../utils/sortHandle', () => ({
  handleSortFields: jest.fn()
}));

describe('findAllWorkspaceOrders', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockParams = {
    from: new Date('2023-01-01'),
    to: new Date('2023-01-31'),
    limit: 10,
    offset: 0,
    searchText: 'workspace',
    sort: 'ASC',
    sortField: 'transactionDate',
  };

  const mockOrderResponse = {
    rows: [
      {
        id: '1',
        corporateTxnId: 'CORP001',
        operatorId: 'OP123',
        amountInInr: '1000',
        status: 'Success',
        credential: { name: 'Test User', username: 'testuser' },
      },
    ],
    count: 1,
  };


  it('should correctly adjust the "to" date to the end of the day', async () => {
    const paramsWithToDate = { ...mockParams, to: new Date('2023-01-15') };

    const tomorrow = new Date('2023-01-15');
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    orders.findAndCountAll.mockResolvedValue(mockOrderResponse);

    await findAllWorkspaceOrders(paramsWithToDate);

    expect(orders.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          transactionDate: { [Op.between]: [paramsWithToDate.from, tomorrow] },
        }),
      })
    );
  });

  it('should include the search text in the "where" clause', async () => {
    orders.findAndCountAll.mockResolvedValue(mockOrderResponse);

    await findAllWorkspaceOrders(mockParams);

    expect(orders.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          [Op.or]: expect.arrayContaining([
            { id: { [Op.like]: '%workspace%' } },
            // literal(
            //   `LOWER(JSON_EXTRACT(\`orderResponse\`, '$.planDetails.name')) LIKE LOWER('%workspace%')`
            // ),
          ]),
        }),
      })
    );
  });
});
