const order = require("../../../entities/order");
const { findOneOrder } = require("../../order");

jest.mock("../../../entities/order", () => ({
  findOne: jest.fn(),
}));

describe("findOneOrder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {}); // Mock console.log
  });

  it("should find and return an order successfully", async () => {
    const mockParams = { corporateTxnId: "TXN12345" };
    const mockResponse = { id: 1, corporateTxnId: "TXN12345", amount: 200 };

    order.findOne.mockResolvedValue(mockResponse);

    const result = await findOneOrder(mockParams);

    expect(order.findOne).toHaveBeenCalledWith({
      where: { corporateTxnId: mockParams.corporateTxnId },
    });
    expect(result).toEqual(mockResponse);
    expect(console.log).toHaveBeenCalledWith("ORDER FIND ONE ROUTE CALLED");
  });

  it("should return undefined and log an error when findOne fails", async () => {
    const mockParams = { corporateTxnId: "TXN12345" };
    const mockError = new Error("Database query failed");

    order.findOne.mockRejectedValue(mockError);

    const result = await findOneOrder(mockParams);

    expect(order.findOne).toHaveBeenCalledWith({
      where: { corporateTxnId: mockParams.corporateTxnId },
    });
    expect(console.log).toHaveBeenCalledWith(mockError);
    expect(console.log).toHaveBeenCalledWith("ORDER FIND ONE ROUTE CALLED");
    expect(result).toBeUndefined();
  });

  it("should return null if no order is found", async () => {
    const mockParams = { corporateTxnId: "TXN_NOT_FOUND" };

    order.findOne.mockResolvedValue(null);

    const result = await findOneOrder(mockParams);

    expect(order.findOne).toHaveBeenCalledWith({
      where: { corporateTxnId: mockParams.corporateTxnId },
    });
    expect(result).toBeNull();
    expect(console.log).toHaveBeenCalledWith("ORDER FIND ONE ROUTE CALLED");
  });
});
