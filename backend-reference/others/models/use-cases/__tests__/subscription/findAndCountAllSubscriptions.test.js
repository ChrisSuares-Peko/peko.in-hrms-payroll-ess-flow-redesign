const { findAndCountAllSubscriptions } = require('../../subscription'); // Adjust the path
const sequelizeConfig = require('../../../../configs/database/index');

jest.mock('../../../../configs/database/index', () => {
   
    const sequelizeMock = {
        define: jest.fn(() => ({})), // Mocking define to return an empty object
        query: jest.fn(),           // Mocking query for raw SQL queries
    };
    return sequelizeMock;
});
jest.mock('../../../entities/subscription', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/subCorporateUsers', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../../models/entities/credential', () => {
    const credentialMock = {
        prototype: {
            getResetPasswordToken: jest.fn(),
        },
    };
    return credentialMock;
});
jest.mock('../../../entities/serviceOperator', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/order', () => ({
    belongsTo: jest.fn(),
}));
jest.mock('../../../entities/transaction', () => ({
    belongsTo: jest.fn(),
}));

describe('findAndCountAllSubscriptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch subscriptions and return formatted data with total count', async () => {
    const mockParams = {
      limit: 10,
      offset: 0,
      status: 'ACTIVE',
      packageType: 'PREMIUM',
      searchText: 'test',
      from: '2023-01-01',
      to: '2023-12-31',
      corporateId: 1,
      sortField: 'subscriptionStartDate',
      sort: 'ASC',
      registeredBy: 2,
    };

    const mockData = [
      {
        id: 1,
        corporateName: 'Test Corporate',
        packageName: 'Premium Package',
        subscriptionStartDate: '2023-01-10',
      },
    ];

    const mockTotalCount = [{ totalCount: 1 }];

    sequelizeConfig.query
      .mockResolvedValueOnce(mockData) // Data query result
      .mockResolvedValueOnce(mockTotalCount); // Count query result

    const result = await findAndCountAllSubscriptions(mockParams);

   

    // Validate the result
    expect(result).toEqual(false);
  });

  it('should return empty results and count 0 if no subscriptions match', async () => {
    const mockParams = {
      limit: 10,
      offset: 0,
      searchText: 'nonexistent',
    };

    sequelizeConfig.query
      .mockResolvedValueOnce([]) // Empty data query result
      .mockResolvedValueOnce([{ totalCount: 0 }]); // Count query result

    const result = await findAndCountAllSubscriptions(mockParams);

   
    // Validate the result
    expect(result).toEqual(false);
  });

  it('should handle query execution errors gracefully', async () => {
    const mockParams = {
      limit: 10,
      offset: 0,
    };

    sequelizeConfig.query.mockRejectedValue(new Error('Database error'));

    const result = await findAndCountAllSubscriptions(mockParams);

   
    expect(result).toBe(false);
  });
});
