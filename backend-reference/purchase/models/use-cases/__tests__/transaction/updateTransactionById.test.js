const transaction = require("../../../entities/transaction");
const { updateTransactionById } = require("../../transaction");

jest.mock("../../../entities/transaction", () => ({
  update: jest.fn(),
}));

describe("updateTransactionById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {}); // Mock console.log
  });

  it("should update a transaction successfully and return affected rows count", async () => {
    const mockTransactionId = 1;
    const mockData = { status: "Completed" };
    const mockResponse = [1]; // Sequelize update() returns an array with affected row count

    transaction.update.mockResolvedValue(mockResponse);

    const result = await updateTransactionById(mockTransactionId, mockData);

    expect(transaction.update).toHaveBeenCalledWith(mockData, {
      where: { id: mockTransactionId },
    });
    expect(result).toEqual(mockResponse);
    expect(console.log).toHaveBeenCalledWith("TRANSACTION CREATE ROUTE CALLED");
  });

  it("should return [0] when no matching transaction is found", async () => {
    const mockTransactionId = 999; // Non-existing transaction
    const mockData = { status: "Pending" };

    transaction.update.mockResolvedValue([0]); // 0 rows affected

    const result = await updateTransactionById(mockTransactionId, mockData);

    expect(transaction.update).toHaveBeenCalledWith(mockData, {
      where: { id: mockTransactionId },
    });
    expect(result).toEqual([0]);
    expect(console.log).toHaveBeenCalledWith("TRANSACTION CREATE ROUTE CALLED");
  });

  it("should return undefined and log an error when update fails", async () => {
    const mockTransactionId = 2;
    const mockData = { status: "Failed" };
    const mockError = new Error("Database update failed");

    transaction.update.mockRejectedValue(mockError);

    const result = await updateTransactionById(mockTransactionId, mockData);

    expect(transaction.update).toHaveBeenCalledWith(mockData, {
      where: { id: mockTransactionId },
    });
    expect(console.log).toHaveBeenCalledWith(mockError.message);
    expect(console.log).toHaveBeenCalledWith("TRANSACTION CREATE ROUTE CALLED");
    expect(result).toBeUndefined();
  });
});
