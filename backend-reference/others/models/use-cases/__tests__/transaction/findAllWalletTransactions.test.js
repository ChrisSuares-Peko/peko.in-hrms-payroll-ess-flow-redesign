const { Op } = require("sequelize");
const { findAllWalletTransactions } = require("../../../use-cases/transaction");
const transaction = require("../../../entities/transaction");

jest.mock("../../../entities/transaction", () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock("../../../entities/credential");


jest.mock("../../../../utils/sortHandle", () => ({
    handleSortFields: jest.fn(),
  }));
  
describe("findAllWalletTransactions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  

  it("should return an empty result if no transactions are found", async () => {
    const mockParams = {
      from: "2025-01-01",
      to: "2025-01-02",
      limit: 10,
      offset: 0,
      searchText: "nonexistent",
    };

    // Mocking the response to be empty
    transaction.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    const result = await findAllWalletTransactions(mockParams);

    expect(result).toEqual({ rows: [], count: 0 });
  });

  it("windows on the IST calendar day, from the first day's midnight to the last day's last second", async () => {
    transaction.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    await findAllWalletTransactions({ from: "2025-01-01", to: "2025-01-02", limit: 10, offset: 0 });

    const [options] = transaction.findAndCountAll.mock.calls[0];
    expect(options.where.transactionDate[Op.between]).toEqual(["2025-01-01 00:00:00", "2025-01-02 23:59:59"]);

    transaction.findAndCountAll.mockClear();
    await findAllWalletTransactions({ from: new Date("2025-01-01T00:00:00.000Z"), to: new Date("2025-01-02T00:00:00.000Z"), limit: 10, offset: 0 });
    expect(transaction.findAndCountAll.mock.calls[0][0].where.transactionDate[Op.between]).toEqual(["2025-01-01 00:00:00", "2025-01-02 23:59:59"]);
  });

  it("should handle errors gracefully", async () => {
    const mockParams = {
      from: "2025-01-01",
      to: "2025-01-02",
      limit: 10,
      offset: 0,
      searchText: "test",
    };

    // Simulating an error in the database query
    transaction.findAndCountAll.mockRejectedValue(new Error("Database Error"));

    await expect(findAllWalletTransactions(mockParams)).rejects.toThrow("Database Error");
  });
});
