const sequelizeConfig = require("../../../../configs/database/index");
const { findLastFiveTransactions } = require("../../serviceOperator");

jest.mock('../../../entities/serviceOperator',()=>({
  belongsTo:jest.fn()
}));

jest.mock("../../../../configs/database/index", () => ({
  query: jest.fn(),
  QueryTypes: {
    SELECT: "SELECT"
  },
  define:jest.fn()
}));

describe("findLastFiveTransactions Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should execute query with correct SQL and replacements", async () => {
    const mockResult = [
      {
        id: 1,
        amount: 100,
        totalCount: 12
      }
    ];

    sequelizeConfig.query.mockResolvedValue(mockResult);

    const params = {
      userId: "USER123",
      length: 5,
      serviceProvider: "AIRTEL",
      status: ["success", "failed"],
      orderCol: "createdAt",
      order: "DESC"
    };

    const result = await findLastFiveTransactions(params);

    expect(sequelizeConfig.query).toHaveBeenCalled();

    const [executedQuery, queryOptions] =
      sequelizeConfig.query.mock.calls[0];

    // Validate replacements
    expect(queryOptions).toEqual({
      type: "SELECT",
      replacements: {
        userId: "USER123",
        length: 5,
        serviceProvider: "AIRTEL",
        status: ["success", "failed"]
      }
    });

    // Validate SQL contains essential pieces
    expect(executedQuery).toContain("SELECT COUNT(*)");
    expect(executedQuery).toContain("FROM reportAll");
    expect(executedQuery).toContain("WHERE credentialId = :userId");
    expect(executedQuery).toContain("serviceProvider = :serviceProvider");
    expect(executedQuery).toContain("status IN (:status)");
    expect(executedQuery).toContain("ORDER BY createdAt DESC");
    expect(executedQuery).toContain("LIMIT :length");

    expect(result).toEqual(mockResult);
  });

  test("should handle empty result set", async () => {
    sequelizeConfig.query.mockResolvedValue([]);

    const params = {
      userId: "USER123",
      length: 5,
      serviceProvider: "AIRTEL",
      status: ["success"],
      orderCol: "createdAt",
      order: "ASC"
    };

    const result = await findLastFiveTransactions(params);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([]);
  });

  test("should handle DB errors gracefully", async () => {
    sequelizeConfig.query.mockRejectedValue(new Error("DB ERROR"));

    const params = {
      userId: "USER123",
      length: 5,
      serviceProvider: "AIRTEL",
      status: ["success"],
      orderCol: "createdAt",
      order: "ASC"
    };

    // asyncHandler converts thrown error → rejected promise
    await expect(findLastFiveTransactions(params)).rejects.toThrow("DB ERROR");
  });

  test("should apply dynamic ORDER BY and LIMIT", async () => {
    sequelizeConfig.query.mockResolvedValue([]);

    const params = {
      userId: "U1",
      length: 3,
      serviceProvider: "DU",
      status: ["pending"],
      orderCol: "amount",
      order: "DESC"
    };

    await findLastFiveTransactions(params);

    const [executedQuery] = sequelizeConfig.query.mock.calls[0];

    expect(executedQuery).toContain("ORDER BY amount DESC");
    expect(executedQuery).toContain("LIMIT :length");
  });
});
