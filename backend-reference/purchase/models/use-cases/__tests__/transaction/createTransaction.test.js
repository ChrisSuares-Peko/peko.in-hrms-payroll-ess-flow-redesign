const { createTransaction } = require("../../transaction");
const transaction = require("../../../entities/transaction");

jest.mock("../../../entities/transaction");

describe("createTransaction function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn(); // Mock console.log
  });

  it("should create a transaction successfully", async () => {
    const mockParams = { orderId: 1, amount: 100, status: "pending" };
    const mockTransaction = { id: 1, ...mockParams };

    transaction.create.mockResolvedValue(mockTransaction);

    const result = await createTransaction(mockParams);

    expect(transaction.create).toHaveBeenCalledWith(mockParams);
    expect(result).toEqual(mockTransaction);
    expect(console.log).toHaveBeenCalledWith("TRANSACTION CREATE ROUTE CALLED");
  });

  it("should log an error if transaction creation fails", async () => {
    const mockParams = { orderId: 2, amount: 200, status: "failed" };
    const errorMessage = "Database error";

    transaction.create.mockRejectedValue(new Error(errorMessage));

    const result = await createTransaction(mockParams);

    expect(transaction.create).toHaveBeenCalledWith(mockParams);
    expect(console.log).toHaveBeenCalledWith(errorMessage);
    expect(console.log).toHaveBeenCalledWith("TRANSACTION CREATE ROUTE CALLED");
    expect(result).toBeUndefined(); // Since the function does not throw, it should return undefined
  });
});
