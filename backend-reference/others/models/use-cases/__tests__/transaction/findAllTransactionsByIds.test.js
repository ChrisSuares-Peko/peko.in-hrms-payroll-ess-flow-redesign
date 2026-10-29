const transaction = require("../../../entities/transaction");
const orders = require("../../../entities/order");
const serviceOperator = require("../../../entities/serviceOperator");
const { findAllTransactionsByIds } = require("../../transaction");
const { Op } = require("sequelize");

jest.mock("../../../entities/transaction");
jest.mock("../../../entities/order");
jest.mock("../../../entities/serviceOperator");

describe("findAllTransactionsByIds", () => {
  let mockCorporateTxnIds;

  beforeEach(() => {
    jest.clearAllMocks(); // Clear any previous mocks
    mockCorporateTxnIds = ["txn1", "txn2", "txn3"];
  });

  it("should return transactions organized by batchId", async () => {
    const mockTransactions = [
      { batchId: "batch1", corporateTxnId: "txn1", id: 1 },
      { batchId: "batch1", corporateTxnId: "txn2", id: 2 },
      { batchId: "batch2", corporateTxnId: "txn3", id: 3 },
    ];

    const mockFindAllResponse = mockTransactions;
    transaction.findAll.mockResolvedValue(mockFindAllResponse);

    const result = await findAllTransactionsByIds(mockCorporateTxnIds);

    // Check if transaction.findAll is called with the right parameters
    expect(transaction.findAll).toHaveBeenCalledWith({
      where: {
        corporateTxnId: {
          [Op.in]: mockCorporateTxnIds,
        },
      },
      include: [
        { model: orders },
        { model: serviceOperator },
      ],
    });

    // Check if the transactions are organized by batchId
    expect(result.transactionsByBatchObj).toEqual({
      batch1: [
        { batchId: "batch1", corporateTxnId: "txn1", id: 1 },
        { batchId: "batch1", corporateTxnId: "txn2", id: 2 },
      ],
      batch2: [
        { batchId: "batch2", corporateTxnId: "txn3", id: 3 },
      ],
    });
  });

  it("should return an empty result if no transactions match", async () => {
    const mockFindAllResponse = [];
    transaction.findAll.mockResolvedValue(mockFindAllResponse);

    const result = await findAllTransactionsByIds(mockCorporateTxnIds);

    // Ensure the result is empty
    expect(result.transactionsByBatchObj).toEqual({});
    expect(result.transactions).toEqual([]);
  });

  it("should handle errors when transaction.findAll throws an exception", async () => {
    const mockError = new Error("Database error");
    transaction.findAll.mockRejectedValue(mockError);

    await expect(findAllTransactionsByIds(mockCorporateTxnIds)).rejects.toThrow("Database error");
  });
});
