const { findAllRecordsOrderListAndCount } = require("../../verificationSuite");

const transaction = require("../../../entities/transaction");

jest.mock("../../../../configs/database/index", () => ({
  Sequelize: {
    Op: {
      in: Symbol("in"),
      like: Symbol("like"),
      between: Symbol("between"),
      and: Symbol("and"),
      or: Symbol("or"),
    },
    literal: (v) => ({ val: v }),
    where: (attr, logic) => ({ attribute: attr, comparator: "=", logic }),
  },
  define: jest.fn()
}));
jest.mock("../../../entities/transaction", () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock("../../../entities/order", () => ({
  belongsTo: jest.fn(),
}));
jest.mock("../../../entities/credential", () => ({
  belongsTo: jest.fn(),
}));

jest.mock("../../../entities/categories", () => ({
  belongsTo: jest.fn(),
}));
jest.mock("../../../entities/subCorporateUsers", () => ({
  belongsTo: jest.fn(),
}));
jest.mock("../../../entities/works", () => ({
  belongsTo: jest.fn(),
}));
jest.mock("../../../entities/pekoCloud/cloud_employees", () => ({
  belongsTo: jest.fn(),
}));
jest.mock("../../../entities/serviceOperator", () => ({
  belongsTo: jest.fn(),
}));

describe("findAllRecordsOrderListAndCount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call DB with correct where clause for basic search", async () => {
    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const params = {
      from: "2024-01-01",
      to: "2024-01-10",
      limit: 10,
      offset: 0,
      searchText: "abc",
    };

    await findAllRecordsOrderListAndCount(params);

    const call = transaction.findAndCountAll.mock.calls[0][0];
    const where = call.where;

    expect(where.transactionCategory).toBe("Verification Suite");

    // status check (ignore symbol key)
    const statusArray = Object.getOwnPropertySymbols(where.status)
      .map((sym) => where.status[sym])
      .find((val) => Array.isArray(val));

    expect(statusArray).toEqual(["SUCCESS", "REFUNDED"]);

    // createdAt BETWEEN check
    const createdAtArray = Object.getOwnPropertySymbols(where.createdAt)
      .map((sym) => where.createdAt[sym])
      .find((val) => Array.isArray(val));

    const expectedEndDate = new Date("2024-01-10");
    expectedEndDate.setDate(expectedEndDate.getDate() + 1);
    expectedEndDate.setHours(0, 0, 0, 0);

    expect(createdAtArray).toEqual(["2024-01-01", expectedEndDate]);
  });

  it("should apply status filter when status=VALID", async () => {
    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllRecordsOrderListAndCount({
      searchText: "",
      status: "VALID",
    });

    const where = transaction.findAndCountAll.mock.calls[0][0].where;

    // 🔥 Extract the real Op.and symbol from the where clause
    const andSymbol = Object.getOwnPropertySymbols(where)
      .find(s => s.toString().includes("and"));

    expect(andSymbol).toBeDefined();
    expect(where[andSymbol]).toBeDefined();
    expect(Array.isArray(where[andSymbol])).toBe(true);
    expect(where[andSymbol].length).toBeGreaterThan(0);
  });

  it("should generate OR clause when searchText provided", async () => {
    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllRecordsOrderListAndCount({ searchText: "test" });

    const where = transaction.findAndCountAll.mock.calls[0][0].where;

    // Dynamically detect the OR symbol
    const orSymbol = Object.getOwnPropertySymbols(where)
      .find(sym => sym.toString().includes("or"));

    expect(orSymbol).toBeDefined();

    const orArray = where[orSymbol];

    // It must be an array
    expect(Array.isArray(orArray)).toBe(true);

    // Your use-case ALWAYS generates exactly 5 OR conditions
    expect(orArray.length).toBe(5);

    // First two should be LIKE objects
    expect(typeof orArray[0]).toBe("object");
    expect(typeof orArray[1]).toBe("object");

    // The remaining 3 are Sequelize.where objects
    expect(orArray[2]).toHaveProperty("attribute");
    expect(orArray[3]).toHaveProperty("attribute");
    expect(orArray[4]).toHaveProperty("attribute");
  });

  it("should include subCorporateUserId when provided", async () => {
    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllRecordsOrderListAndCount({
      searchText: "",
      subCorporateUserId: 99,
    });

    expect(transaction.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          subCorporateUserId: 99,
        }),
      })
    );
  });



  it("should return DB results", async () => {
    const mockResult = { count: 3, rows: [{ id: 1 }] };
    transaction.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findAllRecordsOrderListAndCount({ searchText: "" });

    expect(result).toEqual(mockResult);
  });


  it("should throw error on DB failure", async () => {
    transaction.findAndCountAll.mockRejectedValue(new Error("DB failed"));

    await expect(findAllRecordsOrderListAndCount({ searchText: "" }))
      .rejects
      .toThrow("DB failed");
  });
});
