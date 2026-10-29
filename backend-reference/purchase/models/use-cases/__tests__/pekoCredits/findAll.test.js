const { findAll } = require("../../pekoCredits");
const sequelizeConfig = require('../../../../configs/database/index');

// Mock the sequelize models and associations
jest.mock('../../../../configs/database/index', () => ({
  query: jest.fn(),
  define: jest.fn(() => ({
    belongsTo: jest.fn(),
    hasMany: jest.fn(),
  })),
}));

// Mock the serviceOperators model
jest.mock('../../../entities/serviceOperator', () => {
  return {
    belongsTo: jest.fn(),
    hasMany: jest.fn(),
  };
});

// Mock the pekoCredits model
jest.mock('../../../entities/pekoCredits', () => {
  return {
    belongsTo: jest.fn(),
    hasMany: jest.fn(),
  };
});

jest.mock('../../../entities/credential', () => {
  return {
    prototype: {
      getResetPasswordToken: jest.fn(), // Mock the prototype method
    },
    belongsTo: jest.fn(),
    hasMany: jest.fn(),
  };
});

jest.mock('../../../entities/corporateUser', () => {
  return {
    belongsTo: jest.fn(),
    hasMany: jest.fn(),
  };
});

// Mock the userCoupons model
jest.mock('../../../entities/userCoupons', () => {
  return {
    belongsTo: jest.fn(),
    hasMany: jest.fn(),
  };
});

// Mock the SubCorporateUser model
jest.mock('../../../entities/subCorporateUsers', () => {
  return {
    belongsTo: jest.fn(),
    hasOne: jest.fn(), // Mock the hasOne method
    hasMany: jest.fn(),
  };
});

// Mock the cart model
jest.mock('../../../entities/cart', () => {
  return {
    belongsTo: jest.fn(),
    hasMany: jest.fn(),
  };
});

// Mock the order model
jest.mock('../../../entities/order', () => {
  return {
    belongsTo: jest.fn(),
    hasMany: jest.fn(),
  };
});

// Mock the sortHandle utility
jest.mock('../../../../utils/sortHandle', () => {
  return jest.fn(); // Mock the utility if needed
});

describe('findAll', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return data and count when query is successful', async () => {
    const mockData = [{ id: 1, name: 'Test' }];
    const mockCount = [{ totalCount: 1 }];

    sequelizeConfig.query
      .mockResolvedValueOnce(mockData) // Mock the data query
      .mockResolvedValueOnce(mockCount); // Mock the count query

    const params = {
      limit: 10,
      offset: 0,
      searchText: 'test',
      sort: 'ASC',
      sortField: 'packages.id',
    };

    const result = await findAll(params);

    expect(sequelizeConfig.query).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      rows: mockData,
      count: mockCount[0].totalCount,
    });
  });

  it('should throw an error when query fails', async () => {
    const mockError = new Error('Database error');

    sequelizeConfig.query.mockRejectedValueOnce(mockError);

    const params = {
      limit: 10,
      offset: 0,
      searchText: 'test',
      sort: 'ASC',
      sortField: 'packages.id',
    };

    await expect(findAll(params)).rejects.toThrow('Something went wrong');
  });

  const baseParams = {
    limit: 10,
    offset: 0,
    searchText: 'test',
    sort: 'ASC',
    sortField: 'packages.id',
  };

  const runFindAll = async (params) => {
    sequelizeConfig.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ totalCount: 0 }]);
    await findAll(params);
    return sequelizeConfig.query.mock.calls;
  };

  it('does not filter by partner when no partnerId is given', async () => {
    const calls = await runFindAll(baseParams);

    calls.forEach(([sql, options]) => {
      expect(sql).not.toContain('AND pc.partnerId');
      expect(options.replacements).not.toHaveProperty('partnerId');
    });
  });

  it('filters on the partner id when one is given', async () => {
    const calls = await runFindAll({ ...baseParams, partnerId: 42 });

    calls.forEach(([sql, options]) => {
      expect(sql).toContain('AND pc.partnerId = :partnerId');
      expect(options.replacements.partnerId).toBe(42);
    });
  });

  it('filters on rows with no partner when partnerId is default', async () => {
    const calls = await runFindAll({ ...baseParams, partnerId: 'default' });

    calls.forEach(([sql, options]) => {
      expect(sql).toContain('AND pc.partnerId IS NULL');
      expect(options.replacements).not.toHaveProperty('partnerId');
    });
  });
});