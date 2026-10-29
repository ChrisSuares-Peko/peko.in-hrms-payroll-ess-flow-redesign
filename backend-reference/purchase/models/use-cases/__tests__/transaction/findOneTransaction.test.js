const transaction = require("../../../entities/transaction");
const credential = require("../../../entities/credential");
const orders = require("../../../entities/order");
const { findOneTransaction } = require("../../../use-cases/transaction");

jest.mock("../../../entities/transaction", () => ({
  findOne: jest.fn(),
}));

describe("findOneTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the transaction when found", async () => {
    const mockParams = { corporateTxnId: "TXN12345" };
    const mockTransaction = {
      id: 1,
      corporateTxnId: "TXN12345",
      amount: 100,
      credential: { id: 1, name: "Test Credential" },
      orders: [{ id: 1, orderId: "ORDER123" }],
    };

    transaction.findOne.mockResolvedValue(mockTransaction);

    const result = await findOneTransaction(mockParams);

    expect(transaction.findOne).toHaveBeenCalledWith({
      where: { corporateTxnId: mockParams.corporateTxnId },
      include: [
        { model: credential, required: false },
        { model: orders, required: false },
      ],
    });

    expect(result).toEqual(mockTransaction);
  });

  it("should return null when no transaction is found", async () => {
    const mockParams = { corporateTxnId: "INVALID_TXN" };

    transaction.findOne.mockResolvedValue(null);

    const result = await findOneTransaction(mockParams);

    expect(transaction.findOne).toHaveBeenCalledWith({
      where: { corporateTxnId: mockParams.corporateTxnId },
      include: [
        { model: credential, required: false },
        { model: orders, required: false },
      ],
    });

    expect(result).toBeNull();
  });

  it("should handle errors and return undefined", async () => {
    const mockParams = { corporateTxnId: "ERROR_TXN" };
  
    transaction.findOne.mockRejectedValue(new Error("Database error"));
  
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  
    const result = await findOneTransaction(mockParams);
  
    expect(transaction.findOne).toHaveBeenCalled();
    expect(result).toBeUndefined();
  
    consoleLogSpy.mockRestore();
  });
  
});
