const { walletExcelCSV } = require("../../../use-cases/transaction");
const transaction = require("../../../entities/transaction");
const { handleSortFields } = require("../../../../utils/sortHandle");

jest.mock("../../../entities/transaction", () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock("../../../entities/credential");

jest.mock("../../../../utils/sortHandle", () => ({
  handleSortFields: jest.fn(),
}));

describe("walletExcelCSV", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty array if no transactions are found", async () => {
    const mockParams = {
      from: "2025-01-01",
      to: "2025-01-02",
      searchText: "nonexistent",
      sort: "desc",
      sortField: "transactionDate",
      userId: "user123",
      partnerId: "partner123",
    };

    transaction.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    const result = await walletExcelCSV(mockParams);

    expect(result).toEqual([]);
  });

  it("should return formatted transaction data", async () => {
    const mockParams = {
      from: "2025-01-01",
      to: "2025-01-02",
      searchText: "test",
      sort: "asc",
      sortField: "transactionDate",
      userId: "user123",
      partnerId: "partner123",
    };

    const mockData = {
      rows: [
        {
          transactionDate: "2025-01-01T12:00:00Z",
          corporateTxnId: "txn123",
          transactionType: "FUND TRANSFER",
          debitAmount: 1000,
          creditAmount: 500,
          status: "Completed",
          credential: {
            name: "Corporate Corp",
            username: "corp123",
          },
        },
      ],
      count: 1,
    };

    transaction.findAndCountAll.mockResolvedValue(mockData);
    handleSortFields.mockReturnValue([["transactionDate", "ASC"]]);

    const result = await walletExcelCSV(mockParams);

    expect(result).toEqual([
      {
        "Transaction Date": "2025-01-01T12:00:00Z",
        "Transaction ID": "txn123",
        "Corporate Name": "Corporate Corp",
        "Corporate ID": "corp123",
        "Transaction Type": "FUND TRANSFER",
        "Debit Amount": "₹ 1,000.00",
        "Credit Amount": "₹ 500.00",
        Status: "Completed",
      },
    ]);
  });

  it("should handle errors gracefully and return an empty array", async () => {
    const mockParams = {
      from: "2025-01-01",
      to: "2025-01-02",
      searchText: "error",
      sort: "desc",
      sortField: "transactionDate",
      userId: "user123",
      partnerId: "partner123",
    };

    // Simulating an error in the database query
    transaction.findAndCountAll.mockRejectedValue(new Error("Database Error"));

    const result = await walletExcelCSV(mockParams);

    expect(result).toEqual([]);
  });
});
