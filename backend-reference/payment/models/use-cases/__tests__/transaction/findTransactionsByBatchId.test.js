const transaction = require("../../../entities/transaction");
const orders = require("../../../entities/order");
const { findTransactionsByBatchId } = require("../../transaction");

jest.mock("../../../entities/transaction", () => ({
  findAll: jest.fn(),
}));

jest.mock("../../../entities/order", () => ({}));

describe("findTransactionsByBatchId Service", () => {

  afterEach(() => jest.clearAllMocks());

  test("should return mapped transactions with corporateTxnId as integer", async () => {
    const mockTransactions = [
      { status: "SUCCESS", corporateTxnId: "101", orders: { id: 1 } },
      { status: "FAILED", corporateTxnId: "202", orders: { id: 2 } },
    ];

    transaction.findAll.mockResolvedValue(mockTransactions);

    const result = await findTransactionsByBatchId("BATCH123");

    expect(transaction.findAll).toHaveBeenCalledWith({
      where: { batchId: "BATCH123" },
      include: [{ model: orders }],
      attributes: ["status", "corporateTxnId"], // default attributes
      raw: true,
      nest: true,
    });

    expect(result).toEqual([
      { status: "SUCCESS", corporateTxnId: 101, orders: { id: 1 } },
      { status: "FAILED", corporateTxnId: 202, orders: { id: 2 } },
    ]);
  });

  test("should use custom attributes array", async () => {
    transaction.findAll.mockResolvedValue([
      { corporateTxnId: "999", creditAmount: 250 },
    ]);

    const result = await findTransactionsByBatchId("BATCH999", [
      "corporateTxnId",
      "creditAmount",
    ]);

    const [call] = transaction.findAll.mock.calls;

    expect(call[0].attributes).toEqual(["corporateTxnId", "creditAmount"]);

    expect(result).toEqual([
      { corporateTxnId: 999, creditAmount: 250 },
    ]);
  });

  test("should return empty array on DB error", async () => {
    transaction.findAll.mockRejectedValue(new Error("DB ERROR"));

    const result = await findTransactionsByBatchId("ERRORBATCH");

    expect(result).toEqual([]); // fallback behavior
  });
});
