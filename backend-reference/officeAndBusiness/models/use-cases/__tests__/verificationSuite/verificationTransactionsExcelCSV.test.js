const { verificationTransactionsExcelCSV } = require("../../verificationSuite");

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
// Sequelize Mock
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
    where: (attribute, logic) => ({ attribute, logic }),
  },
  define: jest.fn(),
}));



describe("verificationTransactionsExcelCSV", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. BASIC CALL — DB success
  // ---------------------------------------------------------------------------
  it("should hit DB with correct base where clause", async () => {
    transaction.findAndCountAll.mockResolvedValue({
      rows: [],
      count: 0,
    });

    await verificationTransactionsExcelCSV({
      searchText: "abc",
    });

    const call = transaction.findAndCountAll.mock.calls[0][0];
    const where = call.where;

    expect(where.transactionCategory).toBe("Verification Suite");

    const statusSymbol = Object.getOwnPropertySymbols(where.status)
      .find(s => s.toString().includes("in"));

    expect(statusSymbol).toBeDefined();

    const statusArray = where.status[statusSymbol];

    expect(statusArray).toEqual(["SUCCESS", "REFUNDED"]);
  });

  // ---------------------------------------------------------------------------
  // 2. DATE FILTER
  // ---------------------------------------------------------------------------
  it("should apply date BETWEEN filter", async () => {
    transaction.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await verificationTransactionsExcelCSV({
      from: "2024-01-01",
      to: "2024-01-10",
      searchText: "",
    });

    const where = transaction.findAndCountAll.mock.calls[0][0].where;
    // Get all Symbol keys on the status object
    const statusSymbols = Object.getOwnPropertySymbols(where.status);

    // Find the symbol whose value is an array (["SUCCESS", "REFUNDED"])
    const statusSymbol = statusSymbols.find(sym => {
      const val = where.status[sym];
      return Array.isArray(val) && val.includes("SUCCESS");
    });

    expect(statusSymbol).toBeDefined();

    const statusArray = where.status[statusSymbol];
    expect(statusArray).toEqual(["SUCCESS", "REFUNDED"]);

  });

  // ---------------------------------------------------------------------------
  // 3. STATUS FILTER (VALID/INVALID)
  // ---------------------------------------------------------------------------
  it("should apply status logic filter when status=VALID", async () => {
    transaction.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await verificationTransactionsExcelCSV({
      searchText: "",
      status: "VALID",
    });

    const where = transaction.findAndCountAll.mock.calls[0][0].where;

    const andSymbol = Object.getOwnPropertySymbols(where)
      .find((s) => s.toString().includes("and"));

    expect(andSymbol).toBeDefined();
    expect(Array.isArray(where[andSymbol])).toBe(true);
    expect(where[andSymbol].length).toBe(1); // Only 1 CASE WHEN block
  });

  // ---------------------------------------------------------------------------
  // 4. CORPORATE ID filter
  // ---------------------------------------------------------------------------
  it("should include credentialId when provided", async () => {
    transaction.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await verificationTransactionsExcelCSV({
      searchText: "",
      credentialId: 99,
    });

    const where = transaction.findAndCountAll.mock.calls[0][0].where;
    expect(where.credentialId).toBe(99);
  });

  // ---------------------------------------------------------------------------
  // 5. SUB CORPORATE ID filter
  // ---------------------------------------------------------------------------
  it("should include subCorporateUserId when provided", async () => {
    transaction.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await verificationTransactionsExcelCSV({
      searchText: "",
      subCorporateUserId: 55,
    });

    const where = transaction.findAndCountAll.mock.calls[0][0].where;
    expect(where.subCorporateUserId).toBe(55);
  });

  // ---------------------------------------------------------------------------
  // 6. registeredBy → filters nested credential
  // ---------------------------------------------------------------------------
  it("should pass registeredBy to credential include", async () => {
    transaction.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await verificationTransactionsExcelCSV({
      searchText: "",
      registeredBy: 10,
    });

    const include = transaction.findAndCountAll.mock.calls[0][0].include;

    const credentialInclude = include.find((i) => i.model === credential);

    expect(credentialInclude.where).toEqual({ registeredBy: 10 });
  });

  // ---------------------------------------------------------------------------
  // 7. RESPONSE FORMATTING / DEDUPLICATION
  // ---------------------------------------------------------------------------
  it("should dedupe by corporateTxnId (prefer REFUNDED)", async () => {
    transaction.findAndCountAll.mockResolvedValue({
      rows: [
        {
          corporateTxnId: "T1",
          status: "SUCCESS",
          createdAt: "2024-01-01",
          orderResponse: JSON.stringify({
            InputDetails: {
              VerificationType: "PAN",
              Accesskey: "pan_verify",
              name: "Sachin",
            },
            Result: { status: "VALID" },
          }),
          "credential.name": "Corp A",
          "credential.username": "corp_a",
          "credential.registeredByCredential.name": "Partner AA",
          amountInINR: "100",
        },
        {
          corporateTxnId: "T1",
          status: "REFUNDED",
          createdAt: "2024-01-01",
          orderResponse: JSON.stringify({
            InputDetails: {
              VerificationType: "PAN",
              Accesskey: "pan_verify",
              name: "Sachin",
            },
            Result: { status: "VALID" },
          }),
          "credential.name": "Corp A",
          "credential.username": "corp_a",
          "credential.registeredByCredential.name": "Partner AA",
          amountInINR: "100",
        },
      ],
      count: 2,
    });

    const result = await verificationTransactionsExcelCSV({
      searchText: "",
    });

    // Only ONE should remain — and it MUST be REFUNDED
    expect(result.length).toBe(1);
    expect(result[0].Status).toBe("REFUNDED");
  });

});
