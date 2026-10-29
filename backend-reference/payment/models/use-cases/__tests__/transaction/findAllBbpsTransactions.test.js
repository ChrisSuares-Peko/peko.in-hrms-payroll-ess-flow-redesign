
const transaction = require("../../../entities/transaction");
const serviceOperator = require("../../../entities/serviceOperator");
const credential = require("../../../entities/credential");

const { Op } = require("sequelize");
const { findAllBbpsTransactions } = require("../../transaction");

jest.mock("../../../entities/transaction", () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock("../../../entities/serviceOperator", () => ({}));
jest.mock("../../../entities/credential", () => ({}));

describe("findAllBbpsTransactions Service", () => {
  afterEach(() => jest.clearAllMocks());

  test("should build correct query and return results", async () => {
    const mockResult = { rows: [], count: 0 };
    transaction.findAndCountAll.mockResolvedValue(mockResult);

    const params = {
      from: new Date("2024-01-01"),
      to: new Date("2024-01-05"),
      categoryNames: ["BBPS", "RECHARGE"],
      searchText: "abc",
      sort: "DESC",
      filter: "SUCCESS",
      limit: 10,
      offset: 0,
      corporateId: 100,
      credentialAttribute: ["id", "name"],
      transactionAttribute: ["id", "corporateTxnId"],
      orderAttribute: ["id", "paymentMode"],
      sortField: "transactionDate",
      subCorporateUserId: 200,
      productId: 55,
    };

    const result = await findAllBbpsTransactions(params);

    const tomorrow = new Date("2024-01-06");
    tomorrow.setHours(0, 0, 0, 0);

    expect(transaction.findAndCountAll).toHaveBeenCalled();

    const [query] = transaction.findAndCountAll.mock.calls[0];

    // Verify WHERE clause core logic
    expect(query.where.transactionDate).toEqual({
      [Op.between]: [params.from, tomorrow],
    });

    expect(query.where.credentialId).toBe(100);
    expect(query.where["$order.subCorporateUserId$"]).toBe(200);

    // ServiceOperator includes category filter
    expect(query.include[0]).toEqual({
      model: serviceOperator,
      attributes: ["serviceProvider"],
      where: {
        serviceProvider: { [Op.in]: ["BBPS", "RECHARGE"] }
      }
    });

    // Credential include
    expect(query.include[1]).toEqual({
      model: credential,
      attributes: ["id", "name"],
    });

    // Orders include
    expect(query.include[2].attributes).toEqual(["id", "paymentMode"]);
    expect(query.include[2].where.status).toEqual("SUCCESS");
    expect(query.include[2].where.orderResponse).toEqual({ [Op.ne]: null });

    // Product ID applied via JSON_EXTRACT literal
    expect(query.include[2].where[Op.and][0].val.toString()).toContain(
      "JSON_EXTRACT(`order`.`orderResponse`, '$.emailDomainsDetails.softwaresSubscriptionId')"
    );

    // Sort
    expect(query.order).toEqual([["transactionDate", "DESC"]]);

    // Attributes
    expect(query.attributes).toEqual(["id", "corporateTxnId"]);

    // Pagination
    expect(query.limit).toBe(10);
    expect(query.offset).toBe(0);

    expect(result).toEqual(mockResult);
  });

  test("should remove category filter when categoryNames is empty", async () => {
    transaction.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await findAllBbpsTransactions({
      from: new Date(),
      to: new Date(),
      categoryNames: [],
      searchText: "",
      sort: "ASC",
      limit: 5,
      offset: 0,
      credentialAttribute: [],
      transactionAttribute: [],
      orderAttribute: [],
      sortField: "id",
    });

    const [query] = transaction.findAndCountAll.mock.calls[0];
    expect(query.include[0].where).toBeUndefined();
  });

  test("should remove status filter when filter = undefined", async () => {
    transaction.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await findAllBbpsTransactions({
      from: new Date(),
      to: new Date(),
      categoryNames: null,
      searchText: "",
      sort: "ASC",
      limit: 5,
      offset: 0,
      credentialAttribute: [],
      transactionAttribute: [],
      orderAttribute: [],
      sortField: "id",
    });

    const [query] = transaction.findAndCountAll.mock.calls[0];

    expect(query.include[2].where.status).toBeUndefined();
  });

  test("should throw error on DB error", async () => {
    transaction.findAndCountAll.mockRejectedValue(new Error("DB FAIL"));

    await expect(
      findAllBbpsTransactions({
        from: new Date(),
        to: new Date(),
        categoryNames: ["A"],
        searchText: "x",
        sort: "ASC",
        limit: 5,
        offset: 0,
        credentialAttribute: [],
        transactionAttribute: [],
        orderAttribute: [],
        sortField: "id",
      })
    ).rejects.toThrow("DB FAIL");
  });
});
