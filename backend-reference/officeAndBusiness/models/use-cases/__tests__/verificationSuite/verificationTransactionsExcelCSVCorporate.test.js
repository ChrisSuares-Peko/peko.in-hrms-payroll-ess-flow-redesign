const { verificationTransactionsExcelCSVCorporate } = require("../../verificationSuite");

const transaction = require("../../../entities/transaction");
const credential = require("../../../entities/credential");

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
  define: jest.fn(),
}));

describe("verificationTransactionsExcelCSVCorporate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // 1. BASIC WHERE + STATUS + OR MATCHING
  // --------------------------------------------------------------------------
  it("should hit DB with correct base where clause", async () => {
    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await verificationTransactionsExcelCSVCorporate({
      searchText: "abc",
    });

    const where = transaction.findAndCountAll.mock.calls[0][0].where;

    expect(where.transactionCategory).toBe("Verification Suite");

    // Symbol-safe extraction for [Op.in]
    const statusSymbol = Object.getOwnPropertySymbols(where.status)
      .find(sym => Array.isArray(where.status[sym]));

    expect(statusSymbol).toBeDefined();
    expect(where.status[statusSymbol]).toEqual(["SUCCESS", "REFUNDED"]);

    const orSymbol = Object.getOwnPropertySymbols(where)
      .find(sym => sym.toString().includes("or"));

    expect(orSymbol).toBeDefined();
    expect(Array.isArray(where[orSymbol])).toBe(true);
    expect(where[orSymbol].length).toBeGreaterThan(0);
  });

  // --------------------------------------------------------------------------
  // 2. FILTER: DATE RANGE (BETWEEN)
  // --------------------------------------------------------------------------
  it("should add date range when from/to provided", async () => {
    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await verificationTransactionsExcelCSVCorporate({
      from: "2024-01-01",
      to: "2024-01-10",
      searchText: "",
    });

    const where = transaction.findAndCountAll.mock.calls[0][0].where;

    const betweenSymbol = Object.getOwnPropertySymbols(where.createdAt)
      .find(s => Array.isArray(where.createdAt[s]));

    expect(where.createdAt[betweenSymbol][0]).toBe("2024-01-01");
    expect(where.createdAt[betweenSymbol][1] instanceof Date).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 3. FILTER: CORPORATE ID
  // --------------------------------------------------------------------------
  it("should apply credentialId filter", async () => {
    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await verificationTransactionsExcelCSVCorporate({
      searchText: "",
      credentialId: 500,
    });

    const where = transaction.findAndCountAll.mock.calls[0][0].where;
    expect(where.credentialId).toBe(500);
  });

  // --------------------------------------------------------------------------
  // 4. FILTER: STATUS = VALID
  // --------------------------------------------------------------------------
  it("should apply status filter when status=VALID", async () => {
    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await verificationTransactionsExcelCSVCorporate({
      searchText: "",
      status: "VALID",
    });

    const where = transaction.findAndCountAll.mock.calls[0][0].where;

    const andSymbol = Object.getOwnPropertySymbols(where)
      .find(sym => sym.toString().includes("and"));

    expect(andSymbol).toBeDefined();

    // Ensure AND exists and contains exactly one condition
    expect(Array.isArray(where[andSymbol])).toBe(true);
    expect(where[andSymbol].length).toBe(1);

  });

  // --------------------------------------------------------------------------
  // 5. FILTER: SUB CORPORATE USER
  // --------------------------------------------------------------------------
  it("should apply subCorporateUserId filter", async () => {
    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await verificationTransactionsExcelCSVCorporate({
      searchText: "",
      subCorporateUserId: 999,
    });

    const where = transaction.findAndCountAll.mock.calls[0][0].where;
    expect(where.subCorporateUserId).toBe(999);
  });

  // --------------------------------------------------------------------------
  // 6. FILTER: REGISTRATION USER (credential where clause)
  // --------------------------------------------------------------------------
  it("should pass registeredBy to credential filter", async () => {
    transaction.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await verificationTransactionsExcelCSVCorporate({
      searchText: "",
      registeredBy: "admin",
    });

    const include = transaction.findAndCountAll.mock.calls[0][0].include;
    const credentialInclude = include.find(i => i.model === credential);

    expect(credentialInclude.where.registeredBy).toBe("admin");
  });

  // --------------------------------------------------------------------------
  // 7. SHOULD RETURN FORMATTED FINAL DATA
  // --------------------------------------------------------------------------
  it("should return formatted export JSON", async () => {
    transaction.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [
        {
          corporateTxnId: "TXN123",
          createdAt: "2024-01-01",
          status: "SUCCESS",
          amountInINR: "100",
          orderResponse: JSON.stringify({
            InputDetails: {
              VerificationType: "AADHAAR",
              name: "John",
            },
            Result: {
              match: true
            }
          }),
        }
      ]
    });

    const result = await verificationTransactionsExcelCSVCorporate({
      searchText: "",
    });

    expect(result.length).toBe(1);
    expect(result[0]["Transaction ID"]).toBe("TXN123");
    expect(result[0]["Verification Type"]).toBe("AADHAAR");
    expect(result[0]["Input Details"]).toContain("Name: John");
    expect(result[0]["Status"]).toBe("SUCCESS");
  });

  // --------------------------------------------------------------------------
  // 8. DB FAILURE — SHOULD THROW
  // --------------------------------------------------------------------------
  it("should throw when DB fails", async () => {
    transaction.findAndCountAll.mockRejectedValue(new Error("DB Error"));

    await expect(
      verificationTransactionsExcelCSVCorporate({ searchText: "" })
    ).rejects.toThrow("DB Error");
  });
});
