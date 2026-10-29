const { packageCashbackAndCountExport } = require('../../cashback');
const { QueryTypes } = require('sequelize');
const sequelizeConfig =require('../../../../configs/database/index')

jest.mock('../../../../configs/database/index', () => ({
  query: jest.fn(),
}));
jest.mock('../../../entities/cashback', () => ({
    findAndCountAll: jest.fn(),
}));

describe('packageCashbackAndCountExport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return formatted data when query returns results', async () => {
    const mockParams = {
      searchText: 'test',
      sort: 'ASC',
      sortField: 'cashbackType',
      partnerId: 'default',
    };

    const mockQueryResult = [
      {
        createdAt: '2024-02-18T10:00:00Z',
        serviceProvider: 'Test Provider',
        cashbackType: 'FLAT',
        packageName: 'Test Package',
        vendorName: 'Test Vendor',
        partnerName: 'Test Partner',
        surcharge: 50,
        cashback: 10,
        baseLimit: 100,
        unitPrice: 200,
        serviceStatus: 1,
      },
    ];

    sequelizeConfig.query.mockResolvedValue(mockQueryResult);
    
    const result = await packageCashbackAndCountExport(mockParams);
    
    expect(sequelizeConfig.query).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      replacements: { searchText: '%test%' },
      type: QueryTypes.SELECT,
      raw: true,
      nest: true,
    }));

    expect(result).toEqual([
      {
        Date: expect.any(String),
        "Service Operator": 'Test Provider',
        "Commision Type": 'FLAT',
        "Package Name": 'Test Package',
        "Vendor Name": 'Test Vendor',
        "Partner Name": 'Test Partner',
        "Surcharge": "₹ 50.00",
        Cashback: '10₹',
        "Base Limit": 100,
        "Unit Price": 200,
        Status: 'Active',
      },
    ]);
  });

  it('should return an empty array if query returns no results', async () => {
    sequelizeConfig.query.mockResolvedValue([]);
    
    const result = await packageCashbackAndCountExport({ searchText: '', sort: 'ASC', sortField: 'cashbackType' });
    
    expect(result).toEqual([]);
  });

  it('should throw an error when query fails', async () => {
    sequelizeConfig.query.mockRejectedValue(new Error('DB error'));

    await expect(packageCashbackAndCountExport({ searchText: '', sort: 'ASC', sortField: 'cashbackType' }))
      .rejects.toEqual({ message: 'Something went wrong' });
  });
});
