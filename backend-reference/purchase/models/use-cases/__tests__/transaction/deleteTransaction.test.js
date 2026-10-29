const { deleteTransaction } = require("../../transaction");
const transaction = require("../../../entities/transaction");

jest.mock("../../../entities/transaction");

describe("deleteTransaction function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
  });

  it("should delete a transaction successfully", async () => {
    const mockParams = { tranId: 123 };
    transaction.destroy.mockResolvedValue(1);

    const result = await deleteTransaction(mockParams);

    expect(transaction.destroy).toHaveBeenCalledWith({ where: { tranId: mockParams.tranId } });
    expect(result).toBe(1); 
    expect(console.log).toHaveBeenCalledWith("TRANSACTION DELETE ROUTE CALLED");
  });

  it("should log an error if transaction deletion fails", async () => {
    const mockParams = { tranId: 456 };
    const errorMessage = "Database error";
    transaction.destroy.mockRejectedValue(new Error(errorMessage));

    const result = await deleteTransaction(mockParams);

    expect(transaction.destroy).toHaveBeenCalledWith({ where: { tranId: mockParams.tranId } });
    expect(console.log).toHaveBeenCalledWith("TRANSACTION DELETE ROUTE CALLED");
    expect(result).toBeUndefined(); 
  });
});
